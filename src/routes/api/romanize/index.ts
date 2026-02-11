import type { RequestHandler } from '@sveltejs/kit';

export const config = {
	runtime: 'nodejs20.x'
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { text } = await request.json();

		if (!text || typeof text !== 'string') {
			return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400 });
		}

		const response = await fetch('http://service.sundei.eu:3727/romanize', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text })
		});

		const data = await response.json();
		return new Response(JSON.stringify(data));
	} catch (error) {
		console.error('Romanize error:', error);
		return new Response(JSON.stringify({ error: 'Failed to romanize' }), { status: 500 });
	}
};