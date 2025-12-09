import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../services/api';

const Sidebar = () => {
  const { user } = useAuth();
  const [detailedUser, setDetailedUser] = useState(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  useEffect(() => {
    if (user?._id) {
      api.get(`/users/${user._id}`)
        .then(res => setDetailedUser(res.data))
        .catch(err => console.error("Failed to fetch user details", err));
    }
  }, [user]);

  if (!user) return null;

  const displayUser = detailedUser || user;
  const followers = displayUser.followers || [];
  const following = displayUser.following || [];

  return (
    <div className="hidden md:flex fixed left-0 top-[73px] h-[calc(100vh-73px)] w-64 p-4 flex-col gap-4 z-40">
      
      {/* Profile Card */}
      <div className="bg-surface rounded-lg border border-slate-800 overflow-visible relative">
        <div 
          className="h-20 bg-cover bg-center rounded-t-lg"
          style={{ backgroundImage: `url(${displayUser.backgroundImage || 'https://via.placeholder.com/300x100'})` }}
        ></div>
        <div className="px-4 pb-4 text-center">
          <div className="relative -mt-10 mb-3 inline-block">
            <img 
              src={displayUser.profileImage || "https://via.placeholder.com/64"} 
              alt="Profile" 
              className="w-20 h-20 rounded-full border-4 border-surface object-cover"
            />
          </div>
          <Link to={`/profile/${displayUser._id}`} className="block hover:underline decoration-white">
            <h2 className="text-lg font-bold text-white leading-tight">{displayUser.username}</h2>
          </Link>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{displayUser.bio || "No bio available"}</p>
        </div>

        {/* Followers/Following Stats */}
        <div className="flex border-t border-slate-800 relative">
          {/* Followers */}
          <div 
            className="flex-1 p-3 text-center hover:bg-slate-800 cursor-pointer transition-colors relative group"
            onMouseEnter={() => setShowFollowers(true)}
            onMouseLeave={() => setShowFollowers(false)}
          >
            <span className="font-bold block text-white">{followers.length}</span>
            <span className="text-xs text-slate-400">Followers</span>
            
            {/* Followers Popup */}
            {showFollowers && (
              <div className="absolute top-0 left-full ml-2 w-64 bg-surface border border-slate-800 rounded-lg shadow-xl z-50 p-0 overflow-hidden">
                <div className="p-2 border-b border-slate-800 bg-slate-900/50">
                  <h3 className="text-sm font-bold text-white">Followers</h3>
                </div>
                <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                  {followers.length > 0 ? followers.map(f => (
                    <Link to={`/profile/${f._id}`} key={f._id} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-md transition-colors text-left">
                      <img src={f.profileImage || "https://via.placeholder.com/32"} className="w-8 h-8 rounded-full object-cover" alt={f.username} />
                      <span className="text-sm text-slate-200 truncate">{f.username}</span>
                    </Link>
                  )) : (
                    <p className="text-xs text-slate-500 p-2 text-center">No followers yet</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Following */}
          <div 
            className="flex-1 p-3 text-center hover:bg-slate-800 cursor-pointer transition-colors relative group"
            onMouseEnter={() => setShowFollowing(true)}
            onMouseLeave={() => setShowFollowing(false)}
          >
            <span className="font-bold block text-white">{following.length}</span>
            <span className="text-xs text-slate-400">Following</span>

            {/* Following Popup */}
            {showFollowing && (
              <div className="absolute top-0 left-full ml-2 w-64 bg-surface border border-slate-800 rounded-lg shadow-xl z-50 p-0 overflow-hidden">
                <div className="p-2 border-b border-slate-800 bg-slate-900/50">
                  <h3 className="text-sm font-bold text-white">Following</h3>
                </div>
                <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                  {following.length > 0 ? following.map(f => (
                    <Link to={`/profile/${f._id}`} key={f._id} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-md transition-colors text-left">
                      <img src={f.profileImage || "https://via.placeholder.com/32"} className="w-8 h-8 rounded-full object-cover" alt={f.username} />
                      <span className="text-sm text-slate-200 truncate">{f.username}</span>
                    </Link>
                  )) : (
                    <p className="text-xs text-slate-500 p-2 text-center">Not following anyone</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
