'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner, LoadingGrid } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Artist } from '@/types/music';
import { debounce } from '@/lib/utils';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function FavoriteArtistsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Popular artists to show initially
  const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);

  const debouncedSearch = debounce(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&type=artists&limit=20`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data || []);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Artist search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, 300);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Load popular artists on mount
  useEffect(() => {
    const loadPopularArtists = async () => {
      try {
        const response = await fetch('/api/music/top-artists?limit=20');
        const data = await response.json();
        
        if (data.success) {
          setPopularArtists(data.data || []);
        }
      } catch (error) {
        console.error('Failed to load popular artists:', error);
      } finally {
        setLoadingPopular(false);
      }
    };

    loadPopularArtists();
  }, []);

  const handleArtistToggle = (artist: Artist) => {
    setSelectedArtists(prev => {
      const isSelected = prev.some(a => a.id === artist.id);
      
      if (isSelected) {
        return prev.filter(a => a.id !== artist.id);
      } else if (prev.length < 5) {
        return [...prev, artist];
      } else {
        toast.error('You can only select up to 5 artists');
        return prev;
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedArtists.length !== 5) {
      toast.error('Please select exactly 5 artists');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users/favorite-artists', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistIds: selectedArtists.map(a => a.id),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update session to reflect onboarding completion
        await update({
          ...session,
          user: {
            ...session?.user,
            hasCompletedOnboarding: true,
            favoriteArtists: selectedArtists.map(a => a.id),
          },
        });

        toast.success('Favorite artists saved successfully!');
        router.push('/');
      } else {
        throw new Error(data.error || 'Failed to save favorite artists');
      }
    } catch (error) {
      console.error('Save favorite artists error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save favorite artists');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayArtists = searchQuery.trim() ? searchResults : popularArtists;
  const showLoading = searchQuery.trim() ? isSearching : loadingPopular;

  return (
    <div className="min-h-screen bg-background">
      {/* Aurora Background */}
      <div className="aurora-container" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4 flex items-center justify-center gap-3">
              <span className="material-icons text-4xl text-accent">favorite</span>
              <span className="text-3xl font-bold bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
                Choose Your Favorites
              </span>
            </div>
            <p className="text-text-secondary mb-2">
              Select exactly 5 artists to personalize your music experience
            </p>
            <p className="text-sm text-text-muted">
              Selected: {selectedArtists.length}/5
            </p>
          </div>

          {/* Content Card */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-20">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-md mx-auto">
                <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
                  search
                </span>
                <Input
                  type="text"
                  placeholder="Search for artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Selected Artists */}
            {selectedArtists.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Selected Artists</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedArtists.map((artist) => (
                    <div
                      key={artist.id}
                      className="flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-3 py-2"
                    >
                      <Image
                        src={artist.image[0]?.url || '/default-artist.png'}
                        alt={artist.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <span className="text-sm font-medium text-white">{artist.name}</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleArtistToggle(artist)}
                        className="text-white hover:text-red-400"
                      >
                        <span className="material-icons text-sm">close</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Artists Grid */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {searchQuery.trim() ? 'Search Results' : 'Popular Artists'}
              </h3>
              
              {showLoading ? (
                <LoadingGrid count={12} />
              ) : searchError ? (
                <ErrorState
                  title="Search Error"
                  message={searchError}
                  onRetry={() => debouncedSearch(searchQuery)}
                />
              ) : displayArtists.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  {searchQuery.trim() ? 'No artists found' : 'No popular artists available'}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {displayArtists.map((artist) => {
                    const isSelected = selectedArtists.some(a => a.id === artist.id);
                    const canSelect = selectedArtists.length < 5 || isSelected;
                    
                    return (
                      <div
                        key={artist.id}
                        className={`relative rounded-xl border p-4 cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? 'border-accent bg-accent/20 shadow-[0_0_20px_rgba(9,153,255,0.3)]'
                            : canSelect
                            ? 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                            : 'border-white/5 bg-white/2 opacity-50 cursor-not-allowed'
                        }`}
                        onClick={() => canSelect && handleArtistToggle(artist)}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                            <span className="material-icons text-white text-sm">check</span>
                          </div>
                        )}
                        
                        <div className="text-center">
                          <div className="relative w-16 h-16 mx-auto mb-3">
                            <Image
                              src={artist.image[0]?.url || '/default-artist.png'}
                              alt={artist.name}
                              fill
                              className="object-cover rounded-full"
                            />
                          </div>
                          <h4 className="text-sm font-medium text-white truncate">
                            {artist.name}
                          </h4>
                          {artist.followerCount && (
                            <p className="text-xs text-text-secondary mt-1">
                              {Math.floor(artist.followerCount / 1000)}K followers
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <Button
                onClick={handleSubmit}
                disabled={selectedArtists.length !== 5 || isSubmitting}
                className="px-8 py-3"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Saving...
                  </div>
                ) : (
                  'Continue to AniXDex'
                )}
              </Button>
              
              {selectedArtists.length !== 5 && (
                <p className="text-sm text-text-muted mt-2">
                  Please select {5 - selectedArtists.length} more artist{5 - selectedArtists.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}