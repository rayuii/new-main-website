<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	
	let mounted = false;
	
	onMount(() => {
		mounted = true;
	});
	
	const tournaments = [
		{
			year: '2025',
			events: [
				{ name: 'Strongest ASCII Battlegrounds', role: 'referee', link: 'https://osu.ppy.sh/community/forums/topics/2104987'},
				{ name: 'Sandri Showdown', role: 'referee', link: 'https://osu.ppy.sh/community/forums/topics/2136853'}
			]
		},
		{
			year: '2025/2026',
			events: [
				{ name: 'Latvian osu! LAN Tournament', role: 'referee', link: 'https://osu.ppy.sh/community/forums/topics/2137587'},
				{ name: 'Nordic & Baltic Duo Tournament', role: 'referee', link: 'https://osu.ppy.sh/community/forums/topics/2151572'},
				{ name: 'osu! 6 digit Tournament', role: 'referee/caster', link: 'https://osu.ppy.sh/community/forums/topics/2139437'}
			]
		},
		{
			year: '2026',
			events: [
				{ name: '5EC Minor League', role: 'referee', link: 'https://osu.ppy.sh/community/forums/topics/2160276' },
				{ name: 'Battle of The Box 2026', role: 'referee', link: 'https://osu.ppy.sh/community/forums/topics/2013000' },
				{ name: 'Fun Awesome Relax Tournament', role: 'referee/commentator/playtester', link: 'http://osu.ppy.sh/community/forums/topics/2166712' }
			]
		}
	];
</script>

<svelte:head>
	<title>tournament staffing</title>
	<meta name="og:title" content="tournament staffing" />
	<meta name="description" content="osu! tournament staffing history" />
	<meta name="og:description" content="osu! tournament staffing history" />
	<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f9f0f5" />
	<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#281c21" />
</svelte:head>

<section class="p-8 sm:p-12 lg:p-24 lg:py-16 font-cascadia">
	{#if mounted}
		<div class="flex flex-col gap-7">
			<div in:fly={{ y: -20, duration: 400 }}>
				<h1 class="text-ocean-900 dark:text-ocean-100">tournament staffing</h1>
				<p class="text-ocean-700 dark:text-ocean-400">osu! tournaments I've helped staff</p>
			</div>

		{#each tournaments as { year, events }, i}
			<div in:fly={{ y: 20, duration: 400, delay: 100 + (i * 100) }}>
				<h2 class="text-ocean-900 dark:text-ocean-100 text-2xl mb-3">{year}</h2>
				<p class="text-ocean-700 dark:text-ocean-400 text-sm mb-4">
					{events.length} tournament{events.length !== 1 ? 's' : ''} staffed
				</p>
				<div class="flex flex-col gap-3">
					{#each events as event}
						<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4 hover:bg-ocean-100 dark:hover:bg-ocean-800 transition-colors">
							<a 
								href={event.link}
								target="_blank"
								rel="noopener noreferrer"
								class="block"
							>
								<div class="flex items-start gap-4">
									{#if event.badge}
										<div class="flex-shrink-0">
											<img 
												src={event.badge} 
												alt="{event.name} badge" 
												class="w-20 h-20 object-contain rounded"
												on:error={e => e.target.style.display = 'none'}
											/>
										</div>
									{/if}
									<div class="flex-1 min-w-0">
										<h3 class="text-ocean-900 dark:text-ocean-100 font-medium hover:underline mb-1">
											{event.name}
										</h3>
										<p class="text-ocean-700 dark:text-ocean-400 text-sm">
											{event.role}
										</p>
									</div>
								</div>
							</a>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
	{/if}
</section>
