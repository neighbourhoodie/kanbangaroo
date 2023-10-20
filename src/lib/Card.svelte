<script lang="ts">
	import { draggable } from "./drag-and-drop"
	import type { Card } from "./types"

	export let card: Card

	export let onDragStart: (cardId: string) => void
	export let handleCardEdit: (card: Card) => void
	export let handleCardDelete: (card: Card) => void
</script>

<div
	use:draggable={{
		card_id: card._id,
		on_drag_start: onDragStart,
	}}
	class="card"
	data-position={card.position}
>
	<span class="title">{card.title}</span>
	<span class="position">{card.position}</span>
	<button on:click={() => handleCardEdit(card)}>✏️</button>
	<button on:click={() => handleCardDelete(card)}>❌</button>
</div>

<style>
	@keyframes pop-in {
		0% {
			opacity: 0.5;
			transform: scale(0.9);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	.card {
		padding: 1rem;
		background-color: var(--sk-back-1);
		border: 3px solid black;
		border-radius: 0.5rem;
		border-color: var(--sk-back-5);
		text-align: left;
		position: relative;
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		align-items: center;
		column-gap: 1em;
		animation: pop-in 0.25s;
	}

	.card .title {
		flex-grow: 2;
	}

	.card:global(.droppable):before {
		content: "";
		display: block;
		height: 3px;
		width: 80%;
		background-color: var(--sk-theme-3);
		position: absolute;
		top: -0.75em;
		left: 10%;
	}

	.card:global(.droppable-end):after {
		content: "";
		display: block;
		height: 3px;
		width: 80%;
		background-color: var(--sk-theme-3);
		position: absolute;
		bottom: -0.75em;
		left: 10%;
	}

	.position {
		display: block;
		position: absolute;
		top: 0;
		right: 0.35em;
		font-size: 0.75em;
		font-weight: 800;
		color: lightgrey;
	}
</style>
