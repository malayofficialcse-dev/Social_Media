import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import VerifiedBadge from './VerifiedBadge';

const RightSidebar = () => {
  const [users, setUsers] = useState([]);
  const [followedState, setFollowedState] = useState({});
  const { user, fetchUser } = useAuth();
  const { onlineUsers } = useSocket();

  const isUserOnline = (userId) => {
    return onlineUsers?.some(u => u.userId === userId);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/users/suggestions');
        setUsers(data);
      } catch {
        // Silently fail
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (user?.following) {
      const newState = {};
      user.following.forEach(f => {
        const id = typeof f === 'object' ? f._id : f;
        newState[id] = true;
      });
      setFollowedState(newState);
    }
  }, [user]);

  const handleFollow = async (id) => {
    const isFollowing = !!followedState[id];
    setFollowedState(prev => ({ ...prev, [id]: !isFollowing }));

    try {
      if (isFollowing) {
        await api.put(`/users/${id}/unfollow`);
      } else {
        await api.put(`/users/${id}/follow`);
      }
      fetchUser();
    } catch {
      setFollowedState(prev => ({ ...prev, [id]: isFollowing }));
    }
  };

  return (
    <aside className="fixed right-0 top-16 h-[calc(100vh-64px)] w-80 p-6 hidden xl:block overflow-y-auto z-40">
      <div className="card h-full flex flex-col glass border-none">
        <h2 className="text-xl font-black mb-6 tracking-tight gradient-text inline-block">All Users</h2>
        <div className="space-y-5 flex-1 overflow-y-auto pr-2 scrollbar-thin">
          {users.map((u) => {
            const isFollowing = !!followedState[u._id];
            return (
              <div key={u._id} className="flex items-center justify-between group/item p-2 -mx-2 rounded-2xl hover:bg-bg-main/50 transition-all">
                <Link to={`/profile/${u._id}`} className="flex items-center gap-3 shrink-0">
                  <div className="relative">
                    <img 
                      src={u.profileImage || "https://via.placeholder.com/40"} 
                      alt={u.username} 
                      className="w-10 h-10 rounded-full object-cover border-2 border-border-main shadow-md group-hover/item:border-accent/30 transition-all" 
                    />
                    {isUserOnline(u._id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface rounded-full"></div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-accent/10 opacity-0 group-hover/item:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-text-main text-sm truncate w-24 flex items-center gap-1">
                      {u.username}
                      {u.isVerified && <VerifiedBadge size={10} />}
                    </p>
                    <p className="text-[10px] text-text-muted font-medium">Community Member</p>
                  </div>
                </Link>
                <button 
                  onClick={() => handleFollow(u._id)}
                  className={`text-[11px] font-black px-4 py-1.5 rounded-full transition-all uppercase tracking-wider ${
                    isFollowing
                    ? 'bg-bg-main text-text-muted hover:bg-red-500 hover:text-white' 
                    : 'bg-accent text-white hover:bg-accent-hover shadow-lg shadow-accent/20'
                  }`}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              </div>
            );
          })}
          {users.length === 0 && (
            <div className="text-center py-10">
              <p className="text-text-muted text-sm italic font-medium">No users found.</p>
            </div>
          )}
        </div>
        <div className="mt-auto pt-6 border-t border-border-main">
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em] mb-4">Trending Tags</p>
          <div className="flex flex-wrap gap-2">
            {['#technology', '#pconnect', '#lifestyle'].map(tag => (
              <span key={tag} className="text-[10px] font-bold text-text-muted hover:text-accent cursor-pointer transition-colors bg-bg-main/50 px-2 py-1 rounded-md">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
