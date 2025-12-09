import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FaCalendarAlt, FaLink, FaEdit, FaTimes, FaCheck } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { toast } from 'react-toastify';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser, updateProfile, fetchUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState(null);

  // Cropping State
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [croppingTarget, setCroppingTarget] = useState(null); // 'profile' or 'background'

  const isOwnProfile = currentUser?._id === id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get(`/users/${id}`);
        setProfileUser(data);
        setEditForm({
          username: data.username,
          bio: data.bio || '',
        });
        
        const { data: postsData } = await api.get(`/posts/user/${id}`);
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleFollow = async () => {
    try {
      if (profileUser.followers.some(f => f._id === currentUser._id)) {
        await api.put(`/users/${id}/unfollow`);
        setProfileUser(prev => ({
          ...prev,
          followers: prev.followers.filter(f => f._id !== currentUser._id)
        }));
      } else {
        await api.put(`/users/${id}/follow`);
        setProfileUser(prev => ({
          ...prev,
          followers: [...prev.followers, { _id: currentUser._id }]
        }));
      }
      fetchUser();
    } catch (error) {
      toast.error("Error updating follow status");
    }
  };

  const handleUpdateProfile = async () => {
    const formData = new FormData();
    formData.append('username', editForm.username);
    formData.append('bio', editForm.bio);
    if (profileImageFile) formData.append('profileImage', profileImageFile);
    if (backgroundImageFile) formData.append('backgroundImage', backgroundImageFile);

    try {
      const { data } = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data.success) {
        setProfileUser(prev => ({ ...prev, ...data.user }));
        setIsEditing(false);
        setProfileImageFile(null);
        setBackgroundImageFile(null);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error("Error updating profile");
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  // Crop Handlers
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e, target) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setCroppingTarget(target);
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
      
      const file = new File([croppedImageBlob], `${croppingTarget}.jpg`, { type: 'image/jpeg' });

      if (croppingTarget === 'profile') {
        setProfileImageFile(file);
      } else {
        setBackgroundImageFile(file);
      }
      
      // Reset crop state
      setImageSrc(null);
      setCroppingTarget(null);
    } catch (e) {
      console.error(e);
      toast.error("Error cropping image");
    }
  };

  if (loading) return <div className="flex justify-center pt-10 text-accent">Loading...</div>;
  if (!profileUser) return <div className="text-center pt-10">User not found</div>;

  const isFollowing = profileUser.followers.some(f => f._id === currentUser?._id);

  return (
    <div>
      {/* Image Cropper Modal */}
      {imageSrc && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-2xl h-[60vh] bg-dark rounded-lg overflow-hidden mb-4">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={croppingTarget === 'profile' ? 1 : 3 / 1}
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
                aria-labelledby="Zoom"
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
                aria-labelledby="Rotation"
                onChange={(e) => setRotation(e.target.value)}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex justify-between gap-4 mt-2">
              <button 
                onClick={() => { setImageSrc(null); setCroppingTarget(null); }}
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

      <div className="relative mb-16">
        <div className="h-48 bg-slate-700 w-full rounded-xl overflow-hidden relative group">
          {/* Background Image Preview */}
          {(backgroundImageFile || profileUser.backgroundImage) && (
            <img 
              src={backgroundImageFile ? URL.createObjectURL(backgroundImageFile) : profileUser.backgroundImage} 
              alt="Background" 
              className="w-full h-full object-cover" 
            />
          )}
          {/* Edit Background Button */}
          {isEditing && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <label className="cursor-pointer btn btn-outline bg-black/50 border-white text-white hover:bg-white hover:text-black">
                 <FaEdit className="mr-2" /> Change Cover
                 <input 
                   type="file" 
                   accept="image/*"
                   onChange={(e) => handleFileChange(e, 'background')}
                   className="hidden"
                 />
               </label>
            </div>
          )}
        </div>
        
        <div className="absolute -bottom-12 left-6 relative group inline-block">
          <div className="w-32 h-32 rounded-full border-4 border-dark overflow-hidden bg-surface relative">
            <img 
              src={profileImageFile ? URL.createObjectURL(profileImageFile) : (profileUser.profileImage || "https://via.placeholder.com/120")} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
            {/* Edit Profile Image Button */}
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <label className="cursor-pointer text-white p-2 rounded-full hover:bg-white/20">
                  <FaEdit size={24} />
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'profile')}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          {isOwnProfile ? (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-outline rounded-full"
            >
              {isEditing ? 'Cancel Editing' : 'Edit Profile'}
            </button>
          ) : (
            <button 
              onClick={handleFollow}
              className={`btn rounded-full ${isFollowing ? 'btn-outline text-red-500 border-red-500 hover:bg-red-500/10' : 'btn-primary'}`}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {isEditing && isOwnProfile ? (
        <div className="card mb-6 animate-fade-in">
          <h3 className="text-xl font-bold mb-4">Edit Profile Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
              <input 
                type="text" 
                value={editForm.username}
                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Bio</label>
              <textarea 
                value={editForm.bio}
                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                className="input-field"
                rows="3"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsEditing(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleUpdateProfile} className="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{profileUser.username}</h1>
          <p className="text-slate-500 text-sm mb-4">{profileUser.email}</p>
          {profileUser.bio && <p className="text-slate-300 mb-4">{profileUser.bio}</p>}
          
          <div className="flex gap-6 text-slate-400 text-sm">
            <div className="flex gap-1">
              <span className="font-bold text-white">{profileUser.following.length}</span>
              <span>Following</span>
            </div>
            <div className="flex gap-1">
              <span className="font-bold text-white">{profileUser.followers.length}</span>
              <span>Followers</span>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-slate-800 mb-6">
        <div className="flex gap-8">
          <button className="px-4 py-3 border-b-2 border-accent text-accent font-medium">
            Posts
          </button>
          <button className="px-4 py-3 text-slate-500 hover:text-white transition-colors">
            Likes
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map(post => (
          <PostCard 
            key={post._id} 
            post={post} 
            onDelete={handlePostDeleted}
            onUpdate={handlePostUpdated}
          />
        ))}
        {posts.length === 0 && (
          <p className="text-center text-slate-500 mt-10">No posts yet.</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
