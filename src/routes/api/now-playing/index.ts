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
    // this is the ts-sdk wrapper for /me/player
    const playback = await api.player.getPlaybackState(); // <— FIX HERE [web:41][web:35]

    if (playback && playback.item && playback.currently_playing_type === 'track') {
      return new Response(
        JSON.stringify({
          ...base,
          isPlayingNow: true,
          isPaused: !playback.is_playing,
          progressMs: playback.progress_ms ?? 0,
          track: playback.item as SpotifyApi.TrackObjectFull
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // fallback to your existing recent-tracks call
    const recentlyPlayed = await api.player.getRecentlyPlayedTracks(1); // [web:33]
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
