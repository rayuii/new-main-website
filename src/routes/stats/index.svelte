<script lang="ts">
	import { useLanyard } from 'sk-lanyard';
	import { onMount } from 'svelte';
	import { BUILD_TIMESTAMP } from '$lib/buildtime';

	const data = useLanyard({ method: 'ws', id: '1113690068113170484' });
	
	// Site uptime - automatically set from build time
	const siteStartDate = BUILD_TIMESTAMP;
	let uptime = { days: 0, hours: 0, minutes: 0 };
	
	// Update uptime every minute
	function updateUptime() {
		const now = Date.now();
		const diff = now - siteStartDate;
		uptime.days = Math.floor(diff / (1000 * 60 * 60 * 24));
		uptime.hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		uptime.minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
	}
	
	updateUptime();
	setInterval(updateUptime, 60000);



	const TITANIC_USER_ID = 3505;

	let githubStats = {
		repos: 0,
		stars: 0,
		forks: 0,
		followers: 0,
		following: 0
	};

	let topPlays: any[] = [];
	
	let titanicUser: any = null;
	let lastPlayedTrack: any = null;

	let loading = true;
	let osuLoading = true;
	let titanicLoading = true;
	let spotifyLoading = true;

	onMount(async () => {
		// Fetch GitHub stats
		try {
			const response = await fetch('/api/titanic-github');
			if (response.ok) {
				const data = await response.json();
				githubStats = {
					repos: data.repos || 0,
					stars: data.stars || 0,
					forks: data.forks || 0,
					followers: data.followers || 0,
					following: data.following || 0
				};
			}
		} catch (error) {
			console.error('Failed to fetch GitHub stats:', error);
		} finally {
			loading = false;
		}

		// Fetch osu! top plays from Titanic
		try {
			const response = await fetch('/api/titanic-osu');
			if (response.ok) {
				const data = await response.json();
				topPlays = data.scores || [];
			}
		} catch (error) {
			console.error('Failed to fetch osu! stats:', error);
		} finally {
			osuLoading = false;
		}

		// Fetch Titanic user stats
		try {
			const response = await fetch('/api/titanic-user');
			if (response.ok) {
				titanicUser = await response.json();
			}
		} catch (error) {
			console.error('Failed to fetch Titanic user stats:', error);
		} finally {
			titanicLoading = false;
		}

		// Fetch last played Spotify track
		try {
			const response = await fetch('/api/recent-tracks');
			if (response.ok) {
				lastPlayedTrack = await response.json();
			}
		} catch (error) {
			console.error('Failed to fetch last played track:', error);
		} finally {
			spotifyLoading = false;
		}
	});

	// Calculate uptime/activity stats from Discord
	$: discordUser = $data?.discord_user;
	$: activities = $data?.activities || [];
	$: spotify = $data?.spotify;
	$: activePlatform = $data
		? [
				$data.active_on_discord_desktop ? 'desktop' : null,
				$data.active_on_discord_web ? 'web' : null,
				$data.active_on_discord_mobile ? 'mobile' : null
			]
				.filter(Boolean)
				.join(', ') || 'offline'
		: 'offline';
</script>

<svelte:head>
	<title>stats</title>
	<meta name="og:title" content="stats" />
	<meta name="description" content="various statistics and metrics" />
	<meta name="og:description" content="various statistics and metrics" />
	<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f9f0f5" />
	<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#281c21" />
</svelte:head>

