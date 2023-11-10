<script lang="ts">
  import { onMount } from "svelte"

  export let lockedAt
  export let unlock

  const lockDurationMS = 1000 * 10
  const willUnlockAt = new Date(lockedAt).getTime() + lockDurationMS
  let timeInterval: ReturnType<typeof setInterval> | undefined

  const toReadableDuration = (ms: number) => {
    const remainingTimeAsDate = new Date(ms)
    return `${remainingTimeAsDate.getMinutes().toString().padStart(2, '0')}:${remainingTimeAsDate.getSeconds().toString().padStart(2, '0')}`
  }

  let remainingTime: string = toReadableDuration(lockDurationMS)

  const displayRemainingTime = () => {
    const remainingMS = new Date(willUnlockAt).getTime() - new Date().getTime()
    if (remainingMS <= 0) {
      if (timeInterval) clearInterval(timeInterval)
      unlock()
      } else {
      remainingTime = toReadableDuration(remainingMS)
    }
  }

	onMount(() => {
    timeInterval = setInterval(() => {
      displayRemainingTime()
    },1000);

    displayRemainingTime()
    return () => {
      clearInterval(timeInterval)
    }
	})
</script>

<span>{remainingTime}</span>
