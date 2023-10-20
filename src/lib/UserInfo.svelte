<script lang="ts">
	export let currentUserName: string
	export let onUpdateUserName: (name: string) => void
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
</style>
