<script lang="ts">
	import type { Card, Column, NewCard } from "./types"

	export let editableCard: Card | NewCard | undefined
	export let columns: Column[]
	export let handleSaveCard: (card?: Card | NewCard) => void
	export let handleClearCardInputs: (cardId?: string) => void
	export let handleNewCard: () => void
</script>

<section class="editing">
	{#if editableCard}
    <form on:submit|preventDefault={(e) => handleSaveCard(editableCard)}>
      <label for="title">
        <span>Title</span>
        <input
          type="text"
          id="title"
          name="title"
          autofocus
          bind:value={editableCard.title}
        />
      </label>
      <label for="column">
        <span>Column</span>
        <select bind:value={editableCard.column} id="column">
          {#each columns as column}
            <option value={column._id}>{column.label}</option>
          {/each}
        </select>
      </label>
      <button type="submit">Save</button>
      <button
        on:click|preventDefault={() =>
          handleClearCardInputs(
            editableCard?.type === "card" ? editableCard._id : undefined
          )}>Cancel</button
      >
    </form>
	{:else}
		<button on:click={() => handleNewCard()}>Add new Card</button>
	{/if}
</section>

<style>
	section {
		margin-top: 1rem;
	}

	.editing {
		display: flex;
		column-gap: 1em;
		align-items: flex-end;
	}

  .editing form {
    display: flex;
    flex-direction: row;
    gap: 1em;
    align-items: end;
  }
</style>
