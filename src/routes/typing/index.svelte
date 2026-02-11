<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	let mounted = false;

	const words = [
		'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I',
		'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
		'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
		'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
		'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
		'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
		'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
		'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
		'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
		'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
		'speed', 'mouse', 'click', 'stream', 'score', 'combo', 'miss', 'play', 'rank', 'map',
		'cursor', 'circle', 'slider', 'spin', 'aim', 'jump', 'rhythm', 'beat', 'note', 'star',
		'code', 'type', 'fast', 'slow', 'great', 'best', 'next', 'last', 'long', 'high',
		'world', 'every', 'still', 'should', 'never', 'life', 'keep', 'much', 'while', 'right'
	];

	type State = 'idle' | 'playing' | 'done';
	let state: State = 'idle';
	let wordCount = 30;
	let targetWords: string[] = [];
	let typed = '';
	let currentWordIndex = 0;
	let startTime = 0;
	let endTime = 0;
	let inputEl: HTMLInputElement;
	let correctChars = 0;
	let totalChars = 0;
	let wordResults: ('correct' | 'incorrect' | 'pending')[] = [];
	let elapsed = 0;
	let timerInterval: ReturnType<typeof setInterval>;
	let bestWpm: number | null = null;

	function generateWords() {
		targetWords = [];
		for (let i = 0; i < wordCount; i++) {
			targetWords.push(words[Math.floor(Math.random() * words.length)]);
		}
		wordResults = targetWords.map(() => 'pending');
	}

	function startTest() {
		generateWords();
		state = 'playing';
		typed = '';
		currentWordIndex = 0;
		correctChars = 0;
		totalChars = 0;
		elapsed = 0;
		startTime = 0;
		endTime = 0;
		setTimeout(() => inputEl?.focus(), 50);
	}

	function handleInput() {
		if (state !== 'playing') return;

		if (startTime === 0) {
			startTime = performance.now();
			timerInterval = setInterval(() => {
				elapsed = (performance.now() - startTime) / 1000;
			}, 100);
		}

		if (typed.endsWith(' ')) {
			const typedWord = typed.trim();
			const expected = targetWords[currentWordIndex];
			totalChars += expected.length;

			if (typedWord === expected) {
				correctChars += expected.length;
				wordResults[currentWordIndex] = 'correct';
			} else {
				wordResults[currentWordIndex] = 'incorrect';
			}

			currentWordIndex++;
			typed = '';

			if (currentWordIndex >= targetWords.length) {
				finishTest();
			}
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			reset();
		}
	}

	function finishTest() {
		endTime = performance.now();
		clearInterval(timerInterval);
		state = 'done';
		const minutes = (endTime - startTime) / 60000;
		const wpm = Math.round((correctChars / 5) / minutes);
		if (bestWpm === null || wpm > bestWpm) {
			bestWpm = wpm;
		}
	}

	function reset() {
		state = 'idle';
		typed = '';
		currentWordIndex = 0;
		correctChars = 0;
		totalChars = 0;
		elapsed = 0;
		clearInterval(timerInterval);
	}

	$: wpm = endTime && startTime
		? Math.round((correctChars / 5) / ((endTime - startTime) / 60000))
		: 0;

	$: accuracy = totalChars > 0
		? Math.round((correctChars / totalChars) * 100)
		: 100;

	$: liveWpm = elapsed > 0 && state === 'playing'
		? Math.round((correctChars / 5) / (elapsed / 60))
		: 0;

	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>typing test</title>
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

