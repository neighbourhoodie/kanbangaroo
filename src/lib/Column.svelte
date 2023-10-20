<script lang="ts">
	import { dropzone } from "./drag-and-drop"
	import type { Column } from "./types"

	export let column: Column
	export let onDropzoneHandler: (
		column_id: string,
		targetPosition: number
	) => void
</script>

<li class="column">
	<h2>
		{column.label}
	</h2>
	<ul
		class="cards"
		use:dropzone={{
			column_id: column._id,
			on_dropzone: onDropzoneHandler,
		}}
	>
		<slot />
	</ul>
</li>

<style>
	.column {
		overflow: scroll;
		padding: 1rem;
		background-color: var(--sk-back-1);
		border: 1px solid black;
		border-radius: 0.5rem;
		border-color: var(--sk-back-5);
		text-align: left;
		min-width: 25ch;
		display: flex;
		flex-direction: column;
		transition: all 0.5s;
	}

	h2 {
		margin-block-start: 0;
		margin-block-end: 0.5rem;
	}

	.cards {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		gap: 1rem;
		flex-direction: column;
		flex-grow: 2;
	}

	.cards:global(.droppable):after {
		content: "";
		display: block;
		height: 4em;
		width: 100;
		background-color: var(--sk-theme-3);
		opacity: 0.5;
		border-radius: 0.5rem;
	}

	.cards:global(.droppable) * {
		pointer-events: none;
	}
</style>
