import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaTimes, FaEye, FaChevronLeft, FaChevronRight, FaTrash, FaHeart, FaRegHeart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import VerifiedBadge from './VerifiedBadge';
import PostWidget from './PostWidget';

import CreateStoryModal from './CreateStoryModal';

const StoryBar = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewersList, setShowViewersList] = useState(false);
  const audioRef = useRef(null);

  const fetchStories = useCallback(async () => {
    try {
      const { data } = await api.get('/stories');
      setStories(data);
    } catch {
      // Error handled silently
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchStories();
    };
    init();
  }, [fetchStories]);

  const handleStoryCreated = () => {
    fetchStories();
  };

  const markAsViewed = async (storyId) => {
    try {
      await api.put(`/stories/${storyId}/view`);
    } catch { /* Ignore */ }
  };

  const closeStory = useCallback(() => {
    setSelectedStoryGroup(null);
    setCurrentStoryIndex(0);
    setShowViewersList(false);
  }, []);

  const nextStory = useCallback(() => {
    if (!selectedStoryGroup) return;
    if (currentStoryIndex < selectedStoryGroup.stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      markAsViewed(selectedStoryGroup.stories[nextIndex]._id);
    } else {
      const currentGroupIndex = stories.findIndex(g => g.user._id === selectedStoryGroup.user._id);
      if (currentGroupIndex !== -1 && currentGroupIndex < stories.length - 1) {
         const nextGroup = stories[currentGroupIndex + 1];
         setSelectedStoryGroup(nextGroup);
         setCurrentStoryIndex(0);
         markAsViewed(nextGroup.stories[0]._id);
      } else {
         closeStory();
      }
    }
  }, [selectedStoryGroup, currentStoryIndex, stories, closeStory]);

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const handleLikeStory = async (storyId) => {
    const currentStory = selectedStoryGroup.stories[currentStoryIndex];
    const isLiked = currentStory.likes?.some(l => (l._id || l) === user._id);
    
    try {
      if (isLiked) {
        await api.put(`/stories/${storyId}/unlike`);
        const updatedStories = [...selectedStoryGroup.stories];
        updatedStories[currentStoryIndex].likes = updatedStories[currentStoryIndex].likes.filter(l => (l._id || l) !== user._id);
        setSelectedStoryGroup({ ...selectedStoryGroup, stories: updatedStories });
      } else {
        await api.put(`/stories/${storyId}/like`);
        const updatedStories = [...selectedStoryGroup.stories];
        if (!updatedStories[currentStoryIndex].likes) updatedStories[currentStoryIndex].likes = [];
        updatedStories[currentStoryIndex].likes.push({ _id: user._id, username: user.username, profileImage: user.profileImage });
        setSelectedStoryGroup({ ...selectedStoryGroup, stories: updatedStories });
        toast.success("Reaction sent");
      }
    } catch {
      toast.error("Failed to react");
    }
  };

  const openStory = (group) => {
    setSelectedStoryGroup(group);
    setCurrentStoryIndex(0);
    markAsViewed(group.stories[0]._id);
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
    } catch {
       toast.error("Failed to delete");
    }
  };

  // Auto-advance
  useEffect(() => {
    if (!selectedStoryGroup) return;
    const currentStory = selectedStoryGroup.stories[currentStoryIndex];
    if (currentStory.type === 'video') return;

    const duration = currentStory.audio && currentStory.audioDuration ? currentStory.audioDuration * 1000 : 5000;
    const audioEl = audioRef.current;
    
    if (currentStory.audio && audioEl) {
        audioEl.src = currentStory.audio;
        audioEl.currentTime = currentStory.audioStart || 0;
        audioEl.play().catch(() => {});
    }

    const timer = setTimeout(nextStory, duration);
    return () => {
        clearTimeout(timer);
        if (audioEl) audioEl.pause();
    };
  }, [selectedStoryGroup, currentStoryIndex, nextStory]);

  return (
    <div className="w-full bg-surface border border-border-main p-4 rounded-3xl mb-6 overflow-x-auto scrollbar-hide shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Add Story Button */}
        <div className="flex flex-col items-center min-w-[70px]">
          <div 
            className="w-16 h-16 rounded-full border-2 border-dashed border-border-main flex items-center justify-center cursor-pointer hover:border-accent group transition-all hover:scale-105 active:scale-95 relative"
            onClick={() => setShowCreateModal(true)}
          >
             <FaPlus className="text-text-muted group-hover:text-accent transition-colors" />
             <img src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.username}`} className="absolute inset-0 w-full h-full rounded-full opacity-10 object-cover -z-10" alt="Me" />
          </div>
          <span className="text-[10px] uppercase tracking-wider font-black mt-2 text-text-muted">Add Story</span>
        </div>

        {/* Story Circles */}
        {stories.map((group, idx) => (
          <div 
            key={idx} 
            className="flex flex-col items-center min-w-[70px] cursor-pointer group"
            onClick={() => openStory(group)}
          >
            <div className={`w-16 h-16 rounded-full p-[2px] shadow-lg transition-transform group-hover:scale-105 group-active:scale-95 ${
              group.user.isPro 
              ? 'pro-frame-neon' 
              : group.user._id === user._id ? 'bg-border-main' : 'bg-gradient-to-tr from-yellow-400 via-orange-500 to-purple-600'
            }`}>
               <img 
                 src={group.user.profileImage || `https://ui-avatars.com/api/?name=${group.user.username}`} 
                 className="w-full h-full rounded-full border-2 border-surface object-cover" 
                 alt={group.user.username}
               />
            </div>
            <span className="text-[10px] uppercase font-black mt-2 text-text-muted truncate w-16 text-center group-hover:text-text-main transition-colors flex items-center justify-center gap-0.5">
              {group.user._id === user._id ? 'Mine' : group.user.username}
              {group.user.isVerified && <VerifiedBadge size={8} />}
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
                        <img src={v.user?.profileImage || `https://ui-avatars.com/api/?name=${v.user?.username || 'U'}`} className="w-6 h-6 rounded-full" alt="avatar" />
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
                 alt="story"
               />
             )}
             
             {/* Text Overlay */}
             {selectedStoryGroup.stories[currentStoryIndex].textContent && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10 w-full px-10">
                    <p className="bg-black/30 backdrop-blur-md text-white px-6 py-4 text-2xl font-black rounded-2xl border border-white/10 shadow-2xl text-center break-words max-w-full transform -rotate-1">
                        {selectedStoryGroup.stories[currentStoryIndex].textContent}
                    </p>
                </div>
             )}

              {/* Story Widget Overlay */}
              {selectedStoryGroup.stories[currentStoryIndex].widget && (
                <div className="absolute inset-x-0 bottom-24 flex items-center justify-center p-6 z-30 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="w-full max-w-[320px] scale-90">
                        <PostWidget 
                            widget={selectedStoryGroup.stories[currentStoryIndex].widget}
                            postId={selectedStoryGroup.stories[currentStoryIndex]._id}
                            context="story"
                            onUpdate={(updatedStory) => {
                                const newStories = [...selectedStoryGroup.stories];
                                newStories[currentStoryIndex] = updatedStory;
                                setSelectedStoryGroup({ ...selectedStoryGroup, stories: newStories });
                            }}
                        />
                    </div>
                </div>
              )}

             {/* Likes List (if mine) */}
             {selectedStoryGroup.user._id === user._id && selectedStoryGroup.stories[currentStoryIndex].likes?.length > 0 && (
                <div className="absolute bottom-16 right-4 flex -space-x-2 z-50">
                  {selectedStoryGroup.stories[currentStoryIndex].likes.slice(0, 3).map((l, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                       <FaHeart className="text-red-500 text-[10px]" />
                    </div>
                  ))}
                  {selectedStoryGroup.stories[currentStoryIndex].likes.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold">
                      +{selectedStoryGroup.stories[currentStoryIndex].likes.length - 3}
                    </div>
                  )}
                </div>
             )}

             {/* Hidden Audio Player */}
             <audio ref={audioRef} className="hidden" />
             
             {/* Interaction Bar */}
             <div className="absolute bottom-4 w-full px-4 z-40 flex items-center gap-3">
               {selectedStoryGroup.user._id !== user._id ? (
                 <>
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
                       } catch { toast.error("Failed to send reply"); }
                     }}
                     className="flex-1 flex gap-2"
                   >
                     <input 
                       name="reply"
                       placeholder="Reply to story..." 
                       className="flex-1 bg-white/10 border border-white/20 rounded-full py-2.5 px-5 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 backdrop-blur-md transition-all text-sm"
                       onClick={(e) => e.stopPropagation()}
                     />
                   </form>
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleLikeStory(selectedStoryGroup.stories[currentStoryIndex]._id); }}
                     className={`p-3 rounded-full backdrop-blur-md transition-all transform active:scale-125 ${
                       selectedStoryGroup.stories[currentStoryIndex].likes?.some(l => (l._id || l) === user._id)
                       ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                       : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                     }`}
                   >
                     {selectedStoryGroup.stories[currentStoryIndex].likes?.some(l => (l._id || l) === user._id) ? <FaHeart size={20} className="animate-in zoom-in" /> : <FaRegHeart size={20} />}
                   </button>
                 </>
               ) : (
                 <div className="w-full flex justify-center">
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Viewing your story</p>
                 </div>
               )}
             </div>
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
