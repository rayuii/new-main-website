<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { browser } from '$app/env';
	import type { SpotifyTimeRange, TopTracksResponse } from '$lib/types';
	
	let mounted = false;

	const options: {
		name: string;
		value: SpotifyTimeRange;
	}[] = [
		{ name: 'past month', value: 'short_term' },
		{ name: 'past 6 months', value: 'medium_term' },
		{ name: 'all time', value: 'long_term' }
	];

	const tracks: Record<SpotifyTimeRange, TopTracksResponse | null> = {
		short_term: null,
		medium_term: null,
		long_term: null
	};

	let selectedRange = options[0].value;

	$: if (browser) {
		fetchTopTracks(selectedRange);
	}

	function fetchTopTracks(range: SpotifyTimeRange) {
		if (tracks[range]) return;

		tracks[range] = [];

		fetch('/api/top-tracks?time_range=' + range)
			.then(res => res.json())
			.then(res => {
				tracks[range] = res;
			});
	}

	$: currentRange = tracks[selectedRange];
	
	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>music</title>
	<meta name="og:title" content="music" />
	<meta name="description" content="tracks i've listened to the most" />
	<meta name="og:description" content="tracks i've listened to the most" />
	<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f9f0f5" />
	<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#281c21" />
</svelte:head>

<section class="p-8 sm:p-12 lg:p-24 lg:py-16 font-cascadia">
	{#if mounted}
		<div class="flex flex-col gap-7">
			<div in:fly={{ y: -20, duration: 400 }}>
				<h1 class="text-ocean-900 dark:text-ocean-100">music</h1>
				<p class="text-ocean-700 dark:text-ocean-400">tracks I've listened to the most</p>
			</div>

		<div>
			<div class="flex gap-4 text-ocean-700 dark:text-ocean-400">
				{#each options as { name, value }}
					<button
						on:click={() => selectedRange = value}
						class="hover:text-ocean-900 dark:hover:text-ocean-100 transition-colors
							{selectedRange === value ? 'text-ocean-900 dark:text-ocean-100' : ''}"
					>
						{name}
					</button>
				{/each}
			</div>
		</div>

		{#key selectedRange}
			<div class="flex flex-col gap-2" in:fade={{ duration: 300 }}>
				{#each currentRange ?? [] as track, i}
					<a
						href={track.external_urls.spotify}
						target="_blank"
						rel="noopener noreferrer"
						class="text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 dark:hover:text-ocean-100 transition-colors"
					>
						{i + 1}. {track.name} - {track.artists.map(a => a.name).join(', ')}
					</a>
				{/each}
			</div>
		{/key}
	</div>
	{/if}
</section>