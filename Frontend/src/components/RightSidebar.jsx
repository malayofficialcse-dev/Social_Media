import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const RightSidebar = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [followedState, setFollowedState] = useState({});
  const { user, fetchUser } = useAuth();

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const { data } = await api.get('/users/suggestions');
        setSuggestions(data);
      } catch (error) {
        console.error("Error fetching suggestions", error);
      }
    };
    fetchSuggestions();
  }, []);

  useEffect(() => {
    if (user && user.following) {
      const initialFollowedState = {};
      user.following.forEach(f => {
        const id = typeof f === 'object' ? f._id : f;
        initialFollowedState[id] = true;
      });
      setFollowedState(initialFollowedState);
    }
  }, [user]);

  const handleFollow = async (id) => {
    // Optimistic update
    const isFollowing = !!followedState[id];
    setFollowedState(prev => ({ ...prev, [id]: !isFollowing }));

    try {
      if (isFollowing) {
        await api.put(`/users/${id}/unfollow`);
      } else {
        await api.put(`/users/${id}/follow`);
      }
      // Sync global state
      fetchUser();
    } catch (error) {
      console.error("Error following/unfollowing user", error);
      // Revert on error
      setFollowedState(prev => ({ ...prev, [id]: isFollowing }));
    }
  };

  return (
    <div className="fixed right-0 top-[73px] h-[calc(100vh-73px)] w-80 bg-dark border-l border-slate-800 p-6 hidden lg:block overflow-y-auto z-40">
      <h2 className="text-xl font-bold mb-6">Who to follow</h2>
      <div className="space-y-6">
        {suggestions.map((suggestion) => {
          const isFollowing = !!followedState[suggestion._id];
          return (
            <div key={suggestion._id} className="flex items-center justify-between">
              <Link to={`/profile/${suggestion._id}`} className="flex items-center gap-3 group">
                <img 
                  src={suggestion.profileImage || "https://via.placeholder.com/40"} 
                  alt={suggestion.username} 
                  className="w-10 h-10 rounded-full object-cover group-hover:opacity-80 transition-opacity" 
                />
                <div>
                  <p className="font-medium text-white group-hover:text-accent transition-colors">{suggestion.username}</p>
                  <p className="text-xs text-slate-500">Suggested for you</p>
                </div>
              </Link>
              <button 
                onClick={() => handleFollow(suggestion._id)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                  isFollowing
                  ? 'bg-transparent border border-slate-500 text-slate-300 hover:border-red-500 hover:text-red-500' 
                  : 'bg-white text-dark hover:bg-slate-200'
                }`}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            </div>
          );
        })}
        {suggestions.length === 0 && (
          <p className="text-slate-500 text-sm">No suggestions available.</p>
        )}
      </div>
    </div>
  );
};

export default RightSidebar;
