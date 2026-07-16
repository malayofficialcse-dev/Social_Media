import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { FaImage, FaTimes, FaCrop, FaPoll, FaHourglassEnd, FaQuestion, FaPlus } from 'react-icons/fa';
import ImageCropper from './ImageCropper';

const CreatePost = ({ onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();

  // Cropper state
  // Widget state
  const [activeWidget, setActiveWidget] = useState(null); // 'poll', 'countdown', 'qa'
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollQuestion, setPollQuestion] = useState('');
  const [countdownDate, setCountdownDate] = useState('');
  const [countdownLabel, setCountdownLabel] = useState('');
  const [qaQuestion, setQaQuestion] = useState('');

  const [editingImageIndex, setEditingImageIndex] = useState(null);
  const [imageToCrop, setImageToCrop] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title || 'Untitled Post');
    formData.append('content', content);
    images.forEach((image) => {
      formData.append('images', image);
    });

    if (activeWidget) {
      let widgetData = { type: activeWidget };
      if (activeWidget === 'poll') {
        widgetData.poll = { 
          question: pollQuestion || "Quick Poll", 
          options: pollOptions.filter(o => o.trim()).map(o => ({ text: o, votes: [] })) 
        };
      } else if (activeWidget === 'countdown') {
        widgetData.countdown = { 
          targetDate: countdownDate || new Date(Date.now() + 86400000), 
          label: countdownLabel || "Exciting Event" 
        };
      } else if (activeWidget === 'qa') {
        widgetData.qa = { question: qaQuestion || "Ask me anything!" };
      }
      formData.append('widget', JSON.stringify(widgetData));
    }

    try {
      const { data } = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onPostCreated(data);
      setTitle('');
      setContent('');
      setImages([]);
      setIsExpanded(false);
      setActiveWidget(null);
      setPollOptions(['', '']);
      setPollQuestion('');
      setCountdownDate('');
      setCountdownLabel('');
      setQaQuestion('');
      toast.success("Post shared!");
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.errors?.join(', ') || "Error creating post";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files);
      setImages((prev) => [...prev, ...newImages]);
      setIsExpanded(true);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const startEditing = (index) => {
    const image = images[index];
    setEditingImageIndex(index);
    setImageToCrop(URL.createObjectURL(image));
  };

  const handleCropComplete = (croppedBlob) => {
    const originalFile = images[editingImageIndex];
    const croppedFile = new File([croppedBlob], originalFile.name, {
      type: originalFile.type,
      lastModified: Date.now(),
    });

    const newImages = [...images];
    newImages[editingImageIndex] = croppedFile;
    setImages(newImages);
    setEditingImageIndex(null);
    setImageToCrop(null);
  };

  return (
    <div className={`card mb-6 transition-all duration-500 overflow-hidden ${isExpanded ? 'ring-1 ring-accent/30' : ''}`}>
      <div className="flex gap-4">
        <img 
          src={user?.profileImage || "https://via.placeholder.com/40"} 
          alt="Profile" 
          className="w-11 h-11 rounded-full object-cover border-2 border-border-main shadow-inner shrink-0"
          onError={(e) => { e.target.src = "https://via.placeholder.com/40"; }}
        />
        <div className="flex-1">
          {!isExpanded ? (
            <div 
              onClick={() => setIsExpanded(true)}
              className="bg-bg-main hover:bg-bg-main/80 text-text-muted px-5 py-2.5 rounded-full cursor-pointer transition-all border border-border-main flex items-center"
            >
              What's on your mind, {user?.username?.split(' ')[0]}?
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-top-2 duration-300">
              <input
                type="text"
                placeholder="Post Title (Optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-text-main border-b border-border-main p-2 mb-3 focus:outline-none focus:border-accent transition-colors"
                autoFocus
              />
              <textarea
                placeholder="Share your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-transparent text-text-main text-lg resize-none focus:outline-none min-h-[120px]"
              />
              
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4 pb-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden border border-border-main">
                      <img 
                        src={URL.createObjectURL(img)} 
                        alt={`Preview ${index}`} 
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          type="button" 
                          onClick={() => startEditing(index)}
                          className="bg-surface/80 backdrop-blur-md text-text-main rounded-full p-2 hover:bg-accent transition-colors"
                          title="Edit Image"
                        >
                          <FaCrop size={14} />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => removeImage(index)}
                          className="bg-surface/80 backdrop-blur-md text-text-main rounded-full p-2 hover:bg-red-500 transition-colors"
                          title="Remove Image"
                        >
                          <FaTimes size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Widget Configuration UI */}
              {activeWidget && (
                <div className="mt-4 p-4 rounded-2xl bg-bg-main/50 border border-accent/20 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                       {activeWidget === 'poll' && <><FaPoll /> Configure Poll</>}
                       {activeWidget === 'countdown' && <><FaHourglassEnd /> Setup Timer</>}
                       {activeWidget === 'qa' && <><FaQuestion /> Create Q&A Box</>}
                    </span>
                    <button type="button" onClick={() => setActiveWidget(null)} className="text-text-muted hover:text-red-500 transition-colors">
                      <FaTimes size={12} />
                    </button>
                  </div>

                  {activeWidget === 'poll' && (
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="What's the question?"
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        className="w-full bg-surface/50 border border-border-main p-3 rounded-xl text-sm font-bold text-text-main focus:outline-none focus:border-accent"
                      />
                      {pollOptions.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder={`Option ${i + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...pollOptions];
                              newOpts[i] = e.target.value;
                              setPollOptions(newOpts);
                            }}
                            className="flex-1 bg-surface/30 border border-border-main p-2 rounded-xl text-xs font-medium text-text-main focus:outline-none"
                          />
                          {pollOptions.length > 2 && (
                            <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="text-text-muted hover:text-red-500 p-2">
                              <FaTimes size={10} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button 
                        type="button" 
                        onClick={() => setPollOptions([...pollOptions, ''])}
                        className="w-full py-2 border border-dashed border-border-main rounded-xl text-[10px] font-black uppercase text-text-muted hover:text-accent hover:border-accent transition-all flex items-center justify-center gap-2"
                      >
                        <FaPlus size={10} /> Add Option
                      </button>
                    </div>
                  )}

                  {activeWidget === 'countdown' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input 
                        type="datetime-local" 
                        value={countdownDate}
                        onChange={(e) => setCountdownDate(e.target.value)}
                        className="w-full bg-surface/50 border border-border-main p-3 rounded-xl text-xs font-bold text-text-main focus:outline-none"
                      />
                      <input 
                        type="text" 
                        placeholder="Label (e.g., Live Launch)"
                        value={countdownLabel}
                        onChange={(e) => setCountdownLabel(e.target.value)}
                        className="w-full bg-surface/50 border border-border-main p-3 rounded-xl text-xs font-bold text-text-main focus:outline-none"
                      />
                    </div>
                  )}

                  {activeWidget === 'qa' && (
                    <input 
                      type="text" 
                      placeholder="What do you want people to ask or answer?"
                      value={qaQuestion}
                      onChange={(e) => setQaQuestion(e.target.value)}
                      className="w-full bg-surface/50 border border-border-main p-3 rounded-xl text-sm font-bold text-text-main focus:outline-none focus:border-accent"
                    />
                  )}
                </div>
              )}

              <div className="flex justify-between items-center mt-2 border-t border-border-main pt-4">
                <div className="flex gap-2">
                  <label className="cursor-pointer text-text-muted hover:text-accent p-2 rounded-full hover:bg-accent/10 transition-all flex items-center gap-2 text-sm font-medium" title="Add Images">
                    <FaImage size={20} />
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                  
                  {!activeWidget && (
                    <div className="flex gap-1 border-l border-border-main ml-1 pl-1">
                      <button type="button" onClick={() => setActiveWidget('poll')} className="p-2 text-text-muted hover:text-accent hover:bg-accent/10 rounded-full transition-all" title="Add Poll">
                        <FaPoll size={18} />
                      </button>
                      <button type="button" onClick={() => setActiveWidget('countdown')} className="p-2 text-text-muted hover:text-amber-500 hover:bg-amber-500/10 rounded-full transition-all" title="Add Timer">
                        <FaHourglassEnd size={18} />
                      </button>
                      <button type="button" onClick={() => setActiveWidget('qa')} className="p-2 text-text-muted hover:text-purple-500 hover:bg-purple-500/10 rounded-full transition-all" title="Add Q&A">
                        <FaQuestion size={18} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsExpanded(false);
                      setImages([]);
                      setContent('');
                      setTitle('');
                    }}
                    className="text-text-muted hover:text-text-main px-4 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading || (!content.trim() && images.length === 0)}
                    className="btn btn-primary px-8 shadow-accent/20"
                  >
                    {loading ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setImageToCrop(null);
            setEditingImageIndex(null);
          }}
        />
      )}
    </div>
  );
};

export default CreatePost;
