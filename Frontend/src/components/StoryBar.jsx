import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaTimes, FaEye, FaChevronLeft, FaChevronRight, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';

import CreateStoryModal from './CreateStoryModal';

const StoryBar = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewersList, setShowViewersList] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const { data } = await api.get('/stories');
      setStories(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryCreated = () => {
    fetchStories();
  };

  const openStory = (group) => {
    setSelectedStoryGroup(group);
    setCurrentStoryIndex(0);
    // Mark first as viewed
    markAsViewed(group.stories[0]._id);
  };

  const markAsViewed = async (storyId) => {
    try {
      await api.put(`/stories/${storyId}/view`);
    } catch (e) { console.error(e) }
  };

  const nextStory = () => {
    if (!selectedStoryGroup) return;
    if (currentStoryIndex < selectedStoryGroup.stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      markAsViewed(selectedStoryGroup.stories[nextIndex]._id);
    } else {
      // Move to next user
      const currentGroupIndex = stories.findIndex(g => g.user._id === selectedStoryGroup.user._id);
      if (currentGroupIndex !== -1 && currentGroupIndex < stories.length - 1) {
         const nextGroup = stories[currentGroupIndex + 1];
         // Reset state for new group
         if (audioRef.current) audioRef.current.pause();
         setSelectedStoryGroup(nextGroup);
         setCurrentStoryIndex(0);
         markAsViewed(nextGroup.stories[0]._id);
      } else {
         closeStory();
      }
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const closeStory = () => {
    if (audioRef.current) audioRef.current.pause();
    setSelectedStoryGroup(null);
    setCurrentStoryIndex(0);
    setShowViewersList(false);
  };

  const deleteCurrentStory = async () => {
    if (!selectedStoryGroup) return;
    const storyId = selectedStoryGroup.stories[currentStoryIndex]._id;
    if (!window.confirm("Delete this story?")) return;

    try {
      await api.delete(`/stories/${storyId}`);
      toast.success("Deleted");
      closeStory();
      fetchStories();
    } catch (e) {
       toast.error("Failed to delete");
    }
  };

  // Auto-advance
  useEffect(() => {
    if (!selectedStoryGroup) return;
    const currentStory = selectedStoryGroup.stories[currentStoryIndex];
    if (currentStory.type === 'video') return; // Video handles its own end

    // Timer based on duration (default 5s or audioDuration if higher but max 30)
    // Actually our model says audioDuration default 0.
    // Let's use 5000ms base, or if audio present, use audioDuration * 1000
    // But safely.
    const duration = currentStory.audio && currentStory.audioDuration ? currentStory.audioDuration * 1000 : 5000;
    
    // Play Audio logic
    if (currentStory.audio && audioRef.current) {
        audioRef.current.src = currentStory.audio;
        audioRef.current.currentTime = currentStory.audioStart || 0;
        audioRef.current.play().catch(e => console.log("Audio play error", e));
    }

    const timer = setTimeout(nextStory, duration);
    return () => {
        clearTimeout(timer);
        if (audioRef.current) audioRef.current.pause();
    };
  }, [selectedStoryGroup, currentStoryIndex]);

  return (
    <div className="w-full bg-slate-800 p-4 rounded-lg mb-6 overflow-x-auto scrollbar-hide">
      <div className="flex gap-4">
        {/* Add Story Button */}
        <div className="flex flex-col items-center min-w-[70px]">
          <div 
            className="w-16 h-16 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center cursor-pointer hover:border-accent transition-colors relative"
            onClick={() => setShowCreateModal(true)}
          >
             <FaPlus className="text-slate-400" />
             <img src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.username}`} className="absolute inset-0 w-full h-full rounded-full opacity-30 object-cover -z-10" />
          </div>
          <span className="text-xs mt-2 text-slate-300">Add Story</span>
        </div>

        {/* Story Circles */}
        {stories.map((group, idx) => (
          <div 
            key={idx} 
            className="flex flex-col items-center min-w-[70px] cursor-pointer"
            onClick={() => openStory(group)}
          >
            <div className={`w-16 h-16 rounded-full p-[2px] ${group.user._id === user._id ? 'bg-slate-500' : 'bg-gradient-to-tr from-yellow-400 to-purple-600'}`}>
               <img 
                 src={group.user.profileImage || `https://ui-avatars.com/api/?name=${group.user.username}`} 
                 className="w-full h-full rounded-full border-2 border-slate-800 object-cover" 
                 alt={group.user.username}
               />
            </div>
            <span className="text-xs mt-2 text-slate-300 truncate w-16 text-center">
              {group.user._id === user._id ? 'Your Story' : group.user.username}
            </span>
          </div>
        ))}
      </div>

      {/* Story Viewer Overlay */}
      {selectedStoryGroup && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          {/* Controls */}
          <button onClick={closeStory} className="absolute top-4 right-4 text-white z-20"><FaTimes size={24} /></button>
          
          {/* Progress Bar */}
          <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
            {selectedStoryGroup.stories.map((_, idx) => (
              <div key={idx} className="h-1 flex-1 bg-white/30 rounded overflow-hidden">
                <div 
                  className={`h-full bg-white transition-all duration-[5000ms] linear ${idx === currentStoryIndex ? 'w-full' : idx < currentStoryIndex ? 'w-full' : 'w-0'}`} 
                  style={{ transitionDuration: selectedStoryGroup.stories[currentStoryIndex].type === 'video' ? '0ms' : '5000ms' }}
                />
              </div>
            ))}
          </div>

          {/* Navigation Click Zones */}
          <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={prevStory}></div>
          <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={nextStory}></div>

          {/* Delete (if mine) */}
          {selectedStoryGroup.user._id === user._id && (
             <button 
               onClick={deleteCurrentStory} 
               className="absolute bottom-4 right-4 text-white p-2 bg-red-500/50 rounded-full hover:bg-red-500 z-30"
             >
               <FaTrash />
             </button>
          )}

          {/* View Count (if mine) */}
          {selectedStoryGroup.user._id === user._id && (
            <div 
              className="absolute bottom-4 left-4 text-white flex items-center gap-2 z-50 cursor-pointer bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm hover:bg-black/60"
              onClick={(e) => { e.stopPropagation(); setShowViewersList(!showViewersList); }}
            >
               <FaEye /> {selectedStoryGroup.stories[currentStoryIndex].viewers.length} views
            </div>
          )}

          {/* Viewers List Overlay */}
          {showViewersList && selectedStoryGroup.user._id === user._id && (
             <div className="absolute bottom-16 left-4 w-64 bg-slate-800 rounded-lg shadow-xl z-50 animate-in slide-in-from-bottom-5 p-3" onClick={(e) => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                 <h4 className="text-white font-bold text-sm">Viewed by</h4>
                 <button onClick={() => setShowViewersList(false)} className="text-slate-400 hover:text-white"><FaTimes /></button>
               </div>
               <div className="max-h-40 overflow-y-auto">
                 {selectedStoryGroup.stories[currentStoryIndex].viewers.length === 0 ? (
                    <p className="text-xs text-slate-500">No views yet</p>
                 ) : (
                    selectedStoryGroup.stories[currentStoryIndex].viewers.map((v, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <img src={v.user?.profileImage || `https://ui-avatars.com/api/?name=${v.user?.username || 'U'}`} className="w-6 h-6 rounded-full" />
                        <span className="text-white text-xs">{v.user?.username || 'Unknown'}</span>
                        <span className="text-[10px] text-slate-500 ml-auto">{new Date(v.viewedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    ))
                 )}
               </div>
             </div>
          )}

          {/* Content */}
          <div className="w-full h-full md:max-w-md md:h-[90vh] relative bg-black flex items-center justify-center">
             {selectedStoryGroup.stories[currentStoryIndex].type === 'video' ? (
               <video 
                 src={selectedStoryGroup.stories[currentStoryIndex].media} 
                 autoPlay 
                 className="w-full h-full object-contain"
                 onEnded={nextStory}
               />
             ) : (
               <img 
                 src={selectedStoryGroup.stories[currentStoryIndex].media} 
                 className="w-full h-full object-contain" 
               />
             )}
             
             {/* Text Overlay */}
             {selectedStoryGroup.stories[currentStoryIndex].textContent && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 w-full">
                    <p className="bg-black/50 text-white px-4 py-2 text-xl font-bold rounded backdrop-blur-sm max-w-[80%] text-center break-words">
                        {selectedStoryGroup.stories[currentStoryIndex].textContent}
                    </p>
                </div>
             )}

             {/* Hidden Audio Player */}
             <audio ref={audioRef} className="hidden" />
             
             {/* Reply Input */}
             {selectedStoryGroup.user._id !== user._id && (
               <div className="absolute bottom-4 w-full px-4 z-40">
                 <form 
                   onSubmit={async (e) => {
                     e.preventDefault();
                     const text = e.target.reply.value;
                     if (!text) return;
                     try {
                       await api.post('/messages', {
                         receiverId: selectedStoryGroup.user._id,
                         content: `Replying to your story: ${text}`
                       });
                       toast.success("Reply sent");
                       e.target.reset();
                     } catch (err) { toast.error("Failed to send reply"); }
                   }}
                   className="flex gap-2"
                 >
                   <input 
                     name="reply"
                     placeholder="Reply to story..." 
                     className="flex-1 bg-transparent border border-white/50 rounded-full py-2 px-4 text-white placeholder:text-white/70 focus:outline-none focus:border-white backdrop-blur-sm"
                     onClick={(e) => e.stopPropagation()}
                   />
                   <button type="submit" className="text-white font-bold" onClick={(e) => e.stopPropagation()}>Send</button>
                 </form>
               </div>
             )}
          </div>
        </div>
      )}
      {showCreateModal && (
        <CreateStoryModal onClose={() => setShowCreateModal(false)} onSuccess={handleStoryCreated} />
      )}
    </div>
  );
};

export default StoryBar;
