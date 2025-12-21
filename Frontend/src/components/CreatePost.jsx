import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { FaImage, FaTimes, FaCrop } from 'react-icons/fa';
import ImageCropper from './ImageCropper';

const CreatePost = ({ onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();

  // Cropper state
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

    try {
      const { data } = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onPostCreated(data);
      setTitle('');
      setContent('');
      setImages([]);
      setIsExpanded(false);
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

              <div className="flex justify-between items-center mt-2 border-t border-border-main pt-4">
                <div className="flex gap-2">
                  <label className="cursor-pointer text-text-muted hover:text-accent p-2 rounded-full hover:bg-accent/10 transition-all flex items-center gap-2 text-sm font-medium">
                    <FaImage size={20} />
                    <span className="hidden sm:inline">Photo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
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
