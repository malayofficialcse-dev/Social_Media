import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useState, useEffect } from 'react';
import api from '../services/api';
import VerifiedBadge from './VerifiedBadge';

const Sidebar = () => {
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const [detailedUser, setDetailedUser] = useState(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const isUserOnline = (userId) => {
    return onlineUsers?.some(u => u.userId === userId);
  };

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
    <aside className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-64px)] w-64 p-4 flex-col gap-6 z-40 overflow-y-auto scrollbar-hide">
      
      {/* Profile Card */}
      <div className="card p-0 overflow-hidden group">
        <div 
          className="h-24 bg-cover bg-center relative transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${displayUser.backgroundImage || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=400'})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
        </div>
        <div className="px-4 pb-6 text-center relative">
          <div className="relative -mt-12 mb-4 inline-block">
            <img 
              src={displayUser.profileImage || "https://via.placeholder.com/96"} 
              alt="Profile" 
              className="w-24 h-24 rounded-full border-4 border-card object-cover shadow-2xl transition-transform hover:scale-105"
            />
            {isUserOnline(displayUser._id) && (
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-card rounded-full shadow-lg"></div>
            )}
          </div>
          <Link to={`/profile/${displayUser._id}`} className="block group/link">
            <h2 className="text-xl font-bold text-text-main leading-tight group-hover/link:text-accent transition-colors flex items-center justify-center gap-1.5">
              {displayUser.username}
              {displayUser.isVerified && <VerifiedBadge size={16} />}
            </h2>
          </Link>
          <p className="text-xs text-text-muted mt-2 line-clamp-2 px-2 font-medium leading-relaxed">
            {displayUser.bio || "Sharing my journey on P Connect"}
          </p>
        </div>

        {/* Stats */}
        <div className="flex border-t border-border-main divide-x divide-border-main bg-bg-main/50">
          <div 
            className="flex-1 p-4 text-center hover:bg-bg-main cursor-pointer transition-all relative group/stat"
            onMouseEnter={() => setShowFollowers(true)}
            onMouseLeave={() => setShowFollowers(false)}
          >
            <span className="font-black block text-text-main text-lg">{followers.length}</span>
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Followers</span>
            
            {showFollowers && (
              <div className="absolute top-0 left-full ml-4 w-64 glass rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="p-2 border-b border-border-main mb-1">
                  <h3 className="text-xs font-black uppercase text-accent">Followers</h3>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {followers.length > 0 ? followers.map(f => (
                    <Link to={`/profile/${f._id}`} key={f._id} className="flex items-center gap-3 p-2 hover:bg-accent/5 rounded-xl transition-all">
                      <img src={f.profileImage || "https://via.placeholder.com/32"} className="w-8 h-8 rounded-full object-cover border border-border-main" alt={f.username} />
                      <span className="text-sm font-semibold text-text-muted truncate">{f.username}</span>
                    </Link>
                  )) : (
                    <p className="text-xs text-text-muted p-4 text-center italic">No followers yet</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div 
            className="flex-1 p-4 text-center hover:bg-bg-main cursor-pointer transition-all relative group/stat"
            onMouseEnter={() => setShowFollowing(true)}
            onMouseLeave={() => setShowFollowing(false)}
          >
            <span className="font-black block text-text-main text-lg">{following.length}</span>
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Following</span>

            {showFollowing && (
              <div className="absolute top-0 left-full ml-4 w-64 glass rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="p-2 border-b border-border-main mb-1">
                  <h3 className="text-xs font-black uppercase text-accent">Following</h3>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {following.length > 0 ? following.map(f => (
                    <Link to={`/profile/${f._id}`} key={f._id} className="flex items-center gap-3 p-2 hover:bg-accent/5 rounded-xl transition-all">
                      <img src={f.profileImage || "https://via.placeholder.com/32"} className="w-8 h-8 rounded-full object-cover border border-border-main" alt={f.username} />
                      <span className="text-sm font-semibold text-text-muted truncate">{f.username}</span>
                    </Link>
                  )) : (
                    <p className="text-xs text-text-muted p-4 text-center italic">Not following anyone</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
