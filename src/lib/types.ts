export type SpotifyTimeRange = 'short_term' | 'medium_term' | 'long_term';

export type TopTracksResponse = Array<{
	name: string;
	artists: Array<{ name: string }>;
	album: {
		images: Array<{ url: string }>;
	};
	external_urls: {
		spotify: string;
	};
}>;