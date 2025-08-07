'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface UserStats {
  totalPlaylists: number;
  totalSongs: number;
  listeningTime: number;
  favoriteArtists: number;
}

interface UserPreferences {
  volume: number;
  autoplay: boolean;
  highQuality: boolean;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  
  const [stats, setStats] = useState<UserStats | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    volume: 50,
    autoplay: true,
    highQuality: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, preferencesResponse] = await Promise.all([
        fetch('/api/users/stats'),
        fetch('/api/users/preferences'),
      ]);

      const [statsData, preferencesData] = await Promise.all([
        statsResponse.json(),
        preferencesResponse.json(),
      ]);

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (preferencesData.success) {
        setPreferences(preferencesData.data);
      }
    } catch (error) {
      console.error('Fetch user data error:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleSavePreferences = async () => {
    setSaving(true);

    try {
      const response = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Preferences saved successfully!');
      } else {
        throw new Error(data.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Save preferences error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const formatListeningTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-page-title font-extrabold mb-2 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
            Profile
          </h1>
          <p className="text-base text-text-secondary">
            Manage your account and preferences
          </p>
        </div>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading profile..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-page-title font-extrabold mb-2 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
            Profile
          </h1>
          <p className="text-base text-text-secondary">
            Manage your account and preferences
          </p>
        </div>
        <ErrorState
          title="Failed to load profile"
          message={error}
          onRetry={fetchUserData}
          className="py-12"
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-page-title font-extrabold mb-2 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
          Profile
        </h1>
        <p className="text-base text-text-secondary">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    fill
                    className="object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full bg-accent rounded-full flex items-center justify-center">
                    <span className="material-icons text-3xl text-white">person</span>
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-1">
                {session?.user?.name}
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                {session?.user?.email}
              </p>
              
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement edit profile
                    toast.info('Edit profile coming soon');
                  }}
                  className="w-full"
                >
                  Edit Profile
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-full text-red-400 hover:text-red-300 hover:bg-red-400/20"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats and Preferences */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Music Stats</CardTitle>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-white/5">
                    <div className="text-2xl font-bold text-accent mb-1">
                      {stats.totalPlaylists}
                    </div>
                    <div className="text-sm text-text-secondary">Playlists</div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg bg-white/5">
                    <div className="text-2xl font-bold text-accent mb-1">
                      {stats.totalSongs}
                    </div>
                    <div className="text-sm text-text-secondary">Songs</div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg bg-white/5">
                    <div className="text-2xl font-bold text-accent mb-1">
                      {formatListeningTime(stats.listeningTime)}
                    </div>
                    <div className="text-sm text-text-secondary">Listening Time</div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg bg-white/5">
                    <div className="text-2xl font-bold text-accent mb-1">
                      {stats.favoriteArtists}
                    </div>
                    <div className="text-sm text-text-secondary">Fav Artists</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  No stats available yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Volume */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Default Volume: {preferences.volume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={preferences.volume}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      volume: parseInt(e.target.value, 10)
                    }))}
                    className="w-full h-2 bg-progress-bar rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Autoplay */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-white">
                      Autoplay
                    </label>
                    <p className="text-xs text-text-secondary">
                      Automatically play next song when current song ends
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.autoplay}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      autoplay: e.target.checked
                    }))}
                    className="w-4 h-4 text-accent bg-white/10 border-white/20 rounded focus:ring-accent focus:ring-2"
                  />
                </div>

                {/* High Quality */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-white">
                      High Quality Audio
                    </label>
                    <p className="text-xs text-text-secondary">
                      Stream music in the highest available quality
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.highQuality}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      highQuality: e.target.checked
                    }))}
                    className="w-4 h-4 text-accent bg-white/10 border-white/20 rounded focus:ring-accent focus:ring-2"
                  />
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-white/10">
                  <Button
                    onClick={handleSavePreferences}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Favorite Artists Card */}
          <Card>
            <CardHeader>
              <CardTitle>Favorite Artists</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-secondary">
                  You have {session?.user?.favoriteArtists?.length || 0} favorite artists selected
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // TODO: Navigate to favorites page
                    toast.info('Edit favorites coming soon');
                  }}
                >
                  Edit Favorites
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}