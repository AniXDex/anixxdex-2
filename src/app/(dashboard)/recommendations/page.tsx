'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePlayer } from '@/contexts/PlayerContext';
import { MusicCard } from '@/components/music/MusicCard';
import { LoadingGrid } from '@/components/ui/LoadingSpinner';
import { ErrorState, EmptyState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { Song } from '@/types/music';
import toast from 'react-hot-toast';

export default function RecommendationsPage() {
  const { data: session } = useSession();
  const { playSong, setQueue } = usePlayer();
  
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch('/api/recommendations');
      const data = await response.json();

      if (data.success) {
        setRecommendations(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }
    } catch (error) {
      console.error('Fetch recommendations error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handlePlay = (song: Song) => {
    const currentIndex = recommendations.findIndex(s => s.id === song.id);
    setQueue(recommendations, currentIndex);
    playSong(song);
    toast.success(`Playing ${song.name}`);
  };

  const handleAddToLibrary = (song: Song) => {
    // TODO: Implement add to library functionality
    toast.success(`Added ${song.name} to library`);
  };

  const handleRefresh = () => {
    fetchRecommendations(true);
    toast.success('Refreshing recommendations...');
  };

  const handlePlayAll = () => {
    if (recommendations.length > 0) {
      setQueue(recommendations, 0);
      playSong(recommendations[0]);
      toast.success('Playing all recommendations');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-page-title font-extrabold mb-2 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
            Recommendations
          </h1>
          <p className="text-base text-text-secondary">
            Personalized music based on your favorite artists
          </p>
        </div>
        <LoadingGrid count={12} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-page-title font-extrabold mb-2 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
            Recommendations
          </h1>
          <p className="text-base text-text-secondary">
            Personalized music based on your favorite artists
          </p>
        </div>
        <ErrorState
          title="Failed to load recommendations"
          message={error}
          onRetry={() => fetchRecommendations()}
          className="py-12"
        />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-page-title font-extrabold mb-2 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
            Recommendations
          </h1>
          <p className="text-base text-text-secondary">
            Personalized music based on your favorite artists
          </p>
        </div>
        <EmptyState
          title="No recommendations available"
          message="We're working on finding the perfect songs for you. Check back later!"
          icon="recommend"
          className="py-20"
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-page-title font-extrabold mb-2 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
          Recommendations
        </h1>
        <p className="text-base text-text-secondary mb-4">
          Personalized music based on your favorite artists
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handlePlayAll}
            className="flex items-center gap-2"
          >
            <span className="material-icons">play_arrow</span>
            Play All
          </Button>
          
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <span className={`material-icons ${refreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Recommendations Info */}
      {session?.user?.favoriteArtists && session.user.favoriteArtists.length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-accent/10 border border-accent/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-icons text-accent">info</span>
            <span className="text-sm font-medium text-white">Personalized for you</span>
          </div>
          <p className="text-sm text-text-secondary">
            These recommendations are based on your {session.user.favoriteArtists.length} favorite artists and similar music preferences.
          </p>
        </div>
      )}

      {/* Recommendations Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-5">
        {recommendations.map((song) => (
          <MusicCard
            key={song.id}
            item={song}
            type="song"
            onPlay={handlePlay}
            onAddToLibrary={handleAddToLibrary}
            className="w-full"
          />
        ))}
      </div>

      {/* Load More */}
      <div className="flex justify-center mt-8">
        <Button
          variant="secondary"
          onClick={() => {
            // TODO: Implement load more functionality
            toast.info('Load more functionality coming soon');
          }}
        >
          Load More Recommendations
        </Button>
      </div>

      {/* Feedback Section */}
      <div className="mt-12 text-center">
        <p className="text-sm text-text-muted mb-4">
          How are these recommendations? Help us improve!
        </p>
        <div className="flex justify-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.success('Thanks for your feedback!')}
            className="flex items-center gap-2"
          >
            <span className="material-icons text-green-400">thumb_up</span>
            Great
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.success('Thanks for your feedback! We\'ll improve.')}
            className="flex items-center gap-2"
          >
            <span className="material-icons text-red-400">thumb_down</span>
            Not for me
          </Button>
        </div>
      </div>
    </div>
  );
}