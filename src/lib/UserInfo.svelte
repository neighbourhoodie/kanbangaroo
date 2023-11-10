<script lang="ts">
	import { onMount } from "svelte"
	import { getTextColor } from "./nice-random-color"
	import type { OnlineUser } from "./types"

	export let currentUserName: string
	export let onlineUsers: OnlineUser[]

	export let onUpdateUserName: (name: string) => void

	const retryDelay = 15 * 1000

	// Point this to where your kanbangaroo backend from
	// https://github.com/neighbourhoodie/kanbangaroo-backend
	// is running
	const onlineUserURL = "http://localhost:8000/onlineuser"
	let controller = new AbortController()
	const signal = controller.signal

	async function subscribe() {
		try {
			await fetch(`${onlineUserURL}?username=${currentUserName}`, { signal })
		} catch (error) {
			await new Promise((resolve) => setTimeout(resolve, retryDelay))
		}
		subscribe()
	}

	onMount(() => {
		if (currentUserName) {
			subscribe()
		}
		return () => {
			// In production, it might make sense to abort the 
			// long-poll request once the user leaves the Kanban board.
			// We’re commenting that out though, since this fires on every 
			// HMR change, which makes testing in dev really annoying.
			// But this is how you’d do it.
			// controller?.abort();
		}
	})
</script>

<section class="userinfo">
	<div>
		<form on:submit|preventDefault={(e) => onUpdateUserName(currentUserName)}>
			<label for="currentUserName">
				<span>Your Name</span>
				<input
					type="text"
					id="currentUserName"
					name="currentUserName"
					autofocus
					bind:value={currentUserName}
					on:blur={(e) => onUpdateUserName(e.currentTarget.value)}
				/>
			</label>
		</form>
	</div>
	<div class="onlineUsers">
		{#each onlineUsers as user (user._id)}
			{@const isInactive = !user?.active}
			<div
				class="onlineUser"
				class:inactive={isInactive}
				style:background-color={user.color}
			>
				<span style:color={getTextColor(user.color)}>{user.name}</span>
			</div>
		{/each}
	</div>
</section>

<style>
	section.userinfo {
		border: 0;
		border-radius: 0 0 0.5em 0.5em;
    border: 1px solid var(--sk-back-5);
    border-top: none;
		display: flex;
		justify-content: space-between;
    margin-block-end: 1em;
	}
	.onlineUsers {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-content: flex-start;
		justify-content: flex-end;
		align-items: center;
		column-gap: 0.5em;
	}

	.onlineUser {
		border-radius: 1em;
		padding: 0 0.75em;
		margin-block-end: 0.5em;
		background-color: currentColor;
	}

	.inactive {
		opacity: 0.25;
	}

	.onlineUser span {
		font-weight: 600;
	}
</style>
