import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music, Upload, Play, Pause, Disc3, Plus, Trash2, X } from 'lucide-react';

interface AmbientAudioPlayerProps {
  className?: string;
  defaultOpen?: boolean;
}

export interface CustomTrack {
  id: string;
  name: string;
  subtitle: string;
  url: string;
}

const STORAGE_CUSTOM_TRACKS = 'asana_custom_soundscapes_v1';

export const AmbientAudioPlayer: React.FC<AmbientAudioPlayerProps> = ({
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  
  // Custom user tracks list (no hardcoded presets)
  const [tracks, setTracks] = useState<CustomTrack[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CUSTOM_TRACKS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [activeTrackId, setActiveTrackId] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CUSTOM_TRACKS);
      const parsed = raw ? JSON.parse(raw) : [];
      return parsed.length > 0 ? parsed[0].id : null;
    } catch {
      return null;
    }
  });

  const [urlInput, setUrlInput] = useState('');
  const [showUrlAdd, setShowUrlAdd] = useState(false);

  // Audio element ref
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Save tracks to localStorage
  const saveTracksToStorage = (updatedTracks: CustomTrack[]) => {
    setTracks(updatedTracks);
    try {
      localStorage.setItem(STORAGE_CUSTOM_TRACKS, JSON.stringify(updatedTracks));
    } catch (e) {
      console.warn('[AmbientAudio] Failed to persist tracks to storage:', e);
    }
  };

  // Sync volume with HTMLAudioElement
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Start or change track
  const playTrack = (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;

    setActiveTrackId(trackId);
    setIsPlaying(true);

    if (audioElementRef.current) {
      audioElementRef.current.src = track.url;
      audioElementRef.current.play().catch((err) => {
        console.warn('[AmbientAudio] Play error:', err);
      });
    }
  };

  // Stop playback
  const stopPlayback = () => {
    setIsPlaying(false);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  };

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    if (!activeTrackId) {
      if (tracks.length > 0) {
        playTrack(tracks[0].id);
      } else {
        fileInputRef.current?.click();
      }
      return;
    }

    if (isPlaying) {
      stopPlayback();
    } else {
      playTrack(activeTrackId);
    }
  };

  // Handle local user file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const newTrack: CustomTrack = {
      id: 'trk_' + Date.now(),
      name: file.name.replace(/\.[^/.]+$/, ''),
      subtitle: `Local Audio (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
      url: fileUrl,
    };

    const updated = [...tracks, newTrack];
    saveTracksToStorage(updated);
    setActiveTrackId(newTrack.id);
    setIsPlaying(true);

    if (audioElementRef.current) {
      audioElementRef.current.src = fileUrl;
      audioElementRef.current.play().catch(console.warn);
    }
  };

  // Handle adding custom URL stream
  const handleAddUrlTrack = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    const newTrack: CustomTrack = {
      id: 'url_' + Date.now(),
      name: `Stream ${tracks.length + 1}`,
      subtitle: 'External Audio Stream',
      url: trimmed,
    };

    const updated = [...tracks, newTrack];
    saveTracksToStorage(updated);
    setActiveTrackId(newTrack.id);
    setUrlInput('');
    setShowUrlAdd(false);
    playTrack(newTrack.id);
  };

  // Delete track
  const handleDeleteTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = tracks.filter((t) => t.id !== id);
    saveTracksToStorage(updated);
    if (activeTrackId === id) {
      stopPlayback();
      setActiveTrackId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const activeTrack = tracks.find((t) => t.id === activeTrackId);

  return (
    <div className={`relative ${className}`}>
      {/* Audio element for playback */}
      <audio
        ref={audioElementRef}
        loop
        onEnded={() => {
          if (audioElementRef.current) audioElementRef.current.play();
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Trigger Button in Header / Toolbar */}
      <button
        id="ambient-music-toggle-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs select-none ${
          isPlaying
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/80 ring-2 ring-emerald-500/30'
            : 'bg-stone-800/90 text-stone-300 border-stone-700 hover:bg-stone-700 hover:text-white'
        }`}
        title="Ambient Meditation Music Player"
      >
        <Music className={`w-3.5 h-3.5 ${isPlaying ? 'text-emerald-400 animate-spin' : 'text-stone-400'}`} style={{ animationDuration: '8s' }} />
        <span className="hidden sm:inline font-medium">
          {isPlaying ? 'Ambient Music: ON' : 'Ambient Music'}
        </span>
        {isPlaying && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        )}
      </button>

      {/* Floating Ambient Music Control Panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 sm:w-84 bg-stone-900/95 border border-emerald-500/40 rounded-2xl shadow-2xl p-4 z-50 backdrop-blur-xl text-stone-100 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <div className="flex items-center gap-2">
              <Disc3 className={`w-4 h-4 text-emerald-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Sanctuary Soundscapes
                </h4>
                <p className="text-[10px] text-stone-400">Meditative Background Audio</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Current Playing Track Banner */}
          <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                {isPlaying ? 'Now Playing' : activeTrack ? 'Selected Track' : 'Status'}
              </span>
              <p className="text-xs font-bold text-white truncate">
                {activeTrack ? activeTrack.name : 'No Soundscape Loaded'}
              </p>
              <p className="text-[10px] text-stone-400 truncate">
                {activeTrack ? activeTrack.subtitle : 'Upload or add an audio track below'}
              </p>
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={handleTogglePlay}
              disabled={tracks.length === 0}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer shadow-md shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                isPlaying
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-stone-800 hover:bg-stone-700 text-emerald-400'
              }`}
              title={isPlaying ? 'Pause Ambient Music' : 'Play Ambient Music'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-emerald-400 translate-x-0.5" />}
            </button>
          </div>

          {/* Volume Control */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="hover:text-emerald-400 transition cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                Volume
              </span>
              <span className="font-mono text-stone-300">{isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* User Soundscape Library */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                Soundscape Library ({tracks.length})
              </span>
              <button
                type="button"
                onClick={() => setShowUrlAdd(!showUrlAdd)}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add URL</span>
              </button>
            </div>

            {/* URL Input Form */}
            {showUrlAdd && (
              <div className="p-2 rounded-xl bg-stone-950 border border-stone-800 flex items-center gap-1.5">
                <input
                  type="url"
                  placeholder="https://example.com/audio.mp3"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-[11px] text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddUrlTrack}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer"
                >
                  Add
                </button>
              </div>
            )}

            {/* Tracks List */}
            {tracks.length > 0 ? (
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                {tracks.map((track) => {
                  const isSelected = activeTrackId === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track.id)}
                      className={`w-full text-left p-2 rounded-xl text-xs transition flex items-center justify-between cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                          : 'bg-stone-950/40 border-stone-800/80 text-stone-300 hover:bg-stone-800/60'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="font-semibold block text-[11px] truncate">{track.name}</span>
                        <span className="text-[9px] text-stone-400 truncate block">{track.subtitle}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSelected && isPlaying && (
                          <span className="text-[10px] text-emerald-400 font-mono animate-pulse">● Playing</span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTrack(track.id, e)}
                          className="p-1 rounded text-stone-500 hover:text-rose-400 transition"
                          title="Remove Track"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-stone-950/50 border border-stone-800/80 text-center space-y-1">
                <p className="text-[11px] text-stone-400">No ambient tracks added yet.</p>
                <p className="text-[10px] text-stone-500">Upload your own meditation audio or drone files.</p>
              </div>
            )}
          </div>

          {/* Upload Local Audio Button */}
          <div className="pt-1 border-t border-stone-800">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-950 to-teal-950 hover:from-emerald-900 hover:to-teal-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom Audio File</span>
            </button>
            <p className="text-[9px] text-stone-400 text-center mt-1">
              Supports MP3, WAV, AAC, M4A, and OGG from your device.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
