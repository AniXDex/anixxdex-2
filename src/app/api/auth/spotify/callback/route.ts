import { NextRequest, NextResponse } from 'next/server';
import { SpotifyAPI } from '@/lib/spotify';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/library?spotify_error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/library?spotify_error=missing_parameters', request.url)
      );
    }

    // Extract user ID from state
    const [, userId] = state.split(':');
    if (!userId) {
      return NextResponse.redirect(
        new URL('/library?spotify_error=invalid_state', request.url)
      );
    }

    const spotifyApi = new SpotifyAPI();
    
    // Exchange code for tokens
    const tokens = await spotifyApi.exchangeCodeForToken(code);
    
    // Store tokens in user record
    await connectDB();
    await User.findByIdAndUpdate(userId, {
      spotifyTokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + (tokens.expires_in * 1000),
      },
    });

    return NextResponse.redirect(
      new URL('/library?spotify_connected=true', request.url)
    );
  } catch (error) {
    console.error('Spotify callback error:', error);
    return NextResponse.redirect(
      new URL('/library?spotify_error=callback_failed', request.url)
    );
  }
}