<section class="p-8 sm:p-12 lg:p-24 lg:py-16 font-cascadia">
	<div class="flex flex-col gap-7">
		<div>
			<h1 class="text-ocean-900 dark:text-ocean-100">stats</h1>
			<p class="text-ocean-700 dark:text-ocean-400">various statistics and metrics</p>
		</div>

		<!-- Site Uptime -->
		<div>
			<h2 class="text-ocean-900 dark:text-ocean-100 text-xl mb-3">site uptime</h2>
			<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
				<p class="text-ocean-900 dark:text-ocean-100 text-3xl font-medium">
					{uptime.days}d {uptime.hours}h {uptime.minutes}m
				</p>
				<p class="text-ocean-700 dark:text-ocean-400 text-sm mt-1">since deployment</p>
			</div>
		</div>

		<!-- Discord Stats -->
		<div>
			<h2 class="text-ocean-900 dark:text-ocean-100 text-xl mb-3">discord</h2>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
					<p class="text-ocean-700 dark:text-ocean-400 text-sm">status</p>
					<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium lowercase">
						{$data?.discord_status || 'offline'}
					</p>
				</div>
				<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
					<p class="text-ocean-700 dark:text-ocean-400 text-sm">activities</p>
					<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
						{activities.length}
					</p>
				</div>
				<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
					<p class="text-ocean-700 dark:text-ocean-400 text-sm">listening to</p>
					<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
						{spotify ? spotify.song : 'nothing'}
					</p>
				</div>
				<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
					<p class="text-ocean-700 dark:text-ocean-400 text-sm">active on</p>
					<p class="text-ocean-900 dark:text-ocean-100 text-lg font-medium lowercase">
						{activePlatform}
					</p>
				</div>
			</div>
		</div>

		<!-- GitHub Stats -->
		<div>
			<h2 class="text-ocean-900 dark:text-ocean-100 text-xl mb-3">github</h2>
			{#if loading}
				<p class="text-ocean-700 dark:text-ocean-400">Loading...</p>
			{:else}
				<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
					<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
						<p class="text-ocean-700 dark:text-ocean-400 text-sm">repositories</p>
						<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
							{githubStats.repos}
						</p>
					</div>
					<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
						<p class="text-ocean-700 dark:text-ocean-400 text-sm">stars</p>
						<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
							{githubStats.stars}
						</p>
					</div>
					<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
						<p class="text-ocean-700 dark:text-ocean-400 text-sm">forks</p>
						<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
							{githubStats.forks}
						</p>
					</div>
					<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
						<p class="text-ocean-700 dark:text-ocean-400 text-sm">followers</p>
						<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
							{githubStats.followers}
						</p>
					</div>
					<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
						<p class="text-ocean-700 dark:text-ocean-400 text-sm">following</p>
						<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
							{githubStats.following}
						</p>
					</div>
				</div>
			{/if}
		</div>

		<div>
			<h2 class="text-ocean-900 dark:text-ocean-100 text-xl mb-3">titanic user stats</h2>
			{#if titanicLoading}
				<p class="text-ocean-700 dark:text-ocean-400">Loading...</p>
			{:else if titanicUser}
				<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
					{#if titanicUser.stats && titanicUser.stats[0] && titanicUser.rankings}
						{@const osuStats = titanicUser.stats[0]}
						{@const rankings = titanicUser.rankings['0']}
						<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
							<p class="text-ocean-700 dark:text-ocean-400 text-sm">global rank (pp)</p>
							<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
								#{rankings?.performance?.global?.toLocaleString() || osuStats.rank?.toLocaleString() || 'N/A'}
							</p>
						</div>
						<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
							<p class="text-ocean-700 dark:text-ocean-400 text-sm">country rank (pp)</p>
							<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
								#{rankings?.performance?.country?.toLocaleString() || 'N/A'}
							</p>
						</div>
						<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
							<p class="text-ocean-700 dark:text-ocean-400 text-sm">performance points</p>
							<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
								{osuStats.pp?.toFixed(0).toLocaleString() || 'N/A'}pp
							</p>
						</div>
						<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
							<p class="text-ocean-700 dark:text-ocean-400 text-sm">ppv1 rank</p>
							<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
								#{rankings?.ppv1?.global?.toLocaleString() || 'N/A'}
							</p>
						</div>
						<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
							<p class="text-ocean-700 dark:text-ocean-400 text-sm">ppv1</p>
							<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
								{osuStats.ppv1?.toFixed(0).toLocaleString() || 'N/A'}pp
							</p>
						</div>
						<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
							<p class="text-ocean-700 dark:text-ocean-400 text-sm">ranked score rank</p>
							<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
								#{rankings?.rscore?.global?.toLocaleString() || 'N/A'}
							</p>
						</div>
						<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
							<p class="text-ocean-700 dark:text-ocean-400 text-sm">ranked score</p>
							<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
								{osuStats.rscore?.toLocaleString() || 'N/A'}
							</p>
						</div>
						<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
							<p class="text-ocean-700 dark:text-ocean-400 text-sm">total score rank</p>
							<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
								#{rankings?.tscore?.global?.toLocaleString() || 'N/A'}
							</p>
						</div>
						<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
							<p class="text-ocean-700 dark:text-ocean-400 text-sm">total score</p>
							<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
								{osuStats.tscore?.toLocaleString() || 'N/A'}
							</p>
						</div>
						<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
							<p class="text-ocean-700 dark:text-ocean-400 text-sm">accuracy</p>
							<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
								{osuStats.acc ? `${(osuStats.acc * 100).toFixed(2)}%` : 'N/A'}
							</p>
						</div>
						<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
							<p class="text-ocean-700 dark:text-ocean-400 text-sm">playcount</p>
							<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
								{osuStats.playcount?.toLocaleString() || 'N/A'}
							</p>
						</div>
						<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
							<p class="text-ocean-700 dark:text-ocean-400 text-sm">max combo</p>
							<p class="text-ocean-900 dark:text-ocean-100 text-2xl font-medium">
								{osuStats.max_combo?.toLocaleString() || 'N/A'}x
							</p>
						</div>
					{/if}
					{#if titanicUser.name}
						<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
							<p class="text-ocean-700 dark:text-ocean-400 text-sm">titanic username</p>
							<p class="text-ocean-900 dark:text-ocean-100 text-lg font-medium">
								{titanicUser.name}
							</p>
						</div>
					{/if}
					{#if titanicUser.country}
						<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
							<p class="text-ocean-700 dark:text-ocean-400 text-sm">country</p>
							<p class="text-ocean-900 dark:text-ocean-100 text-lg font-medium">
								{titanicUser.country}
							</p>
						</div>
					{/if}
				</div>
			{:else}
				<p class="text-ocean-700 dark:text-ocean-400">Failed to load Titanic user stats</p>
			{/if}
		</div>

		<div>
			<h2 class="text-ocean-900 dark:text-ocean-100 text-xl mb-3">titanic top plays</h2>
			{#if osuLoading}
				<p class="text-ocean-700 dark:text-ocean-400">Loading...</p>
			{:else if topPlays.length > 0}
				<div class="flex flex-col gap-3">
					{#each topPlays.slice(0, 5) as play, i}
						<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
							<div class="flex items-start justify-between gap-4">
								<div class="flex-1">
									<p class="text-ocean-900 dark:text-ocean-100 font-medium">
										#{i + 1} {play.beatmap?.beatmapset?.artist} - {play.beatmap?.beatmapset?.title}
									</p>
									<p class="text-ocean-700 dark:text-ocean-400 text-sm">
										[{play.beatmap?.version}]
									</p>
									<div class="flex gap-4 mt-2 text-sm">
										<span class="text-ocean-800 dark:text-ocean-300">{play.pp?.toFixed(0)}pp</span>
										<span class="text-ocean-800 dark:text-ocean-300">{play.acc ? `${(play.acc * 100).toFixed(2)}%` : 'N/A'}</span>
										<span class="text-ocean-800 dark:text-ocean-300">{play.max_combo}x</span>
										<span class="text-ocean-800 dark:text-ocean-300">{play.grade}</span>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-ocean-700 dark:text-ocean-400">No top plays found</p>
			{/if}
		</div>

		<!-- Spotify Stats -->
		<div>
			<h2 class="text-ocean-900 dark:text-ocean-100 text-xl mb-3">spotify</h2>
			{#if spotifyLoading}
				<p class="text-ocean-700 dark:text-ocean-400">Loading...</p>
			{:else if lastPlayedTrack}
				<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4 mb-4">
					<p class="text-ocean-700 dark:text-ocean-400 text-sm mb-2">last played</p>
					<div class="flex items-center gap-3">
						{#if lastPlayedTrack.track?.album?.images?.[0]?.url}
							<img 
								src={lastPlayedTrack.track.album.images[0].url} 
								alt="Album art"
								class="w-16 h-16 rounded shadow-lg"
							/>
						{/if}
						<div class="flex flex-col">
							<a 
								href={lastPlayedTrack.track?.external_urls?.spotify}
								target="_blank"
								rel="noopener noreferrer"
								class="text-ocean-900 dark:text-ocean-100 font-medium hover:underline"
							>
								{lastPlayedTrack.track?.name}
							</a>
							<span class="text-ocean-800 dark:text-ocean-300">
								{lastPlayedTrack.track?.artists?.map(a => a.name).join(', ')}
							</span>
							<span class="text-ocean-700 dark:text-ocean-400 text-sm">
								{new Date(lastPlayedTrack.played_at).toLocaleString()}
							</span>
						</div>
					</div>
				</div>
			{/if}
			<p class="text-ocean-700 dark:text-ocean-400">
				Check out my <a href="/music" class="underline hover:text-ocean-900 dark:hover:text-ocean-100">top tracks</a>
			</p>
		</div>
	</div>
</section>
