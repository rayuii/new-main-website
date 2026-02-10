<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { navigating } from '$app/stores';

	import '../app.css';

	let weather = {
		temp: 0,
		feels_like: 0,
		description: '',
		icon: '',
		humidity: 0,
		wind_speed: 0
	};
	let weatherLoading = true;

	onMount(() => {
		onblur = () => {
			document.body.className =
				'bg-[#f3f3f3] dark:bg-[#202020] motion-safe:transition-colors motion-safe:duration-300';
		};
		onfocus = () => {
			document.body.className =
				'bg-[#f9f0f5] dark:bg-[#281c21] motion-safe:transition-colors motion-safe:duration-300';
		};

		// Fetch weather
		const fetchWeather = async () => {
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
		};

		fetchWeather();
	});
</script>

<nav class="border-b border-ocean-300 dark:border-ocean-700 sticky top-0 backdrop-blur-md bg-opacity-90">
	<div class="px-8 sm:px-12 lg:px-24 py-4 flex justify-between items-center font-cascadia">
		<a href="/" class="text-ocean-700 dark:text-ocean-300 hover:text-ocean-900 dark:hover:text-ocean-100 font-medium">
			sundei
		</a>
		<div class="flex gap-6 text-ocean-700 dark:text-ocean-400 text-sm items-center">
			<a href="/" class="hover:text-ocean-900 dark:hover:text-ocean-100 transition-colors">home</a>
			<a href="/stats" class="hover:text-ocean-900 dark:hover:text-ocean-100 transition-colors">stats</a>
			<a href="/blog" class="hover:text-ocean-900 dark:hover:text-ocean-100 transition-colors">blog</a>
			<a href="/tournaments" class="hover:text-ocean-900 dark:hover:text-ocean-100 transition-colors">tournaments</a>
			<a href="/gallery" class="hover:text-ocean-900 dark:hover:text-ocean-100 transition-colors">gallery</a>
			
			<!-- Weather in navbar -->
			{#if !weatherLoading && weather.temp}
				<div class="flex items-center gap-2 border-l border-ocean-300 dark:border-ocean-700 pl-6">
					{#if weather.icon}
						<img 
							src="https://openweathermap.org/img/wn/{weather.icon}.png" 
							alt={weather.description}
							class="w-6 h-6"
						/>
					{/if}
					<span class="text-ocean-700 dark:text-ocean-400">{weather.temp}°C</span>
				</div>
			{/if}
		</div>
	</div>
</nav>

{#key $navigating}
	<main in:fade={{ duration: 200 }}>
		<slot />
	</main>
{/key}

<footer />
