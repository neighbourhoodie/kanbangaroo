<script lang="ts">
	import {
		type ActivityLog,
		type Card,
		type Column,
		type ConflictData,
	} from "./types"
	import CardComponent from "./Card.svelte"

	export let conflictToResolve: ConflictData
	export let columns: Column[]
	export let iWinHandler: (
		newVersion: Card,
		baseRevision?: Card | undefined
	) => void
	export let theyWinHandler: () => void
	export let db: PouchDB.Database

	const logForTheirs = conflictToResolve.theirs
		? db.get<ActivityLog>(
				`log-${conflictToResolve.theirs?._id}-${conflictToResolve.theirs?._rev}`
		  )
		: null

	const myWinningVersion: PouchDB.Core.PostDocument<Card> = {
		...conflictToResolve.mine,
		// This is a shortcut, we’re stealing the current winning revision’s
		// _rev and using it to make our version the winning one. In the real
		// world, you might want to merge your changes into the current winning
		// revision instead
		// If they deleted the card, we want to create it again, which means
		// PUTting it without a _rev
		_rev: conflictToResolve.theirs?._rev || undefined,
	}
</script>

<section class="conflictResolution">
	<h2>Could not complete your update</h2>
	<p>Someone else has made a change to this card at the same time as you.</p>
	<p>Please pick which version should be saved:</p>

	{#await logForTheirs}
		<p>Loading log data…</p>
	{:then logDocument}
		<section class="conflictingCards">
			<div>
				<p>Change made by you:</p>
				<CardComponent isReadOnly={true} card={conflictToResolve.mine} />
				<div class="columnInfo">
					<strong>Column:</strong>
					{columns.find((c) => c._id === conflictToResolve.mine.column)?.label}
				</div>
				<button
					on:click={() =>
						iWinHandler(myWinningVersion, conflictToResolve.theirs)}
					>Pick your change</button
				>
			</div>
			<div>
				<p>Change made by {logDocument?.updatedBy || "them"}:</p>
				{#if conflictToResolve.theirs}
					<CardComponent isReadOnly={true} card={conflictToResolve.theirs} />
					<div class="columnInfo">
						<strong>Column:</strong>
						{columns.find((c) => c._id === conflictToResolve.theirs?.column)
							?.label}
					</div>
					<button on:click={theyWinHandler}
						>Pick {logDocument?.updatedBy}’s change</button
					>
				{:else}
					<p>The card was deleted</p>
					<button on:click={theyWinHandler}>Accept the deletion</button>
				{/if}
			</div>
		</section>
	{/await}
</section>

<style>
	.conflictResolution {
		position: fixed;
		z-index: 1;
		width: calc(100vw - 2em);
		height: calc(100vh - 2em);
		left: 0;
		top: 0;
	}

	.conflictingCards {
		display: flex;
		flex-wrap: nowrap;
		justify-content: center;
		column-gap: 4em;
	}

	.conflictingCards div {
		min-width: 20em;
	}

	.columnInfo {
		margin-block: 1em;
	}
</style>
