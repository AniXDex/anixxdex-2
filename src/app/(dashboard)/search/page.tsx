'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePlayer } from '@/contexts/PlayerContext';
import { MusicCard } from '@/components/music/MusicCard';
import { LoadingGrid } from '@/components/ui/LoadingSpinner';
import { ErrorState, EmptyState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { Song, Artist, Album } from '@/types/music';
import { debounce } from '@/lib/utils';
import toast from 'react-hot-toast';

type SearchTab = 'songs' | 'artists' | 'albums';

interface SearchResults {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { playSong, setQueue } = usePlayer();
  
  const [activeTab, setActiveTab] = useState<SearchTab>('songs');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResults>({
    songs: [],
    artists: [],
    albums: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchTabs: Array<{ key: SearchTab; label: string; icon: string }> = [
    { key: 'songs', label: 'Songs', icon: 'music_note' },
    { key: 'artists', label: 'Artists', icon: 'person' },
    { key: 'albums', label: 'Albums', icon: 'album' },
  ];

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ songs: [], artists: [], albums: [] });
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(searchQuery)}&type=${activeTab}&limit=24`
      );
      const data = await response.json();

      if (data.success) {
        setResults(prev => ({
          ...prev,
          [activeTab]: data.data || [],
        }));
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      performSearch(searchQuery);
    }, 300),
    [performSearch]
  );

  // Search when query or tab changes
  useEffect(() => {
    if (query.trim().length > 2) {
      debouncedSearch(query);
    } else {
      setResults({ songs: [], artists: [], albums: [] });
      setHasSearched(false);
    }
  }, [query, activeTab, debouncedSearch]);

  // Update query from URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [searchParams, query]);

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    if (query.trim().length > 2) {
      performSearch(query);
    }
  };

  const handlePlay = (item: Song | Artist | Album) => {
    if (activeTab === 'songs') {
      const song = item as Song;
      const songs = results.songs;
      const currentIndex = songs.findIndex(s => s.id === song.id);
      
      setQueue(songs, currentIndex);
      playSong(song);
      toast.success(`Playing ${song.name}`);
    } else if (activeTab === 'artists') {
      const artist = item as Artist;
      handlePlayArtist(artist);
    } else if (activeTab === 'albums') {
      const album = item as Album;
      handlePlayAlbum(album);
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

  const handlePlayAlbum = async (album: Album) => {
    try {
      // Search for songs from this album
      const response = await fetch(`/api/search?query=${encodeURIComponent(`${album.name} ${album.primaryArtists}`)}&type=songs&limit=20`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const songs = data.data as Song[];
        setQueue(songs, 0);
        playSong(songs[0]);
        toast.success(`Playing ${album.name}`);
      } else {
        toast.error('No songs found for this album');
      }
    } catch (error) {
      toast.error('Failed to play album songs');
    }
  };

  const handleAddToLibrary = (item: Song | Artist | Album) => {
    // TODO: Implement add to library functionality
    toast.success(`Added ${item.name} to library`);
  };

  const currentResults = results[activeTab];
  const showPlaceholder = !hasSearched && query.trim().length <= 2;
  const showEmpty = hasSearched && !loading && currentResults.length === 0 && !error;

  return (
    <div className="p-6">
      {/* Search Tabs */}
      <div className="flex gap-2 mb-6">
        {searchTabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'default' : 'secondary'}
            size="sm"
            onClick={() => handleTabChange(tab.key)}
            className={`flex items-center gap-2 ${
              activeTab === tab.key 
                ? 'bg-accent text-white' 
                : 'bg-white/10 text-text-secondary hover:text-white hover:bg-white/15'
            }`}
          >
            <span className="material-icons text-sm">{tab.icon}</span>
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Search Results */}
      <div className="min-h-[400px]">
        {showPlaceholder ? (
          <EmptyState
            title="Search for music"
            message="Find your favorite songs, artists, albums, and playlists using JioSaavn API."
            icon="search"
            className="py-20"
          />
        ) : loading ? (
          <LoadingGrid count={12} />
        ) : error ? (
          <ErrorState
            title="Search Error"
            message={error}
            onRetry={() => performSearch(query)}
            className="py-12"
          />
        ) : showEmpty ? (
          <EmptyState
            title="No results found"
            message={`No ${activeTab} found for "${query}". Try different keywords.`}
            icon="search_off"
            className="py-12"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {currentResults.map((item) => (
              <MusicCard
                key={item.id}
                item={item}
                type={activeTab === 'songs' ? 'song' : activeTab === 'artists' ? 'artist' : 'album'}
                onPlay={handlePlay}
                onAddToLibrary={handleAddToLibrary}
                className="w-full"
              />
            ))}
          </div>
        )}
      </div>

      {/* Load More Button */}
      {currentResults.length > 0 && currentResults.length >= 24 && (
        <div className="flex justify-center mt-8">
          <Button
            variant="secondary"
            onClick={() => {
              // TODO: Implement pagination
              toast.info('Load more functionality coming soon');
            }}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}