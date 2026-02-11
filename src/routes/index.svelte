<script context="module" lang="ts">
	export const prerender = true;
</script>

<script lang="ts">
	import { DateTime } from 'luxon';
	// Components
	import Branch from '$lib/components/Branch.svelte';
	import Language from '$lib/components/Language.svelte';
	import ProjectItem from '$lib/components/ProjectItem.svelte';
	import Workspace from '$lib/components/Workspace.svelte';
	import Terminal from '$lib/components/Terminal.svelte';
	import { getCodeData, getOtherActivities } from '$lib/rpcUtils';
	import { useLanyard } from 'sk-lanyard';
	import { onMount } from 'svelte';

	const timeZone = 'America/Vancouver';
	const isTimeZoneSame = Intl.DateTimeFormat().resolvedOptions().timeZone === timeZone;
	let timeZoneToggle = false;

	let userLocation = '';
	let targetLocation = '';


	async function getLocationFromTimezone(tz: string): Promise<string> {
		try {
			// Convert timezone to a location string (e.g., "America/Vancouver" -> "Vancouver")
			const locationQuery = tz.split('/').pop()?.replace(/_/g, ' ') || tz;
			const response = await fetch(`/api/timezone?location=${encodeURIComponent(locationQuery)}`);
			const data = await response.json();
			const city = data.location?.city;
			const state = data.location?.state_prov;
			const country = data.location?.country_name;
			return [city, state, country].filter(Boolean).join(', ');
		} catch (e) {
			console.error('Error fetching location:', e);
			return tz.split('/').pop()?.replace(/_/g, ' ') || tz;
		}
	}

	// Fetch locations on mount
	if (typeof window !== 'undefined') {
		const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
		getLocationFromTimezone(userTz).then(loc => userLocation = loc);
		getLocationFromTimezone(timeZone).then(loc => targetLocation = loc);
	}

	$: timeFormatter = new Intl.DateTimeFormat('en-US', {
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		timeZone: timeZoneToggle ? timeZone : undefined
	});
	$: dateFormatter = new Intl.DateTimeFormat('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
		timeZone: timeZoneToggle ? timeZone : undefined
	});

	let now = new Date();
	setInterval(() => {
		now = new Date();
	}, 100);

	$: date = dateFormatter.format(now);
	$: time = timeFormatter.format(now);

	$: displayCity = timeZoneToggle 
		? (targetLocation || timeZone.split('/').pop()?.replace(/_/g, ' '))
		: (userLocation || Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()?.replace(/_/g, ' '));
	
	const data = useLanyard({ method: 'ws', id: '1113690068113170484' });
	$: codeData = getCodeData($data);
	
	// Discord avatar URL
	$: discordAvatar = $data?.discord_user?.avatar 
		? `https://cdn.discordapp.com/avatars/${$data.discord_user.id}/${$data.discord_user.avatar}.${$data.discord_user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
		: null;
	
	// Clan badge URL
	$: clanBadge = $data?.discord_user?.primary_guild?.badge && $data?.discord_user?.primary_guild?.identity_guild_id
		? `https://cdn.discordapp.com/clan-badges/${$data.discord_user.primary_guild.identity_guild_id}/${$data.discord_user.primary_guild.badge}.png?size=16`
		: null;
	
	// Status color mapping
	$: statusColor = {
		'online': 'bg-green-500',
		'idle': 'bg-yellow-500',
		'dnd': 'bg-red-500',
		'offline': 'bg-gray-500'
	}[$data?.discord_status || 'offline'];

	// RyuK quotes
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

	function newQuote() {
		currentQuote = kwanMindset[Math.floor(Math.random() * kwanMindset.length)];
	}

	// Weather
	let weather = {
		temp: 0,
		feels_like: 0,
		description: '',
		icon: '',
		humidity: 0,
		wind_speed: 0
	};
	let weatherLoading = true;
	let lastPlayedTrack: any = null;

	// Romanization cache
	let romanizedCache: Record<string, string> = {};
	
	async function romanizeText(text: string): Promise<string> {
		if (!text) return text;
		if (romanizedCache[text]) return romanizedCache[text];
		// Only romanize if text contains Japanese characters
		if (!/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text)) {
			romanizedCache[text] = text;
			return text;
		}
		try {
			const res = await fetch('/api/romanize', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text })
			});
			if (res.ok) {
				const data = await res.json();
				romanizedCache[text] = data.romanized;
				return data.romanized;
			}
		} catch (e) {
			console.error('Romanize failed:', e);
		}
		romanizedCache[text] = text;
		return text;
	}

	// Reactive romanized Spotify names
	let romanizedSong = '';
	let romanizedArtist = '';
	let romanizedAlbum = '';
	let romanizedLastSong = '';
	let romanizedLastArtist = '';

	$: if ($data?.spotify?.song) {
		romanizeText($data.spotify.song).then(r => romanizedSong = r);
	}
	$: if ($data?.spotify?.artist) {
		romanizeText($data.spotify.artist).then(r => romanizedArtist = r);
	}
	$: if ($data?.spotify?.album) {
		romanizeText($data.spotify.album).then(r => romanizedAlbum = r);
	}
	$: if (lastPlayedTrack?.track?.name) {
		romanizeText(lastPlayedTrack.track.name).then(r => romanizedLastSong = r);
	}
	$: if (lastPlayedTrack?.track?.artists) {
		romanizeText(lastPlayedTrack.track.artists.map(a => a.name).join(', ')).then(r => romanizedLastArtist = r);
	}

	onMount(async () => {
		try {
			const response = await fetch('/api/weather');
			if (response.ok) {
				weather = await response.json();
			}
		} catch (error) {
			console.error('Failed to fetch weather:', error);
		} finally {
			weatherLoading = false;
		}

		// Fetch last played Spotify track
		try {
			const response = await fetch('/api/recent-tracks');
			if (response.ok) {
				lastPlayedTrack = await response.json();
			}
		} catch (error) {
			console.error('Failed to fetch last played track:', error);
		}
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

<section
	class="p-8 sm:p-12 lg:p-24 lg:py-16 font-cascadia z-10 flex flex-col sm:flex-row gap-y-10 justify-between"
>
	<div class="flex flex-col gap-7 flex-1">
		<div class="min-h-[3em] lg:min-h-0 flex items-center gap-3">
			{#if $data?.discord_user && discordAvatar}
				<div class="relative flex-shrink-0">
					<img 
						src={discordAvatar} 
						alt="Discord avatar"
						class="w-12 h-12 rounded-full"
					/>
					<div class="absolute bottom-0 right-0 w-3 h-3 {statusColor} rounded-full border-2 border-ocean-100 dark:border-ocean-900"></div>
				</div>
			{/if}
			<h1 class="text-ocean-900 dark:text-ocean-300 break-words min-w-0 flex items-center gap-1 flex-wrap">
				<span class="text-ocean-900 dark:text-ocean-blue flex items-center gap-2">
					sundei
					{#if clanBadge && $data?.discord_user?.primary_guild?.tag}
						<span class="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-ocean-200 dark:bg-ocean-800 border border-ocean-300 dark:border-ocean-600 rounded text-ocean-900 dark:text-ocean-100">
							<img 
								src={clanBadge} 
								alt="Clan badge"
								class="w-3 h-3"
							/>
							<span>{$data.discord_user.primary_guild.tag}</span>
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
				<ProjectItem
					href="https://github.com/rayuii/winpowershell"
					name="scripts"
					description="powershell scripts (school)"
				/>
				<ProjectItem
					href="https://github.com/rayuii/Titanic-Wiki"
					name="titanic wiki"
					description="contributions in estonian and dutch"
				/>
				<ProjectItem
					href="https://github.com/rayuii/portfolio"
					name="old portfolio"
					description="buh"
				/>
			</ul>
		</div>
		<div>
			<h1 class="text-ocean-900 dark:text-ocean-100">projects</h1>
			<ul class="list-disc list-inside text-ocean-800 dark:text-ocean-blue">
				<ProjectItem
					href="https://github.com/rayuii/skriptlinux"
					name="linux scripts"
					description="school forces me to suffer"
				/>
				<ProjectItem
					href="https://www.tartulinnaliin.ee"
					name="where is my bus lol"
					description="tartu bussiajad, but website"
				/>
				<ProjectItem
					href="https://github.com/rayuii/fonoteek"
					name="fonoteek"
					description="object-oriented programming stuff"
				/>
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

		<!-- RyuK Quote Section -->
		<div class="mt-4 w-full sm:w-96">
			<h2 class="text-ocean-900 dark:text-ocean-100 text-lg mb-2">kwan wisdom</h2>
			<div class="border border-ocean-300 dark:border-ocean-700 rounded p-4">
				<p class="text-ocean-800 dark:text-ocean-100 text-sm italic">"{currentQuote}"</p>
				<button 
					on:click={newQuote}
					class="mt-3 text-ocean-600 dark:text-ocean-400 hover:text-ocean-900 dark:hover:text-ocean-100 text-xs underline"
				>
					new quote
				</button>
			</div>
		</div>

		<!-- Interactive Terminal -->
		<div class="mt-2">
			<Terminal />
		</div>
	</div>
	<div
		class="text-ocean-900 dark:text-ocean-300 flex flex-col items-start sm:items-end gap-3 sm:gap-7 sm:text-right"
	>
		{#if !isTimeZoneSame}
			<div
				class="flex flex-col items-start sm:items-end hover:underline cursor-pointer"
				on:click={() => (timeZoneToggle = !timeZoneToggle)}
			>
				<span>{date}</span>
				<span>{time} in {displayCity || 'loading...'}</span>
			</div>
		{:else}
			<div class="flex flex-col items-start sm:items-end">
				<span>{date}</span>
				<span>{time}</span>
			</div>
		{/if}
		
		{#if $data?.activities?.find(a => a.type === 4)}
			{@const customStatus = $data.activities.find(a => a.type === 4)}
			<div class="flex flex-col items-start sm:items-end gap-1">
				<span class="text-ocean-900 dark:text-ocean-100 flex items-center gap-1.5 sm:flex-row-reverse">
					{#if customStatus.emoji}
						{#if customStatus.emoji.id}
							<img 
								src="https://cdn.discordapp.com/emojis/{customStatus.emoji.id}.{customStatus.emoji.animated ? 'gif' : 'png'}?size=20" 
								alt={customStatus.emoji.name}
								class="w-5 h-5"
							/>
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
		
		{#if $data?.spotify}
			<div class="flex flex-col items-start sm:items-end gap-2">
				<div class="flex items-center gap-3 sm:flex-row-reverse">
					{#if $data.spotify?.album_art_url}
						<img 
							src={$data.spotify.album_art_url} 
							alt="Album art"
							class="w-16 h-16 rounded shadow-lg"
						/>
					{/if}
					<div class="flex flex-col items-start sm:items-end">
						<a 
							href="https://open.spotify.com/track/{$data.spotify?.track_id}"
							target="_blank"
							rel="noopener noreferrer"
								class="text-ocean-900 dark:text-ocean-100 hover:underline"
							>
								{romanizedSong || $data.spotify?.song}
							</a>
							<span class="text-ocean-800 dark:text-ocean-300">{romanizedArtist || $data.spotify?.artist}</span>
							<span class="text-ocean-700 dark:text-ocean-400">{romanizedAlbum || $data.spotify?.album}</span>
					</div>
				</div>
				{#if $data.spotify?.timestamps}
					{@const elapsed = now.getTime() - $data.spotify.timestamps.start}
					{@const total = $data.spotify.timestamps.end - $data.spotify.timestamps.start}
					{@const progress = Math.min(100, (elapsed / total) * 100)}
					{@const elapsedMin = Math.floor(elapsed / 60000)}
					{@const elapsedSec = Math.floor((elapsed % 60000) / 1000)}
					{@const totalMin = Math.floor(total / 60000)}
					{@const totalSec = Math.floor((total % 60000) / 1000)}
					<span class="text-ocean-700 dark:text-ocean-400 text-sm">
						{elapsedMin}:{elapsedSec.toString().padStart(2, '0')} / {totalMin}:{totalSec.toString().padStart(2, '0')}
					</span>
					<div class="w-full max-w-[200px] h-1 bg-ocean-300 dark:bg-ocean-700 rounded-full overflow-hidden">
						<div 
							class="h-full bg-ocean-700 dark:bg-ocean-300 transition-all duration-100"
							style="width: {progress}%"
						></div>
					</div>
				{/if}
			</div>
		{:else if lastPlayedTrack}
			<div class="flex flex-col items-start sm:items-end gap-2">
				<span class="text-ocean-700 dark:text-ocean-400 text-sm">last played</span>
				<div class="flex items-center gap-3 sm:flex-row-reverse">
					{#if lastPlayedTrack.track?.album?.images?.[0]?.url}
						<img 
							src={lastPlayedTrack.track.album.images[0].url} 
							alt="Album art"
							class="w-16 h-16 rounded shadow-lg"
						/>
					{/if}
					<div class="flex flex-col items-start sm:items-end">
						<a 
							href={lastPlayedTrack.track?.external_urls?.spotify}
							target="_blank"
							rel="noopener noreferrer"
							class="text-ocean-900 dark:text-ocean-100 hover:underline"
						>
							{romanizedLastSong || lastPlayedTrack.track?.name}
						</a>
						<span class="text-ocean-800 dark:text-ocean-300">
							{romanizedLastArtist || lastPlayedTrack.track?.artists?.map(a => a.name).join(', ')}
						</span>
						<span class="text-ocean-700 dark:text-ocean-400 text-sm">
							{new Date(lastPlayedTrack.played_at).toLocaleTimeString()}
						</span>
					</div>
				</div>
			</div>
		{/if}
		{#if $data?.activities}
			{#each $data.activities.filter(a => 
				(a.type === 0 || a.type === 3) && 
				a.application_id !== '782685898163617802' && // VSCode app ID
				!a.name.toLowerCase().includes('spotify')
			) as activity}
				{@const isTwitch = activity.name?.toLowerCase().includes('twitch') || activity.application_id === '802958789555781663'}
				{@const twitchUsername = isTwitch ? (activity.state || activity.name) : null}
				{@const twitchUrl = twitchUsername ? `https://twitch.tv/${twitchUsername}` : null}
				<div class="flex flex-col items-start sm:items-end gap-2">
					<div class="flex items-center gap-3 sm:flex-row-reverse">
						<div class="flex flex-col items-start sm:items-end">
							{#if twitchUrl}
								<a 
									href={twitchUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="text-ocean-900 dark:text-ocean-100 hover:underline"
								>
									{activity.name}
								</a>
							{:else}
								<span class="text-ocean-900 dark:text-ocean-100">{activity.name}</span>
							{/if}
							{#if activity.details}
								<span class="text-ocean-800 dark:text-ocean-300">{activity.details}</span>
							{/if}
							{#if activity.state && !isTwitch}
								<span class="text-ocean-700 dark:text-ocean-400">{activity.state}</span>
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
		{/if}
		{#if codeData?.idling}
			<div class="flex flex-col items-start sm:items-end">
				<span class="text-ocean-900 dark:text-ocean-100">vsc</span>
				<span class="text-ocean-700 dark:text-ocean-400">currently idling </span>
			</div>
		{/if}
		{#if codeData && !codeData.idling}
			<div class="flex flex-col items-start sm:items-end">
				<span class="text-ocean-900 dark:text-ocean-100">vsc</span>
				<span class="text-ocean-800 dark:text-ocean-300"
					>{codeData.workspace}{codeData.branch ? `/${codeData.branch}` : ''}</span
				>
				<span class="text-ocean-700 dark:text-ocean-400"
					>currently writing
					<span class="text-ocean-700 dark:text-ocean-200">{codeData.lang}</span>
				</span>
			</div>
		{/if}
	</div>
</section>