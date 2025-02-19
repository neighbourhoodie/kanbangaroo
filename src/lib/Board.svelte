<script lang="ts">
	import PouchDB from "pouchdb"
	import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
	import { onMount } from "svelte"

	import type {
		Card,
		NewCard,
		Column,
		AnyDoc,
		ActivityLog,
		Lock,
		OnlineUser,
		ConflictData,
	} from "./types"
	import { merge } from "./merge"
	import { sortBy } from "./helpers"
	import { niceRandomColor } from "./nice-random-color"

	import UserInfo from "./UserInfo.svelte"
	import ColumnComponent from "./Column.svelte"
	import CardComponent from "./Card.svelte"
	import CardEditSection from "./CardEditSection.svelte"
	import ConflictResolution from "./ConflictResolution.svelte"

	// Feature Flags

	const enableLocking = true
	const enableLoggingConflictInfo = true

	function logConflictInfo(...args: any[]) {
		if (!enableLoggingConflictInfo) return
		console.log(...args)
	}

	// Setup

	const DBURL = "http://localhost:5984/kanbangaroo"
	const db = new PouchDB(DBURL, {
		auth: {
			username: "admin",
			password: "admin",
		},
	})

	let currentUserName: string =
		localStorage.getItem("kanbangaroo-username") || uniqueNamesGenerator({
		dictionaries: [adjectives, colors, animals]
	});

	// The card that is currently being edited
	// Used to populate the edit fields
	let editableCard: Card | NewCard | undefined

	// The card that is currently being changed (editing or moving)
	// Used as a backup (base revision) for automated conflict resolution
	// Must be set at the very beginning of the interaction, eg. on drag start
	let currentlyEditing: Card | undefined
	let currentlyMoving: Card | undefined

	// Our data
	let cards: Card[] = []
	let columns: Column[] = []
	let conflictToResolve: ConflictData | undefined
	let locks: Lock[] = []
	let onlineUsers: OnlineUser[] = []

	// Lifecycle

	onMount(() => {
		setOnlineUser(currentUserName)
		const changes = db
			.changes<AnyDoc>({
				since: 0,
				live: true,
				include_docs: true,
			})
			.on("change", (change) => {
				if (change.doc) {
					switch (change.doc.type) {
						case "card":
							handleChange(cards, change)
							break
						case "column":
							handleChange(columns, change)
							break
						case "lock":
							handleChange(locks, change)
							break
						case "onlineUser":
							handleChange(onlineUsers, change)
							break
						default:
							break
					}
				}
				// Reassign everything so it’s reactive
				cards = [...cards.sort(sortBy("position"))]
				columns = [...columns.sort(sortBy("position"))]
				locks = locks
				onlineUsers = onlineUsers
			})
			.on("complete", (info) => {
				console.log("Changes follower complete/cancelled", info)
			})
			.on("error", (err) => {
				console.log("Changes follower error:", err)
			})
		return async () => {
			// Clean up after ourselves
			changes.cancel()
		}
	})

	// User handling

	async function updateUserName(name: string) {
		if (name === currentUserName) return
		await removeCurrentOnlineUser()
		currentUserName = name
		setOnlineUser(name)
	}

	async function setOnlineUser(userName: string) {
		const newOnlineUser: OnlineUser = {
			_id: `onlineuser-${userName}`,
			type: "onlineUser",
			active: true,
			name: userName,
			color: niceRandomColor(),
		}
		try {
			await db.put(newOnlineUser)
		} catch (error) {
			if ((error as PouchDB.Core.Error).status === 409) {
				// Previous session did not manage to delete the onlineUser doc
				// This happens during development due to HMR, for example
				console.log(
					"☝️ This 409 (Conflict) can be ignored, see the setOnlineUser function in the Board component"
				)
			}
		}
		localStorage.setItem("kanbangaroo-username", userName)
	}

	async function removeCurrentOnlineUser() {
		const currentUser = onlineUsers.find(
			(user) => user._id === `onlineuser-${currentUserName}`
		)
		if (!currentUser) return
		await db.put({
			...currentUser,
			_deleted: true,
		})
	}

	// Changes feed

	function handleChange(
		collection: AnyDoc[],
		change: PouchDB.Core.ChangesResponseChange<AnyDoc>
	) {
		if (!change || !change.doc) return
		const existingDocIndex = collection.findIndex(
			(item) => item._id === change.doc!._id
		)
		if (change.doc._deleted) {
			if (existingDocIndex > -1) {
				collection.splice(existingDocIndex, 1)
			}
		} else {
			if (existingDocIndex > -1) {
				collection[existingDocIndex] = change.doc
			} else {
				collection.push(change.doc)
			}
		}
	}

	// Drag and Drop handlers

	async function onDragStart(cardId: string) {
		const card = cards.find((card) => card._id === cardId)
		if (!card) return
		const lockAchieved = await lock(card._id)
		if (!lockAchieved) return
		currentlyMoving = { ...card }
	}

	async function onDropzoneHandler(column_id: string, targetPosition: number) {
		if (!currentlyMoving) return
		const card = { ...currentlyMoving }
		currentlyMoving = undefined
		card.column = column_id
		card.position = targetPosition
		await tryToPut(card, currentlyMoving)
	}

	// Locking and Unlocking

	async function lock(docId: string) {
		if (!enableLocking) return true
		const _id = `lock-${docId}`
		const lock: PouchDB.Core.PutDocument<Lock> = {
			_id,
			type: "lock",
			locks: docId,
			lockedAt: new Date().toJSON(),
			lockedBy: currentUserName,
		}
		let lockAchieved = false
		try {
			const lockResponse = await db.put(lock)
			if (lockResponse.ok) {
				lockAchieved = true
			}
		} catch (error) {
			if ((error as PouchDB.Core.Error).status === 409) {
				// TODO: pop up message about who locked it
			}
			console.log("lock error", error)
		}
		return lockAchieved
	}

	async function unlock(docId: string) {
		if (!enableLocking) return
		if (!docId) return
		const _id = `lock-${docId}`
		const lockDocument = locks.find((lock) => lock._id === _id)
		if (!lockDocument) return
    if (lockDocument?.lockedBy !== currentUserName) return
		try {
			await db.put({ ...lockDocument, _deleted: true })
		} catch (error) {
			console.log("unlock error", error)
		}
	}

	// Card handlers

	function handleNewCard() {
		editableCard = {
			type: "newCard",
			title: "",
			column: columns[0]._id,
			createdAt: new Date().toISOString(),
			createdBy: currentUserName,
		}
	}

	async function handleCardEdit(card: Card) {
		if (!card) return
		const lockAchieved = await lock(card._id)
		if (!lockAchieved) return
		// if we’re already editing a card, stop doing so
		if (currentlyEditing) {
			await unlock(currentlyEditing._id)
		}
		editableCard = { ...card }
		currentlyEditing = { ...card }
	}

	async function handleCardDelete(card: Card) {
		await tryToPut({ ...card, _deleted: true }, { ...card })
	}

	async function handleClearCardInputs(cardId?: string) {
		if (cardId) {
			await unlock(cardId)
		}
		editableCard = undefined
		currentlyEditing = undefined
	}

	async function handleSaveCard(card?: Card | NewCard) {
		if (!card) return
		if (card.type === "newCard") {
			const targetColumnId = card.column || columns[0]._id
			const cardsInTargetColumn = cards.findLast(
				(c) => c.column === targetColumnId
			)
			const positionOfLastCard = cardsInTargetColumn?.position || 0
			const positionOfNewCard = positionOfLastCard + 1
			card = {
				...card,
				type: "card",
				position: positionOfNewCard,
				// This only works on localhost or via https, not when exposing the app on the local network
				_id: `card-${crypto.randomUUID()}`,
			}
		}
		await tryToPut(card, currentlyEditing)
	}

	// Conflict-aware PUT

	async function tryToPut(
		newVersion: PouchDB.Core.PutDocument<Card>,
		baseRevision?: PouchDB.Core.PutDocument<Card>
	) {
		try {
			const putResponse = await db.put(newVersion)
			if (putResponse.ok) {
				const log: ActivityLog = {
					type: "activityLog",
					updatedAt: new Date().toISOString(),
					updatedBy: currentUserName,
					_id: `log-${putResponse.id}-${putResponse.rev}`,
				}
				db.put(log)
			}
			removeConflictData()
		} catch (error) {
			if ((error as PouchDB.Core.Error).status === 409) {
				// Can only happen if there was a baseRevision
				logConflictInfo("--------------------------------------")
				logConflictInfo("💥 A conflict occurred!")
				logConflictInfo("🤖 Start of automatic conflict resolution")
				logConflictInfo("- *️⃣ Base revision:", baseRevision)
				logConflictInfo("- 1️⃣ First conflicting revision:", newVersion)
				let secondConflict
				try {
					secondConflict = await db.get<Card>(newVersion._id)
					logConflictInfo("- 2️⃣ Second conflicting revision:", secondConflict)
					const mergeResult = merge(baseRevision, newVersion, secondConflict)
					logConflictInfo("- ⏩️ Result of the three-way-merge:", mergeResult)
					if (!mergeResult.conflicts) {
						const resolution = await db.put(mergeResult.merged)
						logConflictInfo("- 🆕 The new PUT payload is:", mergeResult.merged)
						logConflictInfo(
							"- ✅ The conflict could be resolved automatically: ",
							resolution
						)
						removeConflictData()
					} else {
						logConflictInfo(
							"❌ Could not resolve conflict automatically. These conflicts persist:",
							mergeResult.conflicts
						)
						conflictToResolve = {
							base: baseRevision!,
							mine: newVersion,
							theirs: secondConflict,
						}
					}
				} catch (error) {
					if ((error as PouchDB.Core.Error).reason === "deleted") {
						logConflictInfo(
							"🗑️ The second conflicting revision was deleted, could not attempt an automatic merge."
						)
						conflictToResolve = {
							base: baseRevision!,
							mine: newVersion,
							theirs: undefined,
						}
					}
				}
				logConflictInfo("End of automatic conflict resolution")
			}
		}
		await unlock(newVersion._id)
	}

	function removeConflictData() {
		// Removes local state concerning the current conflict.
		// This is also used to pick the other party as the conflict winner,
		// since their change is already in the DB, all we have to do is throw
		// our local change away
		conflictToResolve = undefined
		editableCard = undefined
	}
</script>

{#if conflictToResolve}
	<ConflictResolution
		{conflictToResolve}
		{columns}
		iWinHandler={tryToPut}
		theyWinHandler={removeConflictData}
		{db}
	/>
{/if}

<UserInfo {currentUserName} {onlineUsers} onUpdateUserName={updateUserName} />
<ul class="columns">
	{#each columns as column (column._id)}
		{@const cardsInColumn = cards.filter((card) => card.column === column._id)}
		<ColumnComponent {column} {onDropzoneHandler}>
			{#each cardsInColumn as card (card._id)}
				<CardComponent
					{card}
					{locks}
					{onlineUsers}
					{onDragStart}
					{handleCardEdit}
					{handleCardDelete}
          onLockEnd={handleClearCardInputs}
				/>
			{/each}
		</ColumnComponent>
	{/each}
</ul>
<CardEditSection
	{editableCard}
	{columns}
	{handleSaveCard}
	{handleClearCardInputs}
	{handleNewCard}
/>

<style>
	.columns {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		flex: 1;
		list-style: none;
		margin: 0;
		padding: 0;
		gap: 1rem;
	}
</style>
