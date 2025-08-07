'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePlayer } from '@/contexts/PlayerContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState, EmptyState } from '@/components/ui/ErrorState';
import { SpotifyImport } from '@/components/spotify/SpotifyImport';
import { FileImport } from '@/components/playlists/FileImport';
import { Playlist, Song } from '@/types/music';
import { getImageUrl, formatTime } from '@/lib/utils';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function LibraryPage() {
  const { data: session } = useSession();
  const { playSong, setQueue } = usePlayer();
  
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showSpotifyImport, setShowSpotifyImport] = useState(false);
  const [showFileImport, setShowFileImport] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  
  // Create playlist form
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/playlists');
      const data = await response.json();

      if (data.success) {
        setPlaylists(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch playlists');
      }
    } catch (error) {
      console.error('Fetch playlists error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylistDetails = async (playlistId: string) => {
    try {
      setPlaylistLoading(true);

      const response = await fetch(`/api/playlists/${playlistId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedPlaylist(data.data);
        setShowPlaylistModal(true);
      } else {
        throw new Error(data.error || 'Failed to fetch playlist details');
      }
    } catch (error) {
      console.error('Fetch playlist details error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load playlist');
    } finally {
      setPlaylistLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }

    setCreateLoading(true);

    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlistName.trim(),
          description: playlistDescription.trim() || undefined,
          isPublic,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Playlist created successfully!');
        setShowCreateModal(false);
        setPlaylistName('');
        setPlaylistDescription('');
        setIsPublic(false);
        fetchPlaylists(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to create playlist');
      }
    } catch (error) {
      console.error('Create playlist error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create playlist');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) {
      return;
    }

    try {
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Playlist deleted successfully');
        setPlaylists(prev => prev.filter(p => p._id !== playlistId));
        if (selectedPlaylist?._id === playlistId) {
          setShowPlaylistModal(false);
          setSelectedPlaylist(null);
        }
      } else {
        throw new Error(data.error || 'Failed to delete playlist');
      }
    } catch (error) {
      console.error('Delete playlist error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete playlist');
    }
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.songs && playlist.songs.length > 0) {
      setQueue(playlist.songs, 0);
      playSong(playlist.songs[0]);
      toast.success(`Playing ${playlist.name}`);
    } else {
      toast.error('This playlist is empty');
    }
  };

  const handlePlaySong = (song: Song, songs: Song[]) => {
    const currentIndex = songs.findIndex(s => s.id === song.id);
    setQueue(songs, currentIndex);
    playSong(song);
    toast.success(`Playing ${song.name}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-page-title font-extrabold mb-2 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
            Your Library
          </h1>
          <p className="text-base text-text-secondary">
            Manage your playlists and saved music
          </p>
        </div>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading your library..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-page-title font-extrabold mb-2 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
            Your Library
          </h1>
          <p className="text-base text-text-secondary">
            Manage your playlists and saved music
          </p>
        </div>
        <ErrorState
          title="Failed to load library"
          message={error}
          onRetry={fetchPlaylists}
          className="py-12"
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-page-title font-extrabold mb-2 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
          Your Library
        </h1>
        <p className="text-base text-text-secondary mb-4">
          Manage your playlists and saved music
        </p>
        
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <span className="material-icons">add</span>
            Create Playlist
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => setShowSpotifyImport(true)}
            className="flex items-center gap-2"
          >
            <span className="material-icons">download</span>
            Import from Spotify
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => setShowFileImport(true)}
            className="flex items-center gap-2"
          >
            <span className="material-icons">upload_file</span>
            Import Files
          </Button>
        </div>
      </div>

      {/* Playlists */}
      {playlists.length === 0 ? (
        <EmptyState
          title="No playlists yet"
          message="Create your first playlist to start organizing your music."
          icon="playlist_add"
          className="py-20"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {playlists.map((playlist) => (
            <div
              key={playlist._id}
              className="group relative rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-20 transition-all duration-300 cursor-pointer hover:bg-white/10 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(9,153,255,0.3)]"
              onClick={() => fetchPlaylistDetails(playlist._id!)}
            >
              {/* Playlist Image */}
              <div className="relative mb-4 aspect-square overflow-hidden rounded-lg">
                {playlist.songs && playlist.songs.length > 0 ? (
                  <Image
                    src={getImageUrl(playlist.songs[0].image, '500x500')}
                    alt={playlist.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-white/10">
                    <span className="material-icons text-4xl text-white/50">playlist_play</span>
                  </div>
                )}
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    variant="play"
                    size="play-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPlaylist(playlist);
                    }}
                    className="bg-accent/90 text-white hover:bg-accent hover:scale-110"
                  >
                    <span className="material-icons">play_arrow</span>
                  </Button>
                </div>
              </div>

              {/* Playlist Info */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-1 truncate">
                  {playlist.name}
                </h3>
                <p className="text-xs text-text-secondary truncate">
                  {playlist.songs?.length || 0} songs
                  {playlist.isPublic && ' • Public'}
                </p>
                {playlist.description && (
                  <p className="text-xs text-text-muted mt-1 line-clamp-2">
                    {playlist.description}
                  </p>
                )}
              </div>

              {/* Delete Button */}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePlaylist(playlist._id!);
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-400/20"
              >
                <span className="material-icons text-sm">delete</span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <ModalHeader>
          <ModalTitle>Create New Playlist</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Playlist Name *
              </label>
              <Input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="Enter playlist name"
                maxLength={100}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description (Optional)
              </label>
              <textarea
                value={playlistDescription}
                onChange={(e) => setPlaylistDescription(e.target.value)}
                placeholder="Describe your playlist..."
                maxLength={500}
                rows={3}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-text-secondary backdrop-blur-10 transition-all focus:border-accent focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-accent bg-white/10 border-white/20 rounded focus:ring-accent focus:ring-2"
              />
              <label htmlFor="isPublic" className="text-sm text-white">
                Make this playlist public
              </label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setShowCreateModal(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreatePlaylist}
            disabled={createLoading || !playlistName.trim()}
          >
            {createLoading ? 'Creating...' : 'Create Playlist'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Playlist Details Modal */}
      <Modal 
        isOpen={showPlaylistModal} 
        onClose={() => setShowPlaylistModal(false)}
        size="lg"
      >
        {selectedPlaylist && (
          <>
            <ModalHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                  {selectedPlaylist.songs && selectedPlaylist.songs.length > 0 ? (
                    <Image
                      src={getImageUrl(selectedPlaylist.songs[0].image, '150x150')}
                      alt={selectedPlaylist.name}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-icons text-white/50">playlist_play</span>
                    </div>
                  )}
                </div>
                <div>
                  <ModalTitle>{selectedPlaylist.name}</ModalTitle>
                  <p className="text-sm text-text-secondary">
                    {selectedPlaylist.songs?.length || 0} songs
                    {selectedPlaylist.isPublic && ' • Public'}
                  </p>
                  {selectedPlaylist.description && (
                    <p className="text-sm text-text-muted mt-1">
                      {selectedPlaylist.description}
                    </p>
                  )}
                </div>
              </div>
            </ModalHeader>
            <ModalBody>
              {playlistLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner text="Loading playlist..." />
                </div>
              ) : selectedPlaylist.songs && selectedPlaylist.songs.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedPlaylist.songs.map((song, index) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer group"
                      onClick={() => handlePlaySong(song, selectedPlaylist.songs!)}
                    >
                      <div className="w-8 text-center text-sm text-text-secondary group-hover:hidden">
                        {index + 1}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="w-8 h-8 hidden group-hover:flex"
                      >
                        <span className="material-icons text-sm">play_arrow</span>
                      </Button>
                      
                      <Image
                        src={getImageUrl(song.image, '50x50')}
                        alt={song.name}
                        width={40}
                        height={40}
                        className="rounded"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {song.name}
                        </p>
                        <p className="text-xs text-text-secondary truncate">
                          {song.primaryArtists}
                        </p>
                      </div>
                      
                      <div className="text-xs text-text-secondary">
                        {formatTime(song.duration)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Empty playlist"
                  message="This playlist doesn't have any songs yet."
                  icon="playlist_add"
                  className="py-8"
                />
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                variant="secondary"
                onClick={() => setShowPlaylistModal(false)}
              >
                Close
              </Button>
              {selectedPlaylist.songs && selectedPlaylist.songs.length > 0 && (
                <Button
                  onClick={() => handlePlayPlaylist(selectedPlaylist)}
                  className="flex items-center gap-2"
                >
                  <span className="material-icons">play_arrow</span>
                  Play All
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* Spotify Import Modal */}
      <SpotifyImport
        isOpen={showSpotifyImport}
        onClose={() => setShowSpotifyImport(false)}
        onImportComplete={fetchPlaylists}
      />

      {/* File Import Modal */}
      <FileImport
        isOpen={showFileImport}
        onClose={() => setShowFileImport(false)}
        onImportComplete={fetchPlaylists}
      />
    </div>
  );
}