// src/routes/api/now-playing/+server.ts
import type { RequestHandler } from './$types';
import { getSpotifyAccessToken } from '$lib/server/spotify';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';

interface NowPlayingResponse {
  isPlayingNow: boolean;
  isPaused: boolean;
  progressMs: number;
  track: SpotifyApi.TrackObjectFull | null;
}

export const GET: RequestHandler = async ({ fetch, platform }) => {
  const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
  if (!SPOTIFY_CLIENT_ID) {
    return new Response('Missing Spotify client ID', { status: 500 });
  }

  const accessToken = await getSpotifyAccessToken({ fetch, platform });
  const api = SpotifyApi.withAccessToken(SPOTIFY_CLIENT_ID, accessToken);

  const base: NowPlayingResponse = {
    isPlayingNow: false,
    isPaused: false,
    progressMs: 0,
    track: null
  };

  try {
    const playing = await api.player.getCurrentlyPlaying();

    if (playing && playing.item && playing.currently_playing_type === 'track') {
      return new Response(
        JSON.stringify({
          ...base,
          isPlayingNow: true,
          isPaused: !playing.is_playing,
          progressMs: playing.progress_ms ?? 0,
          track: playing.item as SpotifyApi.TrackObjectFull
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // fallback: reuse your recent-tracks logic
    const recentlyPlayed = await api.player.getRecentlyPlayedTracks(1);
    const item = recentlyPlayed.items[0];
    if (item?.track) {
      return new Response(
        JSON.stringify({
          ...base,
          track: item.track as SpotifyApi.TrackObjectFull
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(base), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to fetch now playing:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch now playing' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
