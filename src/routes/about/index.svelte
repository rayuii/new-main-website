<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	let mounted = false;

	onMount(() => {
		mounted = true;
	});

	const specs = [
		{ label: 'cpu', value: 'i5-13400F' },
		{ label: 'gpu', value: 'NVIDIA Geforce RTX 3060 12GB' },
		{ label: 'ram', value: '64 GB DDR4' },
		{ label: 'storage', value: 'Samsung 990 PRO 1TB, Seagate Barracuda 2TB' },
		{ label: 'motherboard', value: 'ASRock B760M Pro RS/D4 WiFi' },
		{ label: 'monitor', value: 'Lenovo Legion 24-10' },
		{ label: 'keyboard', value: 'Wooting 60HE' },
		{ label: 'mouse', value: 'Logitech PRO 2 LIGHTSPEED' },
		{ label: 'tablet', value: 'Wacom CTL-472' },
		{ label: 'os', value: 'Classic 7 (Forced to use Win11 for now)' }
	];

	const interests = [
		'osu!',
		'web development',
		'music',
		'graphic design',
		'editing'
	];

	const languages = [
		{ name: 'TypeScript', color: '#3178c6' },
		{ name: 'Svelte', color: '#ff3e00' },
		{ name: 'Python', color: '#3776ab' },
		{ name: 'HTML/CSS', color: '#e34c26' },
		{ name: 'PowerShell', color: '#012456' },
		{ name: 'Bash', color: '#4eaa25' }
	];
</script>

<svelte:head>
	<title>about</title>
</svelte:head>

{#if mounted}
<section 
	class="p-8 sm:p-12 lg:p-24 lg:py-16 font-cascadia"
	in:fade={{ duration: 200 }}
>
	<div class="max-w-2xl">
		<h1 
			class="text-ocean-900 dark:text-ocean-100 text-2xl mb-2"
			in:fly={{ y: -20, duration: 300 }}
		>
			about
		</h1>
		<p 
			class="text-ocean-700 dark:text-ocean-400 mb-10"
			in:fly={{ y: -20, duration: 300, delay: 50 }}
		>
			a bit more about me
		</p>

		<!-- Bio -->
		<div 
			class="mb-10"
			in:fly={{ y: 20, duration: 300, delay: 100 }}
		>
			<h2 class="text-ocean-900 dark:text-ocean-100 text-lg mb-3">who?</h2>
			<div class="text-ocean-800 dark:text-ocean-300 text-sm space-y-3">
				<p>
					hey, i'm sundei. i'm a student and developer from Estonia. i enjoy building things 
					for the web, playing osu!, and listening to way too much music.
				</p>
				<p>
					i mostly work with TypeScript and Svelte these days. this portfolio is built with 
					SvelteKit, Tailwind CSS, and a bunch of APIs stitched together.
				</p>
				<p>
					when i'm not coding, i'm probably watching streams, staffing osu! tournaments, 
					or contributing to random wikis.
				</p>
			</div>
		</div>

		<!-- Setup -->
		<div 
			class="mb-10"
			in:fly={{ y: 20, duration: 300, delay: 200 }}
		>
			<h2 class="text-ocean-900 dark:text-ocean-100 text-lg mb-3">pc specs</h2>
			<div class="grid grid-cols-2 gap-2">
				{#each specs as item, i}
					<div 
						class="border border-ocean-300 dark:border-ocean-700 rounded p-3"
						in:fly={{ x: -10, duration: 200, delay: 250 + i * 50 }}
					>
						<span class="text-ocean-600 dark:text-ocean-500 text-xs">{item.label}</span>
						<p class="text-ocean-900 dark:text-ocean-100 text-sm">{item.value}</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- Languages -->
		<div 
			class="mb-10"
			in:fly={{ y: 20, duration: 300, delay: 300 }}
		>
			<h2 class="text-ocean-900 dark:text-ocean-100 text-lg mb-3">languages & tools</h2>
			<div class="flex flex-wrap gap-2">
				{#each languages as lang, i}
					<span 
						class="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-ocean-300 dark:border-ocean-700 rounded"
						in:fly={{ y: 10, duration: 200, delay: 350 + i * 40 }}
					>
						<span 
							class="w-2.5 h-2.5 rounded-full flex-shrink-0" 
							style="background-color: {lang.color}"
						></span>
						<span class="text-ocean-900 dark:text-ocean-100">{lang.name}</span>
					</span>
				{/each}
			</div>
		</div>

		<!-- Interests -->
		<div 
			class="mb-10"
			in:fly={{ y: 20, duration: 300, delay: 400 }}
		>
			<h2 class="text-ocean-900 dark:text-ocean-100 text-lg mb-3">interests</h2>
			<ul class="list-disc list-inside text-ocean-800 dark:text-ocean-300 text-sm space-y-1">
				{#each interests as interest, i}
					<li in:fly={{ x: -10, duration: 200, delay: 450 + i * 40 }}>
						{interest}
					</li>
				{/each}
			</ul>
		</div>

		<!-- Contact -->
		<div in:fly={{ y: 20, duration: 300, delay: 500 }}>
			<h2 class="text-ocean-900 dark:text-ocean-100 text-lg mb-3">reach me</h2>
			<div class="flex flex-wrap gap-3 text-sm">
				<a 
					href="https://twitter.com/deprivedsundei" 
					target="_blank" rel="noopener noreferrer"
					class="text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 dark:hover:text-ocean-100 underline transition-colors"
				>
					twitter
				</a>
				<a 
					href="https://github.com/rayuii" 
					target="_blank" rel="noopener noreferrer"
					class="text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 dark:hover:text-ocean-100 underline transition-colors"
				>
					github
				</a>
				<a 
					href="mailto:sundei@sundei.ee"
					class="text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 dark:hover:text-ocean-100 underline transition-colors"
				>
					email
				</a>
				<!-- <a 
					href="https://osu.ppy.sh/users/28827755" 
					target="_blank" rel="noopener noreferrer"
					class="text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 dark:hover:text-ocean-100 underline transition-colors"
				>
					osu!
				</a> -->
			</div>
		</div>
	</div>
</section>
{/if}
