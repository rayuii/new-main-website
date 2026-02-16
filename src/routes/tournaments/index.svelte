<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import Tooltip from '$lib/components/Tooltip.svelte';
	
	let mounted = false;
	let hostProfiles: Record<number, { cover_url: string | null; country_code: string | null; country_name: string | null }> = {};

	async function fetchProfile(userId: number) {
		if (hostProfiles[userId]) return;
		try {
			const res = await fetch(`/api/osu-profile?id=${userId}`);
			if (res.ok) {
				const data = await res.json();
				hostProfiles[userId] = data;
				hostProfiles = hostProfiles;
			}
		} catch {}
	}
	
	function flagUrl(code: string) {
		const codepoints = [...code.toUpperCase()].map(c => (0x1F1E6 + c.charCodeAt(0) - 65).toString(16)).join('-');
		return `https://osu.ppy.sh/assets/images/flags/${codepoints}.svg`;
	}

	onMount(() => {
		mounted = true;
		const allHosts = tournaments.flatMap(t => t.events.flatMap(e => e.hosts || []));
		const uniqueIds = [...new Set(allHosts.map(h => h.id))];
		uniqueIds.forEach(id => fetchProfile(id));
	});
	
	const tournaments = [
		{
			year: '2025',
			events: [
				{ name: 'Strongest ASCII Battlegrounds', role: 'referee', link: 'https://osu.ppy.sh/community/forums/topics/2104987', hosts: [{ name: 'Melodieyy-', id: 33526381 }], banner: 'http://swooo.sh/FLUV6w.png' },
				{ name: 'Sandri Showdown', role: 'referee', link: 'https://osu.ppy.sh/community/forums/topics/2136853', hosts: [{ name: 'cedru', id: 10162611 }], banner: 'https://sundei.ee/tournaments/cedru-showdown.webp' }
			]
		},
		{
			year: '2025/2026',
			events: [
				{ name: 'Latvian osu! LAN Tournament', role: 'referee', link: 'https://osu.ppy.sh/community/forums/topics/2137587', hosts: [{ name: 'Joyy', id: 14084526 }], banner: 'https://sundei.ee/tournaments/lolt2026.webp' },
				{ name: 'Nordic & Baltic Duo Tournament', role: 'referee', link: 'https://osu.ppy.sh/community/forums/topics/2151572', hosts: [{ name: 'Laurus', id: 20373027 }, { name: 'nik', id: 10077264 }], banner: 'https://sundei.ee/tournaments/nbd2025.png' },
				{ name: 'osu! 6 digit Tournament', role: 'referee/caster', link: 'https://osu.ppy.sh/community/forums/topics/2139437', hosts: [{ name: 'FrenchFemboy', id: 15875416 }, { name: 'Scream10', id: 16131822 }, { name: 'Ninbsa', id: 20024996 }], banner: 'https://sundei.ee/tournaments/6digwc.png' }
			]
		},
		{
			year: '2026',
			events: [
				{ name: '5EC Minor League', role: 'referee', link: 'https://osu.ppy.sh/community/forums/topics/2160276', hosts: [{ name: 'jojo_flower', id: 28236847 }, { name: 'Neko4ka', id: 36036411 }], banner: 'https://sundei.ee/tournaments/5ecml.jpg'},
				{ name: 'Battle of The Box 2026', role: 'referee', link: 'https://osu.ppy.sh/community/forums/topics/2178368?n=1', hosts: [{ name: 'xootynator', id: 3717598 }, { name: 'Fulserish', id: 14252162 }], banner: 'https://sundei.ee/tournaments/botb2026.webp' },
				{ name: 'Fun Awesome Relax Tournament', role: 'referee/commentator/playtester', link: 'https://osu.ppy.sh/community/forums/topics/2166712', hosts: [{ name: 'birbisc', id: 30403970 }], banner: 'https://sundei.ee/tournaments/fart2026.png'},
				{ name: 'The Oceanic Cup', role: 'referee', link: 'https://osu.ppy.sh/community/forums/topics/2179025?n=1', hosts: [{ name: 'mrekk', id: 7562902 }, { name: 'Gala', id: 3385634 }], banner: 'https://sundei.ee/tournaments/oceanic-cup.png'}

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
		<div class="flex flex-col gap-7 max-w-3xl">
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
						<div 
							class="border border-ocean-300 dark:border-ocean-700 rounded overflow-hidden {event.banner ? 'group' : 'hover:bg-ocean-100 dark:hover:bg-ocean-800'} transition-all relative"
						>
							{#if event.banner}
								<div 
									class="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
									style="background-image: url({event.banner});"
								/>
								<div class="absolute inset-0 bg-black/60 dark:bg-black/70 transition-colors duration-300 group-hover:bg-black/40 dark:group-hover:bg-black/50" />
							{/if}
							<a 
								href={event.link}
								target="_blank"
								rel="noopener noreferrer"
								class="block relative p-4"
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
										<h3 class="{event.banner ? 'text-white' : 'text-ocean-900 dark:text-ocean-100'} font-medium hover:underline mb-1">
											{event.name}
										</h3>
										<p class="{event.banner ? 'text-white/70' : 'text-ocean-700 dark:text-ocean-400'} text-sm">
											{event.role}
										</p>
										{#if event.hosts?.length}
											<div class="flex items-center gap-2 mt-2 flex-wrap">
												<span class="{event.banner ? 'text-white/60' : 'text-ocean-600 dark:text-ocean-500'} text-xs">hosted by</span>
												{#each event.hosts as host, hi}
													<a 
														href="https://osu.ppy.sh/users/{host.id}" 
														target="_blank" 
														rel="noopener noreferrer"
														class="relative inline-flex items-center gap-1.5 rounded-md pr-2 hover:brightness-110 transition-all"
														style="background: {hostProfiles[host.id]?.cover_url ? `url(${hostProfiles[host.id].cover_url}) center/cover` : 'linear-gradient(135deg, #334155, #1e293b)'};"
														on:click|stopPropagation
													>
														<div class="absolute inset-0 bg-black/50 rounded-md"></div>
														<img 
															src="https://a.ppy.sh/{host.id}" 
															alt={host.name}
															class="relative w-7 h-7 rounded-l-md object-cover"
														/>
														<span class="relative text-white text-xs font-medium drop-shadow-sm">{host.name}</span>
														{#if hostProfiles[host.id]?.country_code}
															<Tooltip text={hostProfiles[host.id].country_name || hostProfiles[host.id].country_code}>
																<img 
																	src={flagUrl(hostProfiles[host.id].country_code)}
																	alt={hostProfiles[host.id].country_name || hostProfiles[host.id].country_code}
																	class="h-3.5 w-auto"
																/>
															</Tooltip>
														{/if}
													</a>
												{/each}
											</div>
										{/if}
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
