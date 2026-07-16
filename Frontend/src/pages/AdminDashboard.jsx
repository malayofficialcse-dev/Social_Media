import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FaTrash, FaUser, FaFileAlt, FaComment, FaImage, FaChartBar, FaTable } from 'react-icons/fa';
import ImageLightbox from '../components/ImageLightbox';
import AdminAnalytics from '../components/AdminAnalytics';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalComments: 0 });
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'analytics'

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, postsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/posts')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setPosts(postsRes.data);
    } catch (error) {
      console.error("Error fetching admin data", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user? This will delete all their posts and comments.")) {
      try {
        await api.delete(`/admin/users/${userId}`);
        setUsers(users.filter(u => u._id !== userId));
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        toast.success("User deleted successfully");
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete user");
      }
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await api.delete(`/posts/${postId}`);
        setPosts(posts.filter(p => p._id !== postId));
        setStats(prev => ({ ...prev, totalPosts: prev.totalPosts - 1 }));
        toast.success("Post deleted successfully");
      } catch {
        toast.error("Failed to delete post");
      }
    }
  };

  const handleEditPost = async (post) => {
    const newContent = window.prompt("Edit Post Content:", post.content);
    if (newContent !== null && newContent !== post.content) {
      try {
        const { data } = await api.put(`/posts/${post._id}`, { content: newContent });
        setPosts(posts.map(p => p._id === post._id ? { ...p, content: data.content } : p));
        toast.success("Post updated successfully");
      } catch {
        toast.error("Failed to update post");
      }
    }
  };

  const openLightbox = (images, index = 0) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (loading) return <div className="text-center text-text-muted mt-10 animate-pulse uppercase tracking-widest font-black">Loading Admin Panel...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-black text-text-main tracking-tight">Admin Dashboard</h1>
          <p className="text-text-muted mt-1">Platform management and insights</p>
        </div>
        
        <div className="flex bg-surface border border-border-main rounded-2xl p-1.5 shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === 'overview' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-muted hover:text-text-main'
            }`}
          >
            <FaTable /> Overview
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === 'analytics' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-muted hover:text-text-main'
            }`}
          >
            <FaChartBar /> Analytics
          </button>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <AdminAnalytics />
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-surface border border-border-main p-8 rounded-3xl flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-blue-500/10 p-5 rounded-2xl text-blue-500">
                <FaUser size={28} />
              </div>
              <div>
                <p className="text-text-muted text-xs font-black uppercase tracking-widest">Total Users</p>
                <p className="text-3xl font-black text-text-main">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-surface border border-border-main p-8 rounded-3xl flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-green-500/10 p-5 rounded-2xl text-green-500">
                <FaFileAlt size={28} />
              </div>
              <div>
                <p className="text-text-muted text-xs font-black uppercase tracking-widest">Total Posts</p>
                <p className="text-3xl font-black text-text-main">{stats.totalPosts.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-surface border border-border-main p-8 rounded-3xl flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-purple-500/10 p-5 rounded-2xl text-purple-500">
                <FaComment size={28} />
              </div>
              <div>
                <p className="text-text-muted text-xs font-black uppercase tracking-widest">Total Comments</p>
                <p className="text-3xl font-black text-text-main">{stats.totalComments.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Users Management */}
          <div className="bg-surface border border-border-main rounded-3xl overflow-hidden mb-12 shadow-sm">
            <div className="p-8 border-b border-border-main flex justify-between items-center">
              <h2 className="text-xl font-black text-text-main">Manage Users</h2>
              <span className="text-[10px] font-black uppercase tracking-widest bg-accent/10 text-accent px-3 py-1 rounded-full">Active Users</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-bg-main/50 text-[10px] font-black uppercase tracking-widest text-text-muted">
                  <tr>
                    <th className="px-8 py-4">User</th>
                    <th className="px-8 py-4">Email</th>
                    <th className="px-8 py-4">Role</th>
                    <th className="px-8 py-4">Joined</th>
                    <th className="px-8 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-bg-main/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <img 
                            src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}`} 
                            alt={user.username} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-border-main shadow-sm"
                          />
                          <span className="font-bold text-text-main">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-text-muted text-sm">{user.email}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-600' : 'bg-border-main text-text-muted'}`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-text-muted text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-8 py-5">
                        {user.role !== 'admin' && (
                          <button 
                            onClick={() => handleDeleteUser(user._id)}
                            className="w-10 h-10 rounded-xl bg-red-500/5 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                            title="Delete User"
                          >
                            <FaTrash size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Posts Management */}
          <div className="bg-surface border border-border-main rounded-3xl overflow-hidden shadow-sm">
            <div className="p-8 border-b border-border-main">
              <h2 className="text-xl font-black text-text-main">Manage Posts</h2>
              <p className="text-text-muted text-xs mt-1">Full administrative control over content</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-bg-main/50 text-[10px] font-black uppercase tracking-widest text-text-muted">
                  <tr>
                    <th className="px-8 py-4">Author</th>
                    <th className="px-8 py-4">Email</th>
                    <th className="px-8 py-4 w-1/3">Content</th>
                    <th className="px-8 py-4">Media</th>
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main">
                  {posts.map((post) => (
                    <tr key={post._id} className="hover:bg-bg-main/30 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img 
                            src={post.author_id?.profileImage || `https://ui-avatars.com/api/?name=${post.author_id?.username}`} 
                            alt={post.author_id?.username} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-border-main shadow-sm"
                          />
                          <span className="font-bold text-text-main">{post.author_id?.username || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-text-muted text-sm">{post.author_id?.email || "No Email"}</td>
                      <td className="px-8 py-6">
                        <div className="max-h-24 overflow-y-auto pr-4 scrollbar-thin">
                          {post.title && <p className="font-black text-text-main mb-1 text-sm">{post.title}</p>}
                          <p className="text-text-muted text-sm leading-relaxed">{post.content}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {post.images && post.images.length > 0 ? (
                          <div className="flex -space-x-3 hover:space-x-1 transition-all">
                            {post.images.slice(0, 3).map((img, idx) => (
                              <img 
                                key={idx} 
                                src={img} 
                                alt="Post" 
                                className="w-10 h-10 object-cover rounded-xl border-2 border-surface shadow-md cursor-pointer hover:z-10 transition-transform hover:scale-110" 
                                onClick={() => openLightbox(post.images, idx)}
                              />
                            ))}
                            {post.images.length > 3 && (
                                <div 
                                    className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-md cursor-pointer hover:scale-110 transition-transform"
                                    onClick={() => openLightbox(post.images, 3)}
                                >
                                    +{post.images.length - 3}
                                </div>
                            )}
                          </div>
                        ) : post.image ? (
                          <img 
                            src={post.image} 
                            alt="Post" 
                            className="w-10 h-10 object-cover rounded-xl border-2 border-surface shadow-md cursor-pointer transition-transform hover:scale-110" 
                            onClick={() => openLightbox([post.image])}
                          />
                        ) : (
                          <span className="text-text-muted/40 text-[10px] font-black uppercase italic">No media</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-text-muted text-sm">{new Date(post.createdAt).toLocaleDateString()}</td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleEditPost(post)}
                                className="w-10 h-10 rounded-xl bg-accent/5 text-accent flex items-center justify-center hover:bg-accent hover:text-white transition-all"
                                title="Edit Post"
                            >
                                <FaFileAlt size={14} />
                            </button>
                            <button 
                                onClick={() => handleDeletePost(post._id)}
                                className="w-10 h-10 rounded-xl bg-red-500/5 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                title="Delete Post"
                            >
                                <FaTrash size={14} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {lightboxOpen && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
