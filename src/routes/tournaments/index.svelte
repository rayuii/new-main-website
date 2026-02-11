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
				{ name: 'Sandri Showdown', role: 'referee', link: 'https://osu.ppy.sh/community/forums/topics/2136853', hosts: [{ name: 'cedru', id: 10162611 }], banner: 'https://i.ppy.sh/66dd7b44672e74d1076b3cc209135972e6df0adb/68747470733a2f2f63656472752e732d756c2e65752f41364a7878317235' }
			]
		},
		{
			year: '2025/2026',
			events: [
				{ name: 'Latvian osu! LAN Tournament', role: 'referee', link: 'https://osu.ppy.sh/community/forums/topics/2137587', hosts: [{ name: 'Joyy', id: 14084526 }], banner: 'https://wybin.xyz/uploads/tournaments/lolt2026winter/header-image-lolt2026winter-8982ad20.webp' },
				{ name: 'Nordic & Baltic Duo Tournament', role: 'referee', link: 'https://osu.ppy.sh/community/forums/topics/2151572', hosts: [{ name: 'Laurus', id: 20373027 }, { name: 'nik', id: 10077264 }], banner: 'https://i.ppy.sh/f1dee50e3d1f3c2e7c2ceb8d91a8b9740aac189c/68747470733a2f2f6e696b6f6c6f6d6172612e732d756c2e65752f534e6161356b71552e706e67' },
				{ name: 'osu! 6 digit Tournament', role: 'referee/caster', link: 'https://osu.ppy.sh/community/forums/topics/2139437', hosts: [{ name: 'FrenchFemboy', id: 15875416 }, { name: 'Scream10', id: 16131822 }, { name: 'Ninbsa', id: 20024996 }], banner: 'https://assets.ppy.sh/topic-covers/14821/9c31302d6509308ec4dcd527c41aea7e97e672a6a4bea0ade2a5e44d0e14d432.png' }
			]
		},
		{
			year: '2026',
			events: [
				{ name: '5EC Minor League', role: 'referee', link: 'https://osu.ppy.sh/community/forums/topics/2160276', hosts: [{ name: 'jojo_flower', id: 28236847 }, { name: 'Neko4ka', id: 36036411 }], banner: 'https://i.ppy.sh/d3ee87526a932f3fb2e96ddfa92f9ac77a6307d9/68747470733a2f2f7a6978782e732d756c2e65752f6b68555650366e47'},
				{ name: 'Battle of The Box 2026', role: 'referee(/commentator [pending])', link: 'https://osu.ppy.sh/community/forums/topics/2178368?n=1', hosts: [{ name: 'xootynator', id: 3717598 }, { name: 'Fulserish', id: 14252162 }], banner: 'https://i.ppy.sh/274e3ceed9f5c5900b6c73034a15b88d278cfbd5/68747470733a2f2f6d656469612e646973636f72646170702e6e65742f6174746163686d656e74732f313434373337333531313532393333323739382f313436353538393931363939333036303839342f62616e6e65722e706e673f65783d36393862373462392669733d363938613233333926686d3d30396238656462663230336233316234653563333165303132623762653463336130666666626535663432626432636532643538623861353364373137613534263d26666f726d61743d77656270267175616c6974793d6c6f73736c657373' },
				{ name: 'Fun Awesome Relax Tournament', role: 'referee/commentator/playtester', link: 'http://osu.ppy.sh/community/forums/topics/2166712', hosts: [{ name: 'birbisc', id: 30403970 }], banner: 'https://i.ppy.sh/b56806281790c5b19cb562cedb51ea684b72069d/68747470733a2f2f626972626973632e732d756c2e65752f38676c6670444f30'}
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
