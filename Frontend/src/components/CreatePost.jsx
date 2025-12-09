import { useState, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { FaImage } from 'react-icons/fa';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

const CreatePost = ({ onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Crop State
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (image) formData.append('image', image);

    try {
      const { data } = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onPostCreated(data);
      setTitle('');
      setContent('');
      setImage(null);
      toast.success("Post created successfully!");
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.errors?.join(', ') || "Error creating post";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setZoom(1);
      setRotation(0);
      setCrop({ x: 0, y: 0 });
    }
  };

  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const handleCropSave = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      
      const file = new File([croppedImageBlob], 'post-image.jpg', { type: 'image/jpeg' });
      setImage(file);
      setImageSrc(null); // Close cropper
    } catch (e) {
      console.error(e);
      toast.error("Error cropping image");
    }
  };

  return (
    <div className="card mb-6">
      {/* Image Cropper Modal */}
      {imageSrc && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-2xl h-[60vh] bg-dark rounded-lg overflow-hidden mb-4">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={4 / 3} // Default aspect ratio for posts, or allow free? Let's stick to 4:3 or free. User said "focus the area", usually implies free or specific. Let's use 4:3 or 16:9. Let's use 4:3 as a safe default.
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
            />
          </div>
          <div className="flex flex-col gap-4 w-full max-w-md">
            <div className="flex gap-4 items-center">
              <span className="text-white text-sm w-16">Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(e.target.value)}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex gap-4 items-center">
              <span className="text-white text-sm w-16">Rotate</span>
              <input
                type="range"
                value={rotation}
                min={0}
                max={360}
                step={1}
                onChange={(e) => setRotation(e.target.value)}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex justify-between gap-4 mt-2">
              <button 
                onClick={() => setImageSrc(null)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button 
                onClick={handleCropSave}
                className="btn btn-primary flex-1"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

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
          {image && (
            <div className="relative mt-2">
              <img src={URL.createObjectURL(image)} alt="Preview" className="max-h-60 rounded-lg" />
              <button 
                type="button" 
                onClick={() => setImage(null)}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
              >
                &times;
              </button>
            </div>
          )}
          <div className="flex justify-between items-center mt-2 border-t border-slate-800 pt-3">
            <label className="cursor-pointer text-accent hover:text-accent-hover p-2 rounded-full hover:bg-accent/10 transition-colors">
              <FaImage size={20} />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </label>
            <button 
              type="submit" 
              disabled={loading || (!content.trim() && !image)}
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