{#if mounted}
<section
	class="p-8 sm:p-12 lg:p-24 lg:py-16 font-cascadia"
	in:fade={{ duration: 200 }}
>
	<div class="max-w-3xl mx-auto">
		<div in:fly={{ y: 20, duration: 300 }}>
			<h1 class="text-2xl sm:text-3xl text-ocean-900 dark:text-ocean-100 mb-2">typing test</h1>
			<p class="text-ocean-500 dark:text-ocean-400 text-sm mb-8">how fast can you type?</p>
		</div>

		{#if state === 'idle'}
			<div
				class="text-center space-y-6"
				in:fly={{ y: 20, duration: 300, delay: 100 }}
			>
				<div class="flex justify-center gap-3">
					{#each [15, 30, 50] as count}
						<button
							class="px-4 py-2 rounded-lg text-sm transition-all {wordCount === count
								? 'bg-ocean-cyan/20 text-ocean-cyan border border-ocean-cyan/40'
								: 'bg-ocean-100/50 dark:bg-ocean-800/30 text-ocean-600 dark:text-ocean-400 border border-ocean-200/50 dark:border-ocean-700/30 hover:border-ocean-cyan/30'}"
							on:click={() => wordCount = count}
						>
							{count} words
						</button>
					{/each}
				</div>

				<button
					class="px-8 py-3 bg-ocean-cyan/15 text-ocean-cyan border border-ocean-cyan/30 rounded-lg hover:bg-ocean-cyan/25 transition-all text-sm"
					on:click={startTest}
				>
					start test
				</button>

				{#if bestWpm !== null}
					<p class="text-ocean-500 dark:text-ocean-400 text-xs">best: {bestWpm} wpm</p>
				{/if}
			</div>
		{/if}

		{#if state === 'playing'}
			<div in:fly={{ y: 20, duration: 200 }}>
				<!-- Live stats bar -->
				<div class="flex justify-between items-center mb-6 text-sm">
					<div class="flex gap-6">
						<span class="text-ocean-500 dark:text-ocean-400">
							<span class="text-ocean-cyan">{liveWpm}</span> wpm
						</span>
						<span class="text-ocean-500 dark:text-ocean-400">
							<span class="text-ocean-cyan">{currentWordIndex}</span>/{targetWords.length}
						</span>
					</div>
					<span class="text-ocean-500 dark:text-ocean-400">
						{elapsed.toFixed(1)}s
					</span>
				</div>

				<!-- Word display -->
				<div class="bg-ocean-100/50 dark:bg-ocean-800/30 rounded-lg p-6 border border-ocean-200/50 dark:border-ocean-700/30 mb-6 leading-8 select-none">
					{#each targetWords as word, i}
						<span class="text-base inline-block mr-2 {
							i < currentWordIndex
								? wordResults[i] === 'correct'
									? 'text-ocean-green'
									: 'text-ocean-red line-through'
								: i === currentWordIndex
									? 'text-ocean-900 dark:text-ocean-100 bg-ocean-200/60 dark:bg-ocean-700/40 px-1 rounded'
									: 'text-ocean-400 dark:text-ocean-500'
						}">{word}</span>
					{/each}
				</div>

				<!-- Input -->
				<input
					bind:this={inputEl}
					bind:value={typed}
					on:input={handleInput}
					class="w-full bg-ocean-100/50 dark:bg-ocean-800/30 rounded-lg p-4 border border-ocean-200/50 dark:border-ocean-700/30 text-ocean-900 dark:text-ocean-100 text-base font-cascadia outline-none focus:border-ocean-cyan/50 transition-colors placeholder:text-ocean-400 dark:placeholder:text-ocean-500"
					placeholder="start typing..."
					autocomplete="off"
					autocapitalize="off"
					autocorrect="off"
					spellcheck="false"
				/>

				<p class="text-ocean-500 dark:text-ocean-500 text-xs mt-3 text-center">press <kbd class="text-ocean-cyan">esc</kbd> to reset</p>
			</div>
		{/if}

		{#if state === 'done'}
			<div
				class="text-center space-y-6"
				in:fly={{ y: 20, duration: 300 }}
			>
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
					<div class="bg-ocean-100/50 dark:bg-ocean-800/30 rounded-lg p-4 border border-ocean-200/50 dark:border-ocean-700/30">
						<p class="text-ocean-cyan text-2xl font-bold">{wpm}</p>
						<p class="text-ocean-500 dark:text-ocean-400 text-xs mt-1">wpm</p>
					</div>
					<div class="bg-ocean-100/50 dark:bg-ocean-800/30 rounded-lg p-4 border border-ocean-200/50 dark:border-ocean-700/30">
						<p class="text-ocean-green text-2xl font-bold">{accuracy}%</p>
						<p class="text-ocean-500 dark:text-ocean-400 text-xs mt-1">accuracy</p>
					</div>
					<div class="bg-ocean-100/50 dark:bg-ocean-800/30 rounded-lg p-4 border border-ocean-200/50 dark:border-ocean-700/30">
						<p class="text-ocean-yellow text-2xl font-bold">{((endTime - startTime) / 1000).toFixed(1)}s</p>
						<p class="text-ocean-500 dark:text-ocean-400 text-xs mt-1">time</p>
					</div>
					<div class="bg-ocean-100/50 dark:bg-ocean-800/30 rounded-lg p-4 border border-ocean-200/50 dark:border-ocean-700/30">
						<p class="text-ocean-magenta text-2xl font-bold">{correctChars}/{totalChars}</p>
						<p class="text-ocean-500 dark:text-ocean-400 text-xs mt-1">characters</p>
					</div>
				</div>

				<!-- Word review -->
				<div class="bg-ocean-100/50 dark:bg-ocean-800/30 rounded-lg p-6 border border-ocean-200/50 dark:border-ocean-700/30 leading-8">
					{#each targetWords as word, i}
						<span class="text-base inline-block mr-2 {
							wordResults[i] === 'correct'
								? 'text-ocean-green'
								: 'text-ocean-red line-through'
						}">{word}</span>
					{/each}
				</div>

				<div class="flex justify-center gap-3">
					<button
						class="px-6 py-2.5 bg-ocean-cyan/15 text-ocean-cyan border border-ocean-cyan/30 rounded-lg hover:bg-ocean-cyan/25 transition-all text-sm"
						on:click={startTest}
					>
						try again
					</button>
					<button
						class="px-6 py-2.5 bg-ocean-100/50 dark:bg-ocean-800/30 text-ocean-600 dark:text-ocean-400 border border-ocean-200/50 dark:border-ocean-700/30 rounded-lg hover:border-ocean-cyan/30 transition-all text-sm"
						on:click={reset}
					>
						change settings
					</button>
				</div>
			</div>
		{/if}
	</div>
</section>
{/if}
