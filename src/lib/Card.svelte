<script lang="ts">
	import Countdown from './Countdown.svelte'
	import { draggable } from "./drag-and-drop"
	import { getTextColor } from "./nice-random-color"
	import type { Card, Lock, OnlineUser } from "./types"

	export let locks: Lock[] = []
	export let card: Card
	export let onlineUsers: OnlineUser[] = []
	export let isReadOnly = false

	type NoOp = () => {}

	// Handlers are optional, since a readonly card has none
	export let onDragStart: ((cardId: string) => void) | NoOp = () => {}
	export let handleCardEdit: ((card: Card) => void) | NoOp = () => {}
	export let handleCardDelete: ((card: Card) => void) | NoOp = () => {}
  export let onLockEnd:  ((cardId: string) => void) = () => {}

	$: lock = locks.find((lock) => lock.locks === card._id)
	$: lockingUser = onlineUsers.find((user) => user.name === lock?.lockedBy)
</script>

<div
	use:draggable={{
		card_id: card._id,
		on_drag_start: onDragStart,
	}}
	class="card"
	class:readonly={isReadOnly}
	class:locked={lock}
	data-lockedby={lock?.lockedBy}
	style:border-color={lockingUser?.color && lockingUser?.color}
	data-position={card.position}
>
	{#if lock}
		<span
			class="lockLabel"
      style:background-color={lockingUser?.color}
			style:color={getTextColor(
				lockingUser?.color
			)}>{lock?.lockedBy} <Countdown lockedAt={lock?.lockedAt} unlock={() => onLockEnd(card._id)}/></span
		>
	{/if}
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

	.card.readonly {
		pointer-events: none;
	}

	.card.locked {
		pointer-events: none;
		border-width: 3px;
	}

	.card.locked * {
		opacity: 0.5;
	}

	.card.locked .lockLabel {
		position: absolute;
		top: -0.8em;
		font-size: 0.75em;
		font-weight: 600;
		border-radius: 1em;
		padding: 0 0.75em;
		opacity: 1;
	}

	.card.locked:before {
		content: "🔒";
		filter: grayscale(1) brightness(0);
		display: block;
		position: absolute;
		width: calc(100% - 2em);
		z-index: 1;
		text-align: center;
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
