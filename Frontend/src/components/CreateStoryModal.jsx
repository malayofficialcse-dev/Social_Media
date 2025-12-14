import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaMusic, FaFont, FaImage, FaPlay, FaPause } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';

const CreateStoryModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Select Media, 2: Edit
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState('image');

  // Edit State
  const [textContent, setTextContent] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  
  const [songFile, setSongFile] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [songDuration, setSongDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaType(file.type.startsWith('video') ? 'video' : 'image');
      setMediaPreview(URL.createObjectURL(file));
      setStep(2);
    }
  };

  const handleSongSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSongFile(file);
      // Reset cropping
      setStartTime(0);
    }
  };

  const handleAudioLoaded = (e) => {
    setSongDuration(e.target.duration);
  };

  const toggleAudioPreview = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.currentTime = startTime;
        audioRef.current.play();
        // Stop after 30s or end
        setTimeout(() => {
            if(audioRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
            }
        }, 30000);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleUpload = async () => {
    if (!mediaFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('media', mediaFile);
    formData.append('type', mediaType);
    
    if (textContent) formData.append('textContent', textContent);
    if (songFile) {
      formData.append('song', songFile);
      formData.append('audioStart', startTime);
      formData.append('audioDuration', 30); // Max cap
    }

    try {
      await api.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Story added!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800 z-10">
           <h3 className="text-white font-bold">New Story</h3>
           <button onClick={onClose} className="text-slate-400 hover:text-white"><FaTimes size={20} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-black/50 min-h-[300px] relative">
           
           {step === 1 && (
             <div className="text-center">
               <label className="cursor-pointer flex flex-col items-center gap-4 p-10 border-2 border-dashed border-slate-600 rounded-xl hover:border-accent group">
                 <FaImage size={40} className="text-slate-500 group-hover:text-accent transition-colors" />
                 <span className="text-slate-300">Select Image or Video</span>
                 <input type="file" hidden accept="image/*,video/*" onChange={handleMediaSelect} />
               </label>
             </div>
           )}

           {step === 2 && (
             <div className="w-full flexflex-col gap-4">
               {/* Preview Area */}
               <div className="relative w-full aspect-[9/16] bg-black rounded-lg overflow-hidden flex items-center justify-center mb-4">
                  {mediaType === 'video' ? (
                    <video src={mediaPreview} className="max-h-full max-w-full" controls={false} />
                  ) : (
                    <img src={mediaPreview} className="max-h-full max-w-full object-contain" />
                  )}

                  {/* Text Overlay Preview */}
                  {textContent && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <p className="bg-black/50 text-white px-4 py-2 text-xl font-bold rounded backdrop-blur-sm max-w-[80%] text-center break-words">
                         {textContent}
                       </p>
                    </div>
                  )}
               </div>

               {/* Controls */}
               <div className="flex flex-col gap-4 px-2">
                 
                 {/* Text Toggle */}
                 <button 
                   onClick={() => setShowTextInput(!showTextInput)}
                   className={`flex items-center gap-2 p-2 rounded ${showTextInput ? 'bg-accent text-white' : 'bg-slate-700 text-slate-300'}`}
                 >
                   <FaFont /> Add Text
                 </button>

                 {showTextInput && (
                   <input 
                     value={textContent}
                     onChange={(e) => setTextContent(e.target.value)}
                     placeholder="Enter caption..."
                     className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 focus:outline-none focus:border-accent"
                   />
                 )}

                 {/* Music Toggle */}
                 <div className="bg-slate-700 p-3 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                       <FaMusic className="text-accent" />
                       <span className="text-white text-sm">Add Song (Local)</span>
                       <input type="file" hidden accept="audio/*" onChange={handleSongSelect} />
                    </label>

                    {songFile && (
                      <div className="flex flex-col gap-2">
                         <div className="flex items-center justify-between text-xs text-slate-400">
                           <span>{songFile.name}</span>
                           <span>{Math.floor(startTime)}s - {Math.floor(startTime + 30)}s</span>
                         </div>
                         
                         {/* Hidden Audio for metadata */}
                         <audio 
                           ref={audioRef} 
                           src={URL.createObjectURL(songFile)} 
                           onLoadedMetadata={handleAudioLoaded}
                           onEnded={() => setIsPlaying(false)}
                           className="hidden"
                         />

                         {/* Range Slider for Cropping */}
                         <input 
                           type="range" 
                           min="0" 
                           max={songDuration > 30 ? songDuration - 30 : 0} 
                           value={startTime}
                           onChange={(e) => setStartTime(Number(e.target.value))}
                           className="w-full accent-accent h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                         />
                         <p className="text-[10px] text-slate-500 text-center">Slide to crop (30s window)</p>

                         <button 
                           onClick={toggleAudioPreview}
                           className="self-center flex items-center gap-2 text-xs bg-slate-600 px-3 py-1 rounded-full text-white hover:bg-slate-500"
                         >
                           {isPlaying ? <FaPause /> : <FaPlay />} Preview Audio
                         </button>
                      </div>
                    )}
                 </div>

               </div>
             </div>
           )}

        </div>

        {/* Footer */}
        {step === 2 && (
          <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-between">
             <button onClick={() => { setStep(1); setMediaFile(null); }} className="text-slate-400 hover:text-white">Back</button>
             <button 
               onClick={handleUpload} 
               disabled={uploading}
               className="bg-accent hover:bg-accent/80 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2"
             >
               {uploading ? 'Uploading...' : 'Share to Story'}
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateStoryModal;
