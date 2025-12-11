import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FaTrash, FaUser, FaFileAlt, FaComment, FaImage } from 'react-icons/fa';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalComments: 0 });
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
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
      } catch (error) {
        toast.error("Failed to update post");
      }
    }
  };

  if (loading) return <div className="text-center text-white mt-10">Loading Admin Panel...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-800 p-6 rounded-lg flex items-center gap-4">
          <div className="bg-blue-500/20 p-4 rounded-full text-blue-500">
            <FaUser size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Total Users</p>
            <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
          </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg flex items-center gap-4">
          <div className="bg-green-500/20 p-4 rounded-full text-green-500">
            <FaFileAlt size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Total Posts</p>
            <p className="text-2xl font-bold text-white">{stats.totalPosts}</p>
          </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg flex items-center gap-4">
          <div className="bg-purple-500/20 p-4 rounded-full text-purple-500">
            <FaComment size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Total Comments</p>
            <p className="text-2xl font-bold text-white">{stats.totalComments}</p>
          </div>
        </div>
      </div>

      {/* Users Management */}
      <div className="bg-slate-800 rounded-lg overflow-hidden mb-10">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Manage Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900/50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img 
                      src={user.profileImage || "https://via.placeholder.com/40"} 
                      alt={user.username} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="font-medium text-white">{user.username}</span>
                  </td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-600/20 text-slate-400'}`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {user.role !== 'admin' && (
                      <button 
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete User"
                      >
                        <FaTrash />
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
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Manage Posts</h2>
          <p className="text-slate-400 text-sm mt-1">Admin can do everything with posts</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900/50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-3">Author</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3 w-1/3">Content</th>
                <th className="px-6 py-3">Images</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {posts.map((post) => (
                <tr key={post._id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img 
                      src={post.author_id?.profileImage || "https://via.placeholder.com/40"} 
                      alt={post.author_id?.username} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="font-medium text-white">{post.author_id?.username || "Unknown"}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">{post.author_id?.email || "No Email"}</td>
                  <td className="px-6 py-4">
                    <div className="max-h-20 overflow-y-auto text-sm">
                      {post.title && <p className="font-bold mb-1">{post.title}</p>}
                      <p className="text-slate-400">{post.content}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {post.images && post.images.length > 0 ? (
                      <div className="flex gap-1">
                        {post.images.slice(0, 3).map((img, idx) => (
                          <img key={idx} src={img} alt="Post" className="w-10 h-10 object-cover rounded" />
                        ))}
                        {post.images.length > 3 && (
                          <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center text-xs">
                            +{post.images.length - 3}
                          </div>
                        )}
                      </div>
                    ) : post.image ? (
                      <img src={post.image} alt="Post" className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <span className="text-slate-600 text-xs">No images</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">{new Date(post.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button 
                      onClick={() => handleEditPost(post)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Edit Post"
                    >
                      <FaFileAlt />
                    </button>
                    <button 
                      onClick={() => handleDeletePost(post._id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Post"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
