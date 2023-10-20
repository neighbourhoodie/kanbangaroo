<script lang="ts">
	import PouchDB from "pouchdb"
	import { onMount } from "svelte"

	import type { Card, NewCard, Column, AnyDoc } from "./types"
	import { sortBy } from "./helpers"

	import UserInfo from "./UserInfo.svelte"
	import ColumnComponent from "./Column.svelte"
	import CardComponent from "./Card.svelte"
	import CardEditSection from "./CardEditSection.svelte"

	// Setup

	const DBURL = "http://localhost:5984/kanbangaroo"
	const db = new PouchDB(DBURL, {
		auth: {
			username: "admin",
			password: "admin",
		},
	})

	let currentUserName: string =
		localStorage.getItem("kanbangaroo-username") ||
		`anonymous-${Math.round(Math.random() * 10000)}`

	// The card that is currently being edited
	// Used to populate the edit fields
	let editableCard: Card | NewCard | undefined

	// The card that is currently being changed (editing or moving)
	// Used as a backup (base revision) for automated conflict resolution
	// Must be set at the very beginning of the interaction, eg. on drag start
	let currentlyEditing: Card | undefined
	let currentlyMoving: Card | undefined
	let currentlyDeleting: Card | undefined

	// Our data
	let cards: Card[] = []
	let columns: Column[] = []

	// Lifecycle

	onMount(() => {
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
						default:
							break
					}
				}
				// Reassign everything so it’s reactive
				cards = [...cards.sort(sortBy("position"))]
				columns = [...columns.sort(sortBy("position"))]
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
		localStorage.setItem("kanbangaroo-username", name)
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
		currentlyMoving = { ...card }
	}

	async function onDropzoneHandler(column_id: string, targetPosition: number) {
		if (!currentlyMoving) return
		const card = { ...currentlyMoving }
		card.column = column_id
		card.position = targetPosition
		await tryToPut(card)
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
		editableCard = { ...card }
		currentlyEditing = { ...card }
	}

	async function handleCardDelete(card: Card) {
		currentlyDeleting = { ...card }
		await tryToPut({ ...card, _deleted: true })
	}

	async function handleClearCardInputs(cardId?: string) {
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
		await tryToPut(card)
	}

	// Conflict-aware PUT

	async function tryToPut(newVersion: PouchDB.Core.PutDocument<Card>) {
		try {
			await db.put({
				...newVersion,
				updatedAt: new Date().toISOString(),
				updatedBy: currentUserName,
			})
		} catch (error) {
			if ((error as PouchDB.Core.Error).status === 409) {
				console.log("Conflict: Could not save your changes!", error)
			}
		}
		handleClearCardInputs(newVersion._id)
	}
</script>

<UserInfo {currentUserName} onUpdateUserName={updateUserName} />
<ul class="columns">
	{#each columns as column (column._id)}
		{@const cardsInColumn = cards.filter((card) => card.column === column._id)}
		<ColumnComponent {column} {onDropzoneHandler}>
			{#each cardsInColumn as card (card._id)}
				<CardComponent
					{card}
					{onDragStart}
					{handleCardEdit}
					{handleCardDelete}
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
