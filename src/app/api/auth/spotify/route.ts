import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SpotifyAPI } from '@/lib/spotify';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate state parameter for security
    const state = randomBytes(16).toString('hex');
    
    // Store state in session or database for verification
    // For simplicity, we'll include user ID in state
    const stateWithUser = `${state}:${session.user.id}`;
    
    const spotifyApi = new SpotifyAPI();
    const authUrl = spotifyApi.getAuthUrl(stateWithUser);

    return NextResponse.json({
      success: true,
      authUrl,
    });
  } catch (error) {
    console.error('Spotify auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate Spotify auth URL' },
      { status: 500 }
    );
  }
}