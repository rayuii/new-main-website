let cachedToken: { token: string; expires: number } | null = null;

async function getToken(): Promise<string> {
	if (cachedToken && Date.now() < cachedToken.expires) {
		return cachedToken.token;
	}
	const res = await fetch('https://osu.ppy.sh/oauth/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			client_id: Number(process.env.OSU_CLIENT_ID), // must be a number, not string
			client_secret: process.env.OSU_CLIENT_SECRET,
			grant_type: 'client_credentials',
			scope: 'public'
		})
	});
	const data = await res.json();
	console.log('token status:', res.status, '| has token:', !!data.access_token);
	if (!data.access_token) {
		console.error('token error:', JSON.stringify(data));
		throw new Error('Failed to get osu! token');
	}
	cachedToken = {
		token: data.access_token,
		expires: Date.now() + (data.expires_in - 60) * 1000
	};
	return cachedToken.token;
}

function extractTitle(query: string): string {
	const withoutArtist = query.includes(' - ') ? query.split(' - ').slice(1).join(' - ') : query;
	const withoutRemixer = withoutArtist.replace(/\s*\([^)]*\)\s*$/, '').trim();
	return withoutRemixer || withoutArtist;
}

export async function GET({ url }: any) {
	const query = url.searchParams.get('q');
	const difficulty = url.searchParams.get('difficulty') || '';

	if (!query) {
		return new Response(JSON.stringify({ url: null }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const token = await getToken();
		const headers = {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			Accept: 'application/json'
		};

		const title = extractTitle(query);
		console.log('osu lookup:', { query, title, difficulty });

		const searchRes = await fetch(
			`https://osu.ppy.sh/api/v2/beatmapsets/search?q=${encodeURIComponent(title)}`,
			{ headers }
		);

		console.log('search status:', searchRes.status);

		if (!searchRes.ok) {
			const errText = await searchRes.text();
			console.error('search error:', errText.slice(0, 300));
			return new Response(JSON.stringify({ url: null }), {
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const searchData = await searchRes.json();
		const beatmapsets = searchData.beatmapsets ?? [];

		console.log('beatmapsets found:', beatmapsets.length);
		if (beatmapsets.length) {
			console.log('difficulties in first set:', beatmapsets[0]?.beatmaps?.map((b: any) => b.version));
		}

		if (!beatmapsets.length) {
			return new Response(JSON.stringify({ url: null }), {
				headers: { 'Content-Type': 'application/json' }
			});
		}

		let matchedSet: any = null;
		let matchedBeatmap: any = null;

		// Exact difficulty match
		for (const set of beatmapsets) {
			const found = set.beatmaps?.find(
				(b: any) => b.version?.toLowerCase() === difficulty.toLowerCase()
			);
			if (found) {
				matchedSet = set;
				matchedBeatmap = found;
				console.log('exact match:', found.version);
				break;
			}
		}

		// Partial match
		if (!matchedSet) {
			for (const set of beatmapsets) {
				const found = set.beatmaps?.find(
					(b: any) =>
						b.version?.toLowerCase().includes(difficulty.toLowerCase()) ||
						difficulty.toLowerCase().includes(b.version?.toLowerCase())
				);
				if (found) {
					matchedSet = set;
					matchedBeatmap = found;
					console.log('partial match:', found.version);
					break;
				}
			}
		}

		// Fallback
		if (!matchedSet) {
			matchedSet = beatmapsets[0];
			matchedBeatmap = beatmapsets[0].beatmaps?.[0];
			console.log('fallback to first result');
		}

		const beatmapUrl = matchedBeatmap
			? `https://osu.ppy.sh/beatmapsets/${matchedSet.id}#osu/${matchedBeatmap.id}`
			: `https://osu.ppy.sh/beatmapsets/${matchedSet.id}`;

		console.log('resolved url:', beatmapUrl);

		return new Response(JSON.stringify({ url: beatmapUrl }), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=60, s-maxage=300'
			}
		});
	} catch (error) {
		console.error('osu! API error:', error);
		return new Response(JSON.stringify({ url: null }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}