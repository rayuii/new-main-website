export async function GET() {
	try {
		const WEATHER_API_KEY = (process.env.OPENWEATHER_API_KEY || '').trim();
		
		if (!WEATHER_API_KEY) {
			return new Response(JSON.stringify({ error: 'Weather API key not configured' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const url = new URL('https://api.openweathermap.org/data/2.5/weather');
		url.searchParams.set('q', 'Vancouver');
		url.searchParams.set('appid', WEATHER_API_KEY);
		url.searchParams.set('units', 'metric');

		const response = await fetch(url.toString());

		if (!response.ok) {
			const errorBody = await response.text();
			return new Response(
				JSON.stringify({
					error: 'OpenWeather error',
					status: response.status,
					body: errorBody
				}),
				{
					status: 502,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		const data = await response.json();

		const weather = {
			temp: Math.round(data.main.temp),
			feels_like: Math.round(data.main.feels_like),
			description: data.weather[0].description,
			icon: data.weather[0].icon,
			humidity: data.main.humidity,
			wind_speed: Math.round(data.wind.speed * 3.6) // Convert m/s to km/h
		};

		return new Response(JSON.stringify(weather), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=600, s-maxage=900' // Cache for 10-15 minutes
			}
		});
	} catch (error) {
		console.error('Weather API Error:', error);
		return new Response(JSON.stringify({ error: 'Failed to fetch weather data' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
