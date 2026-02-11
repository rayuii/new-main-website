<script lang="ts">
	import { fade, fly } from 'svelte/transition';

	export let text: string;
	export let position: 'top' | 'bottom' = 'top';

	let visible = false;
	let timeout: ReturnType<typeof setTimeout>;

	function show() {
		clearTimeout(timeout);
		visible = true;
	}

	function hide() {
		timeout = setTimeout(() => visible = false, 50);
	}
</script>

<span
	class="relative inline-flex"
	on:mouseenter={show}
	on:mouseleave={hide}
	on:focus={show}
	on:blur={hide}
	role="tooltip"
>
	<slot />

	{#if visible}
		<span
			class="absolute z-50 pointer-events-none {position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2"
			in:fly={{ y: position === 'top' ? 4 : -4, duration: 150 }}
			out:fade={{ duration: 100 }}
		>
			<span class="block px-2.5 py-1.5 rounded-md bg-ocean-950 dark:bg-ocean-950 text-white text-[11px] font-medium whitespace-nowrap shadow-xl ring-1 ring-ocean-800/20 dark:ring-ocean-700/30">
				{text}
			</span>
			<span
				class="absolute left-1/2 -translate-x-1/2 {position === 'top' ? 'top-full border-t-ocean-950' : 'bottom-full border-b-ocean-950'} border-[5px] border-transparent"
			></span>
		</span>
	{/if}
</span>
