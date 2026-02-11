<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	
	let mounted = false;
	
	onMount(() => {
		mounted = true;
	});
	
	// Blog posts will be stored here - you can later move to markdown files or a CMS
	const posts = [
		{
			id: 1,
			title: 'welcome to my corner of the internet',
			date: '2026-02-10',
			excerpt: 'hey, i\'m sundei. welcome to my little space on the web where i dump thoughts, projects, and whatever else feels worth remembering.',
			slug: 'welcome',
			banner: 'https://static-cdn.jtvnw.net/twitch-clips-thumbnails-prod/MoistSplendidDaikonGivePLZ-rpocgIoqXQkx7pi4/fd0ab4f0-e35d-4c3f-9cf3-72ee9fbb6a81/preview.jpg'
		}
	];
</script>

<svelte:head>
	<title>blog</title>
	<meta name="og:title" content="blog" />
	<meta name="description" content="thoughts, tutorials, and random writings" />
	<meta name="og:description" content="thoughts, tutorials, and random writings" />
	<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f9f0f5" />
	<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#281c21" />
</svelte:head>

<section class="p-8 sm:p-12 lg:p-24 lg:py-16 font-cascadia">
	{#if mounted}
		<div class="flex flex-col gap-7">
			<div in:fly={{ y: -20, duration: 400, delay: 0 }}>
				<h1 class="text-ocean-900 dark:text-ocean-100">blog</h1>
				<p class="text-ocean-700 dark:text-ocean-400">thoughts, tutorials, and random writings</p>
			</div>

			<div class="flex flex-col gap-6">
				{#each posts as post, i}
					<article 
						class="border border-ocean-300 dark:border-ocean-700 rounded-lg overflow-hidden hover:border-ocean-400 dark:hover:border-ocean-600 transition-colors"
						in:fly={{ y: 20, duration: 400, delay: 100 + (i * 100) }}
					>
					<a href="/blog/{post.slug}">
						{#if post.banner}
							<div class="w-full h-48 overflow-hidden">
								<img 
									src={post.banner}
									alt={post.title}
									class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
								/>
							</div>
						{/if}
						<div class="p-4">
							<h2 class="text-ocean-900 dark:text-ocean-100 hover:underline text-xl font-medium">
								{post.title}
							</h2>
							<p class="text-ocean-700 dark:text-ocean-400 text-sm mt-1">
								{new Date(post.date).toLocaleDateString('en-US', { 
									month: 'long', 
									day: 'numeric', 
									year: 'numeric' 
								})}
							</p>
							<p class="text-ocean-800 dark:text-ocean-300 mt-2">
								{post.excerpt}
							</p>
						</div>
					</a>
				</article>
			{:else}
				<p class="text-ocean-700 dark:text-ocean-400">No posts yet. Coming soon!</p>
			{/each}
		</div>
	</div>
	{/if}
</section>
