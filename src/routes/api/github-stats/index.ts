export async function GET({ url }: any) {
	const username = 'rayuii'; // Your GitHub username

	try {
		// Fetch user data
		const userResponse = await fetch(`https://api.github.com/users/${username}`, {
			headers: {
				'Accept': 'application/vnd.github.v3+json',
				// Optional: Add GitHub token for higher rate limits
				// 'Authorization': `token ${process.env.GITHUB_TOKEN}`
			}
		});

		if (!userResponse.ok) {
			throw new Error('Failed to fetch GitHub user data');
		}

		const userData = await userResponse.json();

		// Fetch repositories
		const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, {
			headers: {
				'Accept': 'application/vnd.github.v3+json'
			}
		});

		if (!reposResponse.ok) {
			throw new Error('Failed to fetch GitHub repos');
		}

		const repos = await reposResponse.json();

		// Calculate total stars
		const totalStars = repos.reduce((sum: number, repo: any) => sum + repo.stargazers_count, 0);

		// Calculate total forks
		const totalForks = repos.reduce((sum: number, repo: any) => sum + repo.forks_count, 0);

		// Get contribution data (this requires authentication for accurate data)
		// For now, we'll use a placeholder or you can add GitHub token
		
		const stats = {
			repos: userData.public_repos,
			stars: totalStars,
			forks: totalForks,
			followers: userData.followers,
			following: userData.following,
			bio: userData.bio,
			location: userData.location,
			// You can fetch contributions from GitHub GraphQL API with authentication
			contributions: 0 // Placeholder
		};

		return new Response(JSON.stringify(stats), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=300, s-maxage=600' // Cache for 5-10 minutes
			}
		});
	} catch (error) {
		console.error('GitHub API Error:', error);
		return new Response(JSON.stringify({ error: 'Failed to fetch GitHub stats' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
}
