<script lang="ts">
	import { onMount } from 'svelte';

	// Tournament management
	let tournaments = [
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

	// New tournament form
	let newTournament = {
		year: '2026',
		name: '',
		role: 'referee',
		link: '',
		badge: ''
	};

	// Blog management
	let blogs = [
		{ title: 'Example Blog Post', slug: 'example-blog', date: '2026-02-10', published: false }
	];

	// New blog form
	let newBlog = {
		title: '',
		slug: '',
		content: '',
		published: false
	};

	let activeTab = 'tournaments';

	function addTournament() {
		if (!newTournament.name || !newTournament.link) {
			alert('Please fill in tournament name and link');
			return;
		}

		const yearGroup = tournaments.find(t => t.year === newTournament.year);
		const event = {
			name: newTournament.name,
			role: newTournament.role,
			link: newTournament.link,
			...(newTournament.badge && { badge: newTournament.badge })
		};

		if (yearGroup) {
			yearGroup.events.push(event);
			tournaments = tournaments;
		} else {
			tournaments.push({
				year: newTournament.year,
				events: [event]
			});
			tournaments = tournaments;
		}

		// Reset form
		newTournament = {
			year: newTournament.year,
			name: '',
			role: 'referee',
			link: '',
			badge: ''
		};

		exportTournaments();
	}

	function deleteTournament(yearIndex: number, eventIndex: number) {
		tournaments[yearIndex].events.splice(eventIndex, 1);
		if (tournaments[yearIndex].events.length === 0) {
			tournaments.splice(yearIndex, 1);
		}
		tournaments = tournaments;
		exportTournaments();
	}

	function exportTournaments() {
		const exported = JSON.stringify(tournaments, null, 2);
		console.log('Export this to tournaments/index.svelte:');
		console.log(exported);
	}

	function addBlog() {
		if (!newBlog.title || !newBlog.slug) {
			alert('Please fill in title and slug');
			return;
		}

		blogs.push({
			title: newBlog.title,
			slug: newBlog.slug,
			date: new Date().toISOString().split('T')[0],
			published: newBlog.published
		});
		blogs = blogs;

		// Reset form
		newBlog = {
			title: '',
			slug: '',
			content: '',
			published: false
		};

		console.log('Create file: src/routes/blog/' + newBlog.slug + '/+page.svelte');
	}

	function deleteBlog(index: number) {
		blogs.splice(index, 1);
		blogs = blogs;
	}

	function generateSlug() {
		newBlog.slug = newBlog.title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}
</script>

<svelte:head>
	<title>admin panel</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<section class="p-8 sm:p-12 lg:p-24 lg:py-16 font-cascadia">
	<div class="flex flex-col gap-7">
		<div>
			<h1 class="text-ocean-900 dark:text-ocean-100">admin panel</h1>
			<p class="text-ocean-700 dark:text-ocean-400">manage content</p>
		</div>

		<!-- Tabs -->
		<div class="flex gap-2 border-b border-ocean-300 dark:border-ocean-700">
			<button
				on:click={() => activeTab = 'tournaments'}
				class="px-4 py-2 font-medium transition-colors {activeTab === 'tournaments' ? 'text-ocean-900 dark:text-ocean-100 border-b-2 border-ocean-600' : 'text-ocean-600 dark:text-ocean-500 hover:text-ocean-800 dark:hover:text-ocean-300'}"
			>
				tournaments
			</button>
			<button
				on:click={() => activeTab = 'blogs'}
				class="px-4 py-2 font-medium transition-colors {activeTab === 'blogs' ? 'text-ocean-900 dark:text-ocean-100 border-b-2 border-ocean-600' : 'text-ocean-600 dark:text-ocean-500 hover:text-ocean-800 dark:hover:text-ocean-300'}"
			>
				blogs
			</button>
		</div>

		<!-- Tournament Management -->
		{#if activeTab === 'tournaments'}
			<div class="flex flex-col gap-6">
				<!-- Add Tournament Form -->
				<div class="border border-ocean-300 dark:border-ocean-700 rounded-lg p-6 bg-ocean-50 dark:bg-ocean-900">
					<h2 class="text-xl font-semibold text-ocean-900 dark:text-ocean-100 mb-4">add tournament</h2>
					<div class="flex flex-col gap-4">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-ocean-700 dark:text-ocean-400 mb-1">
									year
								</label>
								<input
									type="text"
									bind:value={newTournament.year}
									placeholder="2026"
									class="w-full px-3 py-2 border border-ocean-300 dark:border-ocean-600 rounded bg-white dark:bg-ocean-800 text-ocean-900 dark:text-ocean-100"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-ocean-700 dark:text-ocean-400 mb-1">
									role
								</label>
								<select
									bind:value={newTournament.role}
									class="w-full px-3 py-2 border border-ocean-300 dark:border-ocean-600 rounded bg-white dark:bg-ocean-800 text-ocean-900 dark:text-ocean-100"
								>
									<option value="referee">referee</option>
									<option value="referee/caster">referee/caster</option>
									<option value="referee/commentator">referee/commentator</option>
									<option value="referee/commentator/playtester">referee/commentator/playtester</option>
									<option value="commentator">commentator</option>
									<option value="playtester">playtester</option>
								</select>
							</div>
						</div>
						<div>
							<label class="block text-sm font-medium text-ocean-700 dark:text-ocean-400 mb-1">
								tournament name
							</label>
							<input
								type="text"
								bind:value={newTournament.name}
								placeholder="My Tournament"
								class="w-full px-3 py-2 border border-ocean-300 dark:border-ocean-600 rounded bg-white dark:bg-ocean-800 text-ocean-900 dark:text-ocean-100"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-ocean-700 dark:text-ocean-400 mb-1">
								forum link
							</label>
							<input
								type="url"
								bind:value={newTournament.link}
								placeholder="https://osu.ppy.sh/community/forums/topics/..."
								class="w-full px-3 py-2 border border-ocean-300 dark:border-ocean-600 rounded bg-white dark:bg-ocean-800 text-ocean-900 dark:text-ocean-100"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-ocean-700 dark:text-ocean-400 mb-1">
								badge url (optional)
							</label>
							<input
								type="url"
								bind:value={newTournament.badge}
								placeholder="https://i.imgur.com/badge.png"
								class="w-full px-3 py-2 border border-ocean-300 dark:border-ocean-600 rounded bg-white dark:bg-ocean-800 text-ocean-900 dark:text-ocean-100"
							/>
						</div>
						<button
							on:click={addTournament}
							class="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded font-medium transition-colors"
						>
							add tournament
						</button>
					</div>
				</div>

				<!-- Tournament List -->
				<div>
					<h2 class="text-xl font-semibold text-ocean-900 dark:text-ocean-100 mb-4">existing tournaments</h2>
					{#each tournaments as group, yearIndex}
						<div class="mb-6">
							<h3 class="text-lg font-medium text-ocean-900 dark:text-ocean-100 mb-2">{group.year}</h3>
							<div class="flex flex-col gap-2">
								{#each group.events as event, eventIndex}
									<div class="flex items-center justify-between border border-ocean-300 dark:border-ocean-700 rounded p-3 bg-white dark:bg-ocean-800">
										<div class="flex-1">
											<div class="font-medium text-ocean-900 dark:text-ocean-100">{event.name}</div>
											<div class="text-sm text-ocean-600 dark:text-ocean-400">{event.role}</div>
											{#if event.badge}
												<div class="text-xs text-ocean-500">has badge</div>
											{/if}
										</div>
										<button
											on:click={() => deleteTournament(yearIndex, eventIndex)}
											class="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
										>
											delete
										</button>
									</div>
								{/each}
							</div>
						</div>
					{/each}
					<button
						on:click={exportTournaments}
						class="px-4 py-2 bg-ocean-500 hover:bg-ocean-600 text-white rounded font-medium transition-colors"
					>
						export to console
					</button>
				</div>
			</div>
		{/if}

		<!-- Blog Management -->
		{#if activeTab === 'blogs'}
			<div class="flex flex-col gap-6">
				<!-- Add Blog Form -->
				<div class="border border-ocean-300 dark:border-ocean-700 rounded-lg p-6 bg-ocean-50 dark:bg-ocean-900">
					<h2 class="text-xl font-semibold text-ocean-900 dark:text-ocean-100 mb-4">add blog post</h2>
					<div class="flex flex-col gap-4">
						<div>
							<label class="block text-sm font-medium text-ocean-700 dark:text-ocean-400 mb-1">
								title
							</label>
							<input
								type="text"
								bind:value={newBlog.title}
								on:input={generateSlug}
								placeholder="My Blog Post"
								class="w-full px-3 py-2 border border-ocean-300 dark:border-ocean-600 rounded bg-white dark:bg-ocean-800 text-ocean-900 dark:text-ocean-100"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-ocean-700 dark:text-ocean-400 mb-1">
								slug (url)
							</label>
							<input
								type="text"
								bind:value={newBlog.slug}
								placeholder="my-blog-post"
								class="w-full px-3 py-2 border border-ocean-300 dark:border-ocean-600 rounded bg-white dark:bg-ocean-800 text-ocean-900 dark:text-ocean-100"
							/>
							<p class="text-xs text-ocean-500 mt-1">will create: /blog/{newBlog.slug || 'slug'}</p>
						</div>
						<div>
							<label class="block text-sm font-medium text-ocean-700 dark:text-ocean-400 mb-1">
								content
							</label>
							<textarea
								bind:value={newBlog.content}
								placeholder="Write your blog content here..."
								rows="10"
								class="w-full px-3 py-2 border border-ocean-300 dark:border-ocean-600 rounded bg-white dark:bg-ocean-800 text-ocean-900 dark:text-ocean-100 font-mono text-sm"
							/>
						</div>
						<div class="flex items-center gap-2">
							<input
								type="checkbox"
								id="published"
								bind:checked={newBlog.published}
								class="w-4 h-4"
							/>
							<label for="published" class="text-sm text-ocean-700 dark:text-ocean-400">
								publish immediately
							</label>
						</div>
						<button
							on:click={addBlog}
							class="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded font-medium transition-colors"
						>
							create blog post
						</button>
					</div>
				</div>

				<!-- Blog List -->
				<div>
					<h2 class="text-xl font-semibold text-ocean-900 dark:text-ocean-100 mb-4">existing blog posts</h2>
					<div class="flex flex-col gap-2">
						{#each blogs as blog, index}
							<div class="flex items-center justify-between border border-ocean-300 dark:border-ocean-700 rounded p-3 bg-white dark:bg-ocean-800">
								<div class="flex-1">
									<div class="font-medium text-ocean-900 dark:text-ocean-100">{blog.title}</div>
									<div class="text-sm text-ocean-600 dark:text-ocean-400">/blog/{blog.slug}</div>
									<div class="text-xs text-ocean-500">
										{blog.date} • {blog.published ? 'published' : 'draft'}
									</div>
								</div>
								<div class="flex gap-2">
									<a
										href="/blog/{blog.slug}"
										target="_blank"
										class="px-3 py-1 text-sm bg-ocean-600 hover:bg-ocean-700 text-white rounded transition-colors"
									>
										view
									</a>
									<button
										on:click={() => deleteBlog(index)}
										class="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
									>
										delete
									</button>
								</div>
							</div>
						{/each}
						{#if blogs.length === 0}
							<p class="text-ocean-600 dark:text-ocean-400 text-sm">no blog posts yet</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>
