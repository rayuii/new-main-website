export async function GET() {
	try {
		const USER_ID = 3505; // Your Titanic user ID
		
		const response = await fetch(`https://api.titanic.sh/users/lookup/${USER_ID}`);
		
		if (!response.ok) {
			throw new Error('Failed to fetch Titanic stats');
		}

		const data = await response.json();
		
		// Get standard mode (mode 0) stats
		const standardStats = data.stats?.find((s: any) => s.mode === 0) || {};
		const rankings = data.rankings?.['0'] || {};

		const stats = {
			username: data.name || 'N/A',
			rank: rankings.performance?.global || 0,
			country_rank: rankings.performance?.country || 0,
			pp: Math.round(standardStats.pp || 0),
			accuracy: (standardStats.acc * 100).toFixed(2),
			playcount: standardStats.playcount || 0,
			level: Math.floor(standardStats.acc * 100) || 0, // Approximate level
			total_score: standardStats.tscore || 0,
			ranked_score: standardStats.rscore || 0,
			max_combo: standardStats.max_combo || 0,
			country: data.country || 'N/A'
		};

		return new Response(JSON.stringify(stats), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=300, s-maxage=600'
			}
		});
	} catch (error) {
		console.error('Titanic API Error:', error);
		return new Response(JSON.stringify({ 
			username: 'N/A',
			rank: 0,
			country_rank: 0,
			pp: 0,
			accuracy: '0.00',
			playcount: 0,
			level: 0,
			error: 'Failed to fetch stats'
		}), {
			status: 200, // Return 200 to avoid breaking the page
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
