import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { FaImage, FaTimes } from 'react-icons/fa';

const CreatePost = ({ onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
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
      toast.success("Post created successfully!");
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
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="card mb-6">
      <div className="flex gap-4">
        <img 
          src={user?.profileImage || "https://via.placeholder.com/40"} 
          alt="Profile" 
          className="w-12 h-12 rounded-full object-cover"
          onError={(e) => { e.target.src = "https://via.placeholder.com/40"; }}
        />
        <form onSubmit={handleSubmit} className="flex-1">
          <input
            type="text"
            placeholder="Post Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-white border-b border-slate-700 p-2 mb-2 focus:outline-none focus:border-accent"
          />
          <textarea
            placeholder="What's happening?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-transparent text-white text-lg resize-none focus:outline-none min-h-[100px]"
          />
          
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={URL.createObjectURL(img)} 
                    alt={`Preview ${index}`} 
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button 
                    type="button" 
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center mt-2 border-t border-slate-800 pt-3">
            <label className="cursor-pointer text-accent hover:text-accent-hover p-2 rounded-full hover:bg-accent/10 transition-colors">
              <FaImage size={20} />
              <input 
                type="file" 
                accept="image/*" 
                multiple
                onChange={handleFileChange} 
                className="hidden" 
              />
            </label>
            <button 
              type="submit" 
              disabled={loading || (!content.trim() && images.length === 0)}
              className="btn btn-primary rounded-full px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
