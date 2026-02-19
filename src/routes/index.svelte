<script context="module" lang="ts">
	export const prerender = true;
</script>

<script lang="ts">
	import Branch from '$lib/components/Branch.svelte';
	import Language from '$lib/components/Language.svelte';
	import ProjectItem from '$lib/components/ProjectItem.svelte';
	import Workspace from '$lib/components/Workspace.svelte';
	import Terminal from '$lib/components/Terminal.svelte';
	import OsuTooltip from '$lib/components/OsuTooltip.svelte';
	import { getCodeData } from '$lib/rpcUtils';
	import { useLanyard } from 'sk-lanyard';
	import { onMount } from 'svelte';

	// ── types ──────────────────────────────────────────────────────────────
	interface PrimaryGuild { tag: string; badge: string; identity_guild_id: string; identity_enabled: boolean; }
	interface DiscordUser { id: string; username: string; avatar: string | null; discriminator: string; public_flags: number; global_name?: string; primary_guild?: PrimaryGuild; }
	interface ActivityEmoji { name: string; id?: string; animated?: boolean; }
	interface ActivityAssets { large_image?: string; large_text?: string; small_image?: string; small_text?: string; }
	interface ActivityTimestamps { start?: number; end?: number; }
	interface Activity { id: string; name: string; type: number; state?: string; details?: string; application_id?: string; emoji?: ActivityEmoji; assets?: ActivityAssets; timestamps?: ActivityTimestamps; }
	interface SpotifyTimestamps { start: number; end: number; }
	interface SpotifyData { song: string; artist: string; album: string; album_art_url: string; track_id: string; timestamps?: SpotifyTimestamps; }
	interface LanyardData { discord_user: DiscordUser; discord_status: 'online' | 'idle' | 'dnd' | 'offline'; activities: Activity[]; spotify: SpotifyData | null; }

	// ── lanyard ────────────────────────────────────────────────────────────
	const store = useLanyard({ method: 'ws', id: '1113690068113170484' });
	$: d = $store as unknown as LanyardData | null;
	$: codeData = getCodeData($store);

	// ── discord display ────────────────────────────────────────────────────
	$: discordAvatar = d?.discord_user?.avatar
		? `https://cdn.discordapp.com/avatars/${d.discord_user.id}/${d.discord_user.avatar}.${d.discord_user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
		: null;
	$: clanBadge = d?.discord_user?.primary_guild?.badge && d?.discord_user?.primary_guild?.identity_guild_id
		? `https://cdn.discordapp.com/clan-badges/${d.discord_user.primary_guild.identity_guild_id}/${d.discord_user.primary_guild.badge}.png?size=16`
		: null;
	const statusMap: Record<string, string> = { online: 'bg-green-500', idle: 'bg-yellow-500', dnd: 'bg-red-500', offline: 'bg-gray-500' };
	$: statusColor = statusMap[d?.discord_status ?? 'offline'] ?? 'bg-gray-500';

	// customStatus moved to script so no inline type casts needed in template
	$: customStatus = (d?.activities ?? []).find((a: Activity) => a.type === 4) ?? null;

	// ── filtered activities ────────────────────────────────────────────────
	$: visibleActivities = (d?.activities ?? []).filter((a: Activity) =>
		(a.type === 0 || a.type === 3) &&
		a.application_id !== '782685898163617802' &&
		!a.name.toLowerCase().includes('spotify')
	);

	// ── clock ──────────────────────────────────────────────────────────────
	const timeZone = 'America/Vancouver';
	const isTimeZoneSame = Intl.DateTimeFormat().resolvedOptions().timeZone === timeZone;
	let timeZoneToggle = false;
	let userLocation = '';
	let targetLocation = '';

	async function getLocationFromTimezone(tz: string): Promise<string> {
		try {
			const q = tz.split('/').pop()?.replace(/_/g, ' ') || tz;
			const res = await fetch(`/api/timezone?location=${encodeURIComponent(q)}`);
			const data = await res.json();
			return [data.location?.city, data.location?.state_prov, data.location?.country_name].filter(Boolean).join(', ');
		} catch {
			return tz.split('/').pop()?.replace(/_/g, ' ') || tz;
		}
	}

	if (typeof window !== 'undefined') {
		getLocationFromTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone).then(l => userLocation = l);
		getLocationFromTimezone(timeZone).then(l => targetLocation = l);
	}

	$: timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', timeZone: timeZoneToggle ? timeZone : undefined });
	$: dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: timeZoneToggle ? timeZone : undefined });
	let now = new Date();
	setInterval(() => { now = new Date(); }, 100);
	$: date = dateFormatter.format(now);
	$: time = timeFormatter.format(now);
	$: displayCity = timeZoneToggle
		? (targetLocation || timeZone.split('/').pop()?.replace(/_/g, ' '))
		: (userLocation || Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()?.replace(/_/g, ' '));

	// ── kwan wisdom ────────────────────────────────────────────────────────
	const kwanMindset = [
		"I could keep retrying all day",
		"There are no last moments, just moments that last forever.",
		"I'm going to go to mars and I will inhale dirt.",
		"Speed Ryan never left, he was just right next door.",
		"The key to being a Kwan male is to have less bitches than Mathi, so you don't get distracted from the grind.",
		"i have so much speed and so no speed",
		"Holy shit, MUSHROOMS",
		"You know who were born bald? The people who are naturally bald. Think about it. You're naturally bald, and you can never grow hair, you're like.. you're born bald. I mean think about it. Have you ever seen bald people with hair? Think about it. Think about it. Think about it. Think about it. Like you think of a bald people, have you ever seen them with hair?",
		"if your parents annoy the shit out of you just mute them.",
		"the kwan grindset never ends we'll keep going we'll keep kwaning",
		"Sometimes you shouldn't grab what can't handle cuz obviously you can't handle my balls",
		"I FEEL LIKE ARICIN RIGHT NOW. INFINITE STAMINA",
		"I  position my pinkie 45 degrees and if you take the sin of that and find the hypotenuse you can figure out that your hand slows down 10 percent in the negative direction if we define our positive in the right and our negative to the left we can decide that by angling it 10 degrees we can slow down by 10 percent",
		"what oh my god 😱 it's a stop sign 🛑 finding Nemo 🐠 gold fish 🐡 dory 🐟 NATIONAL GEOGRAPHIC 🟨 GODDAMMIT",
		"im gonna try.. singletapping. wait, did i just say ill try using hidden? im stupid i meant to say, im gonna try singletapping.",
		"WHAT? OM NOM NOM NOM NOM",
		"You have autism. Thank you"
	];
	let currentQuote = kwanMindset[Math.floor(Math.random() * kwanMindset.length)];
	function newQuote() { currentQuote = kwanMindset[Math.floor(Math.random() * kwanMindset.length)]; }

	// ── spotify ────────────────────────────────────────────────────────────
	let lastPlayedTrack: any = null;

	// helper used in template to avoid inline (a: any) callbacks
	function artistNames(artists: any[]): string {
		return (artists ?? []).map((a: any) => a.name).join(', ');
	}

	let romanizedCache: Record<string, string> = {};
	async function romanizeText(text: string): Promise<string> {
		if (!text) return text;
		if (romanizedCache[text]) return romanizedCache[text];
		if (!/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text)) {
			romanizedCache[text] = text;
			return text;
		}
		try {
			const res = await fetch('/api/romanize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
			if (res.ok) { const data = await res.json(); romanizedCache[text] = data.romanized; return data.romanized; }
		} catch (e) { console.error('Romanize failed:', e); }
		romanizedCache[text] = text;
		return text;
	}

	let romanizedSong = '', romanizedArtist = '', romanizedAlbum = '', romanizedLastSong = '', romanizedLastArtist = '';
	$: if (d?.spotify?.song) romanizeText(d.spotify.song).then(r => romanizedSong = r);
	$: if (d?.spotify?.artist) romanizeText(d.spotify.artist).then(r => romanizedArtist = r);
	$: if (d?.spotify?.album) romanizeText(d.spotify.album).then(r => romanizedAlbum = r);
	$: if (lastPlayedTrack?.track?.name) romanizeText(lastPlayedTrack.track.name).then(r => romanizedLastSong = r);
	$: if (lastPlayedTrack?.track?.artists) romanizeText(artistNames(lastPlayedTrack.track.artists)).then(r => romanizedLastArtist = r);

	// ── osu! ───────────────────────────────────────────────────────────────
	const OSU_APP_IDS = new Set(['1216669957799018608', '367827983903490050']);
	const OSU_SELF_USERNAME = 'de diepte';

	function isOsuActivity(a: Activity): boolean {
		return OSU_APP_IDS.has(a.application_id ?? '') || a.name === 'osu!';
	}
	function parseWatchingUsername(state: string): string | null {
		return state?.match(/^Watching (.+?)'s replay$/i)?.[1] ?? null;
	}
	function isSelfOsuState(state: string): boolean {
		return state === 'Clicking circles' || state === 'Choosing a beatmap';
	}

	let osuBeatmapUrls: Record<string, string | null> = {};
	async function resolveOsuBeatmap(details: string) {
		if (osuBeatmapUrls[details] !== undefined) return;
		osuBeatmapUrls[details] = null;
		const query = details.replace(/\[.*?\]\s*$/, '').trim();
		const difficulty = details.match(/\[(.+?)\]$/)?.[1] ?? '';
		try {
			const res = await fetch(`/api/osu-beatmap?q=${encodeURIComponent(query)}&difficulty=${encodeURIComponent(difficulty)}`);
			const data = await res.json();
			osuBeatmapUrls = { ...osuBeatmapUrls, [details]: data.url ?? null };
		} catch {
			osuBeatmapUrls = { ...osuBeatmapUrls, [details]: null };
		}
	}

	let osuUserCache: Record<string, any> = {};
	async function fetchOsuUser(username: string) {
		if (osuUserCache[username] !== undefined) return;
		osuUserCache[username] = null;
		try {
			const res = await fetch(`/api/osu-user?u=${encodeURIComponent(username)}`);
			osuUserCache = { ...osuUserCache, [username]: await res.json() };
		} catch {
			osuUserCache = { ...osuUserCache, [username]: null };
		}
	}

	$: {
		const oa = (d?.activities ?? []).find((a: Activity) => isOsuActivity(a) && !!a.details);
		if (oa?.details) resolveOsuBeatmap(oa.details);
	}
	$: {
		const oa = (d?.activities ?? []).find((a: Activity) => isOsuActivity(a));
		if (oa?.state) {
			const w = parseWatchingUsername(oa.state);
			if (w) fetchOsuUser(w);
			if (isSelfOsuState(oa.state)) fetchOsuUser(OSU_SELF_USERNAME);
		}
	}

	onMount(async () => {
		try { const r = await fetch('/api/recent-tracks'); if (r.ok) lastPlayedTrack = await r.json(); } catch {}
	});
</script>

<svelte:head>
	<title>portfolio</title>
	<meta name="og:title" content="portfolio" />
	<meta name="description" content="a collection of various things" />
	<meta name="og:description" content="a collection of various things" />
	<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f9f0f5" />
	<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#281c21" />
</svelte:head>

<section class="p-8 sm:p-12 lg:p-24 lg:py-16 font-cascadia z-10 flex flex-col sm:flex-row gap-y-10 justify-between">
	<div class="flex flex-col gap-7 flex-1">
		<div class="min-h-[3em] lg:min-h-0 flex items-center gap-3">
			{#if d?.discord_user && discordAvatar}
				<div class="relative flex-shrink-0">
					<img src={discordAvatar} alt="Discord avatar" class="w-12 h-12 rounded-full" />
					<div class="absolute bottom-0 right-0 w-3 h-3 {statusColor} rounded-full border-2 border-ocean-100 dark:border-ocean-900"></div>
				</div>
			{/if}
			<h1 class="text-ocean-900 dark:text-ocean-300 break-words min-w-0 flex items-center gap-1 flex-wrap">
				<span class="text-ocean-900 dark:text-ocean-blue flex items-center gap-2">
					sundei
					{#if clanBadge && d?.discord_user?.primary_guild?.tag}
						<span class="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-ocean-200 dark:bg-ocean-800 border border-ocean-300 dark:border-ocean-600 rounded text-ocean-900 dark:text-ocean-100">
							<img src={clanBadge} alt="Clan badge" class="w-3 h-3" />
							<span>{d.discord_user.primary_guild.tag}</span>
						</span>
					{/if}
				</span>
				<Workspace workspace={codeData?.workspace} />
				<Branch name={codeData?.branch} />
				<Language lang={codeData?.lang} />
			</h1>
		</div>

		<div>
			<h1 class="text-ocean-900 dark:text-ocean-100">wip</h1>
			<ul class="list-disc list-inside text-ocean-800 dark:text-ocean-blue">
				<ProjectItem href="https://github.com/rayuii/winpowershell" name="scripts" description="powershell scripts (school)" />
				<ProjectItem href="https://github.com/rayuii/Titanic-Wiki" name="titanic wiki" description="contributions in estonian and dutch" />
				<ProjectItem href="https://github.com/rayuii/portfolio" name="old portfolio" description="buh" />
			</ul>
		</div>
		<div>
			<h1 class="text-ocean-900 dark:text-ocean-100">projects</h1>
			<ul class="list-disc list-inside text-ocean-800 dark:text-ocean-blue">
				<ProjectItem href="https://github.com/rayuii/skriptlinux" name="linux scripts" description="school forces me to suffer" />
				<ProjectItem href="https://www.tartulinnaliin.ee" name="where is my bus lol" description="tartu bussiajad, but website" />
				<ProjectItem href="https://github.com/rayuii/fonoteek" name="fonoteek" description="object-oriented programming stuff" />
			</ul>
		</div>
		<div>
			<h1 class="text-ocean-900 dark:text-ocean-100">links</h1>
			<ul class="list-disc list-inside text-ocean-800 dark:text-ocean-blue">
				<ProjectItem href="https://twitter.com/deprivedsundei" name="twitter" />
				<ProjectItem href="https://github.com/rayuii" name="github" />
				<ProjectItem href="mailto:sundei@sundei.ee" name="email" />
			</ul>
		</div>

		<div class="mt-4 w-full sm:w-96">
			<h2 class="text-ocean-900 dark:text-ocean-100 text-lg mb-2">kwan wisdom</h2>
			<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
				<p class="text-ocean-800 dark:text-ocean-100 text-sm italic">"{currentQuote}"</p>
				<button on:click={newQuote} class="mt-3 text-ocean-600 dark:text-ocean-400 hover:text-ocean-900 dark:hover:text-ocean-100 text-xs underline">
					new quote
				</button>
			</div>
		</div>

		<div class="mt-2">
			<Terminal />
		</div>
	</div>

	<div class="text-ocean-900 dark:text-ocean-300 flex flex-col items-start sm:items-end gap-3 sm:gap-7 sm:text-right">
		{#if !isTimeZoneSame}
			<div class="flex flex-col items-start sm:items-end hover:underline cursor-pointer" on:click={() => (timeZoneToggle = !timeZoneToggle)}>
				<span>{date}</span>
				<span>{time} in {displayCity || 'loading...'}</span>
			</div>
		{:else}
			<div class="flex flex-col items-start sm:items-end">
				<span>{date}</span>
				<span>{time}</span>
			</div>
		{/if}

		{#if customStatus}
			<div class="flex flex-col items-start sm:items-end gap-1">
				<span class="text-ocean-900 dark:text-ocean-100 flex items-center gap-1.5 sm:flex-row-reverse">
					{#if customStatus.emoji}
						{#if customStatus.emoji.id}
							<img src="https://cdn.discordapp.com/emojis/{customStatus.emoji.id}.{customStatus.emoji.animated ? 'gif' : 'png'}?size=20" alt={customStatus.emoji.name} class="w-5 h-5" />
						{:else}
							<span>{customStatus.emoji.name}</span>
						{/if}
					{/if}
					{#if customStatus.state}
						<span class="text-ocean-800 dark:text-ocean-300">{customStatus.state}</span>
					{/if}
				</span>
			</div>
		{/if}

		{#if d?.spotify}
			<div class="flex flex-col items-start sm:items-end gap-2">
				<div class="flex items-center gap-3 sm:flex-row-reverse">
					{#if d.spotify.album_art_url}
						<img src={d.spotify.album_art_url} alt="Album art" class="w-16 h-16 rounded shadow-lg" />
					{/if}
					<div class="flex flex-col items-start sm:items-end">
						<a href="https://open.spotify.com/track/{d.spotify.track_id}" target="_blank" rel="noopener noreferrer" class="text-ocean-900 dark:text-ocean-100 hover:underline">
							{romanizedSong || d.spotify.song}
						</a>
						<span class="text-ocean-800 dark:text-ocean-300">{romanizedArtist || d.spotify.artist}</span>
						<span class="text-ocean-700 dark:text-ocean-400">{romanizedAlbum || d.spotify.album}</span>
					</div>
				</div>
				{#if d.spotify.timestamps}
					{@const elapsed = now.getTime() - d.spotify.timestamps.start}
					{@const total = d.spotify.timestamps.end - d.spotify.timestamps.start}
					{@const progress = Math.min(100, (elapsed / total) * 100)}
					{@const elapsedMin = Math.floor(elapsed / 60000)}
					{@const elapsedSec = Math.floor((elapsed % 60000) / 1000)}
					{@const totalMin = Math.floor(total / 60000)}
					{@const totalSec = Math.floor((total % 60000) / 1000)}
					<span class="text-ocean-700 dark:text-ocean-400 text-sm">
						{elapsedMin}:{elapsedSec.toString().padStart(2, '0')} / {totalMin}:{totalSec.toString().padStart(2, '0')}
					</span>
					<div class="w-full max-w-[200px] h-1 bg-ocean-300 dark:bg-ocean-700 rounded-full overflow-hidden">
						<div class="h-full bg-ocean-700 dark:bg-ocean-300 transition-all duration-100" style="width: {progress}%"></div>
					</div>
				{/if}
			</div>
		{:else if lastPlayedTrack}
			<div class="flex flex-col items-start sm:items-end gap-2">
				<span class="text-ocean-700 dark:text-ocean-400 text-sm">last played</span>
				<div class="flex items-center gap-3 sm:flex-row-reverse">
					{#if lastPlayedTrack.track?.album?.images?.[0]?.url}
						<img src={lastPlayedTrack.track.album.images[0].url} alt="Album art" class="w-16 h-16 rounded shadow-lg" />
					{/if}
					<div class="flex flex-col items-start sm:items-end">
						<a href={lastPlayedTrack.track?.external_urls?.spotify} target="_blank" rel="noopener noreferrer" class="text-ocean-900 dark:text-ocean-100 hover:underline">
							{romanizedLastSong || lastPlayedTrack.track?.name}
						</a>
						<span class="text-ocean-800 dark:text-ocean-300">
							{romanizedLastArtist || artistNames(lastPlayedTrack.track?.artists)}
						</span>
						<span class="text-ocean-700 dark:text-ocean-400 text-sm">
							{new Date(lastPlayedTrack.played_at).toLocaleTimeString()}
						</span>
					</div>
				</div>
			</div>
		{/if}

		{#each visibleActivities as activity}
			{@const isTwitch = activity.name?.toLowerCase().includes('twitch') || activity.application_id === '802958789555781663'}
			{@const isOsu = isOsuActivity(activity)}
			{@const twitchUrl = isTwitch ? `https://twitch.tv/${activity.state || activity.name}` : null}
			{@const osuSongName = isOsu && activity.details ? activity.details.replace(/\[.*?\]\s*$/, '').trim() : null}
			{@const osuDifficulty = isOsu && activity.details ? (activity.details.match(/\[(.+?)\]$/)?.[1] ?? null) : null}
			{@const resolvedOsuUrl = isOsu && activity.details ? osuBeatmapUrls[activity.details] : null}
			{@const osuFallbackUrl = osuSongName ? `https://osu.ppy.sh/beatmapsets?q=${encodeURIComponent(osuSongName)}` : null}

			<div class="flex flex-col items-start sm:items-end gap-2">
				<div class="flex items-center gap-3 sm:flex-row-reverse">
					<div class="flex flex-col items-start sm:items-end">
						{#if twitchUrl}
							<a href={twitchUrl} target="_blank" rel="noopener noreferrer" class="text-ocean-900 dark:text-ocean-100 hover:underline">{activity.name}</a>
						{:else}
							<span class="text-ocean-900 dark:text-ocean-100">{activity.name}</span>
						{/if}

						{#if activity.details}
							{#if isOsu}
								<span class="text-ocean-800 dark:text-ocean-300 text-sm">{osuSongName}</span>
								{#if osuDifficulty}
									<span class="text-ocean-700 dark:text-ocean-400 text-sm">[{osuDifficulty}]</span>
								{/if}
							{:else}
								<span class="text-ocean-800 dark:text-ocean-300">{activity.details}</span>
							{/if}
						{/if}

						{#if activity.state && !isTwitch}
							{#if isOsu}
								{@const watchingUser = parseWatchingUsername(activity.state)}
								{#if watchingUser}
									{@const osuUser = osuUserCache[watchingUser]}
									<div class="relative group">
										<a href="https://osu.ppy.sh/users/{watchingUser}" target="_blank" rel="noopener noreferrer" class="text-ocean-700 dark:text-ocean-400 hover:underline text-sm">
											{activity.state}
										</a>
										{#if osuUser}
											<div class="absolute bottom-full right-0 mb-2 z-50 w-64 pointer-events-none opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-out">
												<OsuTooltip {osuUser} />
											</div>
										{/if}
									</div>
								{:else if isSelfOsuState(activity.state)}
									{@const osuUser = osuUserCache[OSU_SELF_USERNAME]}
									<div class="relative group">
										<span class="text-ocean-700 dark:text-ocean-400 text-sm cursor-default">{activity.state}</span>
										{#if osuUser}
											<div class="absolute bottom-full right-0 mb-2 z-50 w-64 pointer-events-none opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-out">
												<OsuTooltip {osuUser} />
											</div>
										{/if}
									</div>
								{:else}
									<span class="text-ocean-700 dark:text-ocean-400 text-sm">{activity.state}</span>
								{/if}
							{:else}
								<span class="text-ocean-700 dark:text-ocean-400">{activity.state}</span>
							{/if}
						{/if}

						{#if isOsu && (resolvedOsuUrl ?? osuFallbackUrl)}
							<a href={resolvedOsuUrl ?? osuFallbackUrl} target="_blank" rel="noopener noreferrer"
								class="text-xs px-1.5 py-0.5 rounded border border-ocean-400 dark:border-ocean-500 text-ocean-600 dark:text-ocean-400 hover:bg-ocean-200 dark:hover:bg-ocean-700 w-fit">
								beatmap ↗
							</a>
						{/if}

						{#if activity.assets?.small_image?.includes('pause') || activity.assets?.small_text?.toLowerCase() === 'paused'}
							<span class="text-ocean-700 dark:text-ocean-400 text-sm">paused</span>
						{:else if activity.timestamps?.start}
							{@const elapsed = now.getTime() - activity.timestamps.start}
							{@const hours = Math.floor(elapsed / 3600000)}
							{@const minutes = Math.floor((elapsed % 3600000) / 60000)}
							{@const seconds = Math.floor((elapsed % 60000) / 1000)}
							<span class="text-ocean-700 dark:text-ocean-400 text-sm">
								{#if hours > 0}
									{hours}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')} elapsed
								{:else}
									{minutes}:{seconds.toString().padStart(2, '0')} elapsed
								{/if}
							</span>
						{/if}
					</div>
				</div>
			</div>
		{/each}

		{#if codeData?.idling}
			<div class="flex flex-col items-start sm:items-end">
				<span class="text-ocean-900 dark:text-ocean-100">vsc</span>
				<span class="text-ocean-700 dark:text-ocean-400">currently idling</span>
			</div>
		{/if}
		{#if codeData && !codeData.idling}
			<div class="flex flex-col items-start sm:items-end">
				<span class="text-ocean-900 dark:text-ocean-100">vsc</span>
				<span class="text-ocean-800 dark:text-ocean-300">{codeData.workspace}{codeData.branch ? `/${codeData.branch}` : ''}</span>
				<span class="text-ocean-700 dark:text-ocean-400">currently writing <span class="text-ocean-700 dark:text-ocean-200">{codeData.lang}</span></span>
			</div>
		{/if}
	</div>
</section>