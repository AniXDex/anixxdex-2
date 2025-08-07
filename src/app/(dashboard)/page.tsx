'use client';

import { useEffect, useState } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { MusicCard } from '@/components/music/MusicCard';
import { RecentlyPlayed } from '@/components/music/RecentlyPlayed';
import { LoadingGrid } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { cachedFetch, CACHE_KEYS } from '@/lib/cache';
import { Song, Artist } from '@/types/music';
import toast from 'react-hot-toast';

// Mock data for demo purposes
const getMockData = (key: string): (Song | Artist)[] => {
  const mockSongs: Song[] = [
    {
      id: 'mock-1',
      name: 'Demo Song 1',
      primaryArtists: 'Demo Artist 1',
      image: [{ quality: '500x500', url: '/placeholder-song.svg' }],
      duration: 180,
      year: 2024,
      album: 'Demo Album',
      playCount: 1000,
      hasLyrics: false,
      language: 'English',
      downloadUrl: []
    },
    {
      id: 'mock-2',
      name: 'Demo Song 2',
      primaryArtists: 'Demo Artist 2',
      image: [{ quality: '500x500', url: '/placeholder-song.svg' }],
      duration: 210,
      year: 2024,
      album: 'Demo Album 2',
      playCount: 2000,
      hasLyrics: true,
      language: 'English',
      downloadUrl: []
    },
    {
      id: 'mock-3',
      name: 'Demo Song 3',
      primaryArtists: 'Demo Artist 3',
      image: [{ quality: '500x500', url: '/placeholder-song.svg' }],
      duration: 195,
      year: 2024,
      album: 'Demo Album 3',
      playCount: 1500,
      hasLyrics: false,
      language: 'English',
      downloadUrl: []
    }
  ];

  const mockArtists: Artist[] = [
    {
      id: 'artist-1',
      name: 'Demo Artist 1',
      image: [{ quality: '500x500', url: '/placeholder-artist.svg' }],
      followerCount: 10000,
      isVerified: true
    },
    {
      id: 'artist-2',
      name: 'Demo Artist 2',
      image: [{ quality: '500x500', url: '/placeholder-artist.svg' }],
      followerCount: 15000,
      isVerified: true
    }
  ];

  if (key === 'topArtists') {
    return mockArtists;
  }
  return mockSongs;
};

interface HomeSection {
  title: string;
  data: (Song | Artist)[];
  type: 'song' | 'artist';
  loading: boolean;
  error: string | null;
}

export default function HomePage() {
  const { playSong, setQueue } = usePlayer();
  
  const [sections, setSections] = useState<Record<string, HomeSection>>({
    trending: {
      title: 'Trending Now',
      data: [],
      type: 'song',
      loading: true,
      error: null,
    },
    newReleases: {
      title: 'New Releases',
      data: [],
      type: 'song',
      loading: true,
      error: null,
    },
    featured: {
      title: 'Featured Songs',
      data: [],
      type: 'song',
      loading: true,
      error: null,
    },
    topArtists: {
      title: 'Top Artists',
      data: [],
      type: 'artist',
      loading: true,
      error: null,
    },
  });

  const updateSection = (key: string, updates: Partial<HomeSection>) => {
    setSections(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates }
    }));
  };

  const fetchSectionData = async (key: string, endpoint: string, cacheKey: string) => {
    try {
      updateSection(key, { loading: true, error: null });
      
      // For demo purposes, use mock data if API fails
      try {
        const data = await cachedFetch(endpoint, cacheKey, 15);
        
        if (data.success) {
          updateSection(key, { 
            data: data.data || [], 
            loading: false 
          });
        } else {
          throw new Error(data.error || 'Failed to fetch data');
        }
      } catch (apiError) {
        // Use mock data as fallback
        console.log(`API failed for ${key}, using mock data:`, apiError);
        const mockData = getMockData(key);
        updateSection(key, { 
          data: mockData, 
          loading: false 
        });
      }
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      updateSection(key, { 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load content'
      });
    }
  };

  useEffect(() => {
    console.log('HomePage: Starting to fetch data...');
    // Fetch all sections with caching
    fetchSectionData('trending', '/api/music/trending?limit=8', CACHE_KEYS.TRENDING_SONGS);
    fetchSectionData('newReleases', '/api/music/new-releases?limit=8', CACHE_KEYS.NEW_RELEASES);
    fetchSectionData('featured', '/api/music/featured?limit=8', CACHE_KEYS.FEATURED_SONGS);
    fetchSectionData('topArtists', '/api/music/top-artists?limit=8', CACHE_KEYS.TOP_ARTISTS);
  }, []);

  const handlePlay = (item: Song | Artist, sectionKey: string) => {
    if (sections[sectionKey].type === 'song') {
      const song = item as Song;
      const sectionSongs = sections[sectionKey].data as Song[];
      const currentIndex = sectionSongs.findIndex(s => s.id === song.id);
      
      // Set the queue to all songs in this section
      setQueue(sectionSongs, currentIndex);
      playSong(song);
      toast.success(`Playing ${song.name}`);
    } else if (sections[sectionKey].type === 'artist') {
      const artist = item as Artist;
      // For artists, we'll fetch their songs and play
      handlePlayArtist(artist);
    }
  };

  const handlePlayArtist = async (artist: Artist) => {
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(artist.name)}&type=songs&limit=20`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const songs = data.data as Song[];
        setQueue(songs, 0);
        playSong(songs[0]);
        toast.success(`Playing songs by ${artist.name}`);
      } else {
        toast.error('No songs found for this artist');
      }
    } catch (error) {
      toast.error('Failed to play artist songs');
    }
  };

  const handleAddToLibrary = (item: Song | Artist) => {
    // TODO: Implement add to library functionality
    toast.success(`Added ${item.name} to library`);
  };

  const retrySection = (key: string) => {
    const endpoints = {
      trending: { url: '/api/music/trending?limit=8', cacheKey: CACHE_KEYS.TRENDING_SONGS },
      newReleases: { url: '/api/music/new-releases?limit=8', cacheKey: CACHE_KEYS.NEW_RELEASES },
      featured: { url: '/api/music/featured?limit=8', cacheKey: CACHE_KEYS.FEATURED_SONGS },
      topArtists: { url: '/api/music/top-artists?limit=8', cacheKey: CACHE_KEYS.TOP_ARTISTS },
    };
    
    const endpoint = endpoints[key as keyof typeof endpoints];
    if (endpoint) {
      fetchSectionData(key, endpoint.url, endpoint.cacheKey);
    }
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-page-title font-extrabold mb-2 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
          AniXDex
        </h1>
        <p className="text-base text-text-secondary">
          Music <span className="text-accent font-semibold">Space</span>
        </p>
      </div>

      {/* Recently Played */}
      <div className="mb-10">
        <RecentlyPlayed limit={6} />
      </div>

      {/* Music Sections */}
      <div className="space-y-10">
        {Object.entries(sections).map(([key, section]) => (
          <div key={key} className="home-section">
            <h3 className="text-section-title font-bold mb-5 text-white">
              {section.title}
            </h3>
            
            {section.loading ? (
              <LoadingGrid count={8} />
            ) : section.error ? (
              <ErrorState
                title="Failed to load content"
                message={section.error}
                onRetry={() => retrySection(key)}
                className="py-8"
              />
            ) : section.data.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                No content available
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-5">
                {section.data.map((item) => (
                  <MusicCard
                    key={item.id}
                    item={item}
                    type={section.type}
                    onPlay={(item) => handlePlay(item, key)}
                    onAddToLibrary={handleAddToLibrary}
                    className="w-full"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quote Section */}
      <div className="mt-16 text-center">
        <p className="text-lg text-text-secondary italic transition-all duration-400">
          "Music speaks where words fail."
        </p>
        <p className="text-sm text-text-muted mt-2">
          Powered by JioSaavn API 🎵
        </p>
      </div>
    </div>
  );
}