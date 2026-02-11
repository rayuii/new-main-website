<script context="module" lang="ts">
	export function load({ error, status }: { error: Error; status: number }) {
		return {
			props: {
				title: status === 404 ? 'page not found' : 'something went wrong',
				status,
				message: error?.message || 'An unexpected error occurred'
			}
		};
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	export let title: string;
	export let status: number;
	export let message: string;

	let mounted = false;

	const messages404 = [
		'looks like this page went on vacation.',
		'this page is playing hide and seek... and winning.',
		'nothing here but tumbleweeds.',
		'the page you\'re looking for has left the chat.',
		'404: page is out touching grass.',
		'this page doesn\'t exist. or does it? no. it doesn\'t.',
		'you\'ve ventured into the void.'
	];

	const messages500 = [
		'the server is having a moment.',
		'something broke. it wasn\'t me. probably.',
		'internal crisis detected.',
		'the hamsters powering the server need a break.',
		'this is fine. everything is fine.'
	];

	let funMessage = '';

	onMount(() => {
		mounted = true;
		const pool = status === 404 ? messages404 : messages500;
		funMessage = pool[Math.floor(Math.random() * pool.length)];
	});
</script>

<svelte:head>
	<title>{status} - {title}</title>
</svelte:head>

{#if mounted}
<section 
	class="p-8 sm:p-12 lg:p-24 lg:py-16 font-cascadia min-h-[60vh] flex flex-col items-center justify-center text-center"
	in:fade={{ duration: 200 }}
>
	<div 
		class="text-ocean-300 dark:text-ocean-700 text-[8rem] sm:text-[12rem] font-bold leading-none select-none"
		in:fly={{ y: -30, duration: 400 }}
	>
		{status}
	</div>

	<h1 
		class="text-ocean-900 dark:text-ocean-100 text-xl sm:text-2xl mt-2"
		in:fly={{ y: -20, duration: 300, delay: 100 }}
	>
		{title}
	</h1>

	<p 
		class="text-ocean-600 dark:text-ocean-400 mt-3 max-w-md"
		in:fly={{ y: -20, duration: 300, delay: 200 }}
	>
		{funMessage}
	</p>

	<div 
		class="mt-8 flex gap-4"
		in:fly={{ y: 20, duration: 300, delay: 300 }}
	>
		<a 
			href="/" 
			class="px-4 py-2 border border-ocean-300 dark:border-ocean-700 rounded text-ocean-700 dark:text-ocean-300 hover:bg-ocean-200/50 dark:hover:bg-ocean-800/50 transition-colors text-sm"
		>
			go home
		</a>
		<button 
			on:click={() => history.back()}
			class="px-4 py-2 border border-ocean-300 dark:border-ocean-700 rounded text-ocean-700 dark:text-ocean-300 hover:bg-ocean-200/50 dark:hover:bg-ocean-800/50 transition-colors text-sm"
		>
			go back
		</button>
	</div>

	{#if status !== 404}
		<p 
			class="text-ocean-500 dark:text-ocean-600 text-xs mt-6 max-w-sm"
			in:fly={{ y: 10, duration: 200, delay: 400 }}
		>
			{message}
		</p>
	{/if}
</section>
{/if}
