import React, { useRef, useState } from 'react';
import { FaPlay, FaPause, FaDownload } from 'react-icons/fa';

const AudioPlayer = ({ src }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const changeSpeed = () => {
    const newRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `voice-message-${Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-slate-700/50 rounded-full px-3 py-1.5 min-w-[200px]">
      <button 
        onClick={togglePlay}
        className="w-8 h-8 flex items-center justify-center bg-accent text-white rounded-full hover:bg-accent-hover transition-colors"
      >
        {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} />}
      </button>
      
      <audio 
        ref={audioRef} 
        src={src} 
        onEnded={handleEnded} 
        className="hidden"
      />

      <div className="flex-1 h-8 flex items-center justify-center">
         <span className="text-xs text-slate-300">Voice Message</span>
      </div>

      <button 
        onClick={changeSpeed}
        className="text-xs font-bold text-slate-300 hover:text-white px-2 py-1 bg-slate-600 rounded hover:bg-slate-500 transition-colors"
      >
        {playbackRate}x
      </button>

      <button 
        onClick={handleDownload}
        className="text-slate-400 hover:text-white p-1 transition-colors"
        title="Download"
      >
        <FaDownload size={14} />
      </button>
    </div>
  );
};

export default AudioPlayer;
