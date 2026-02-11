<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	let mounted = false;

	type State = 'idle' | 'waiting' | 'ready' | 'done' | 'too-early';
	let state: State = 'idle';
	let readyTime = 0;
	let reactionTime = 0;
	let attempts: number[] = [];
	let timeout: ReturnType<typeof setTimeout>;
	let bestTime: number | null = null;

	function start() {
		state = 'waiting';
		const delay = 1500 + Math.random() * 4000; // 1.5 – 5.5s
		timeout = setTimeout(() => {
			state = 'ready';
			readyTime = performance.now();
		}, delay);
	}

	function handleClick() {
		if (state === 'idle') {
			start();
		} else if (state === 'waiting') {
			clearTimeout(timeout);
			state = 'too-early';
		} else if (state === 'ready') {
			reactionTime = Math.round(performance.now() - readyTime);
			attempts = [...attempts, reactionTime];
			if (bestTime === null || reactionTime < bestTime) {
				bestTime = reactionTime;
			}
			state = 'done';
		} else if (state === 'done' || state === 'too-early') {
			start();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.code === 'Space') {
			e.preventDefault();
			handleClick();
		}
	}

	$: average = attempts.length > 0
		? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length)
		: 0;

	function getReactionLabel(ms: number): string {
		if (ms < 150) return 'inhuman';
		if (ms < 200) return 'amazing';
		if (ms < 250) return 'great';
		if (ms < 300) return 'good';
		if (ms < 350) return 'average';
		if (ms < 400) return 'slow';
		return 'sleepy';
	}

	function getReactionColor(ms: number): string {
		if (ms < 150) return 'text-ocean-magenta';
		if (ms < 200) return 'text-ocean-cyan';
		if (ms < 250) return 'text-ocean-green';
		if (ms < 300) return 'text-ocean-yellow';
		if (ms < 350) return 'text-ocean-400';
		return 'text-ocean-red';
	}

	onMount(() => {
		mounted = true;
	});

	onDestroy(() => {
		clearTimeout(timeout);
	});
</script>

<svelte:head>
	<title>reaction test</title>
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

{#if mounted}
<section
	class="p-8 sm:p-12 lg:p-24 lg:py-16 font-cascadia"
	in:fade={{ duration: 200 }}
>
	<div class="max-w-2xl mx-auto">
		<div in:fly={{ y: 20, duration: 300 }}>
			<h1 class="text-2xl sm:text-3xl text-ocean-900 dark:text-ocean-100 mb-2">reaction test</h1>
			<p class="text-ocean-500 dark:text-ocean-400 text-sm mb-8">how fast can you react?</p>
		</div>

		<!-- Main clickable area -->
		<button
			class="w-full rounded-xl border-2 transition-all duration-200 select-none outline-none min-h-[280px] flex flex-col items-center justify-center gap-3 {
				state === 'idle'
					? 'bg-ocean-100/50 dark:bg-ocean-800/30 border-ocean-200/50 dark:border-ocean-700/30 hover:border-ocean-cyan/40'
					: state === 'waiting'
						? 'bg-ocean-red/10 border-ocean-red/30'
						: state === 'ready'
							? 'bg-ocean-green/15 border-ocean-green/40'
							: state === 'too-early'
								? 'bg-ocean-yellow/10 border-ocean-yellow/30'
								: 'bg-ocean-100/50 dark:bg-ocean-800/30 border-ocean-200/50 dark:border-ocean-700/30'
			}"
			on:click={handleClick}
			in:fly={{ y: 20, duration: 300, delay: 100 }}
		>
			{#if state === 'idle'}
				<span class="text-4xl">🎯</span>
				<span class="text-ocean-600 dark:text-ocean-300 text-lg">click to start</span>
				<span class="text-ocean-400 dark:text-ocean-500 text-xs">or press space</span>
			{:else if state === 'waiting'}
				<span class="text-4xl">🔴</span>
				<span class="text-ocean-red text-lg">wait for green...</span>
				<span class="text-ocean-400 dark:text-ocean-500 text-xs">don't click yet!</span>
			{:else if state === 'ready'}
				<span class="text-4xl">🟢</span>
				<span class="text-ocean-green text-xl font-bold">CLICK NOW!</span>
			{:else if state === 'too-early'}
				<span class="text-4xl">😬</span>
				<span class="text-ocean-yellow text-lg">too early!</span>
				<span class="text-ocean-400 dark:text-ocean-500 text-xs">click to try again</span>
			{:else if state === 'done'}
				<span class="text-4xl">⚡</span>
				<span class="{getReactionColor(reactionTime)} text-4xl font-bold">{reactionTime}ms</span>
				<span class="{getReactionColor(reactionTime)} text-sm">{getReactionLabel(reactionTime)}</span>
				<span class="text-ocean-400 dark:text-ocean-500 text-xs mt-2">click to try again</span>
			{/if}
		</button>

		<!-- Stats -->
		{#if attempts.length > 0}
			<div
				class="mt-6 grid grid-cols-3 gap-4"
				in:fly={{ y: 10, duration: 200 }}
			>
				<div class="bg-ocean-100/50 dark:bg-ocean-800/30 rounded-lg p-4 border border-ocean-200/50 dark:border-ocean-700/30 text-center">
					<p class="text-ocean-cyan text-xl font-bold">{bestTime}ms</p>
					<p class="text-ocean-500 dark:text-ocean-400 text-xs mt-1">best</p>
				</div>
				<div class="bg-ocean-100/50 dark:bg-ocean-800/30 rounded-lg p-4 border border-ocean-200/50 dark:border-ocean-700/30 text-center">
					<p class="text-ocean-yellow text-xl font-bold">{average}ms</p>
					<p class="text-ocean-500 dark:text-ocean-400 text-xs mt-1">average</p>
				</div>
				<div class="bg-ocean-100/50 dark:bg-ocean-800/30 rounded-lg p-4 border border-ocean-200/50 dark:border-ocean-700/30 text-center">
					<p class="text-ocean-magenta text-xl font-bold">{attempts.length}</p>
					<p class="text-ocean-500 dark:text-ocean-400 text-xs mt-1">attempts</p>
				</div>
			</div>

			<!-- History -->
			<div
				class="mt-4 bg-ocean-100/50 dark:bg-ocean-800/30 rounded-lg p-4 border border-ocean-200/50 dark:border-ocean-700/30"
				in:fly={{ y: 10, duration: 200 }}
			>
				<p class="text-ocean-500 dark:text-ocean-400 text-xs mb-2">history</p>
				<div class="flex flex-wrap gap-2">
					{#each attempts as time, i}
						<span class="text-xs px-2 py-1 rounded {getReactionColor(time)} bg-ocean-200/30 dark:bg-ocean-700/20">
							#{i + 1}: {time}ms
						</span>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</section>
{/if}
