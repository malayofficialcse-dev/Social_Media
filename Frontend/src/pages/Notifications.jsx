import { useState, useEffect } from 'react';
import { FaHeart, FaComment, FaRetweet, FaUserPlus } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';

const Notifications = () => {
  const { markAllRead } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data);
        // Mark all as read
        markAllRead();
      } catch (error) {
        console.error("Error fetching notifications", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [markAllRead]);

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <FaHeart className="text-red-500" />;
      case 'comment': return <FaComment className="text-accent" />;
      case 'repost': return <FaRetweet className="text-green-500" />;
      case 'follow': return <FaUserPlus className="text-blue-500" />;
      default: return null;
    }
  };

  const getMessage = (notification) => {
    const username = notification.sender.username;
    switch (notification.type) {
      case 'like': return `liked your post`;
      case 'comment': return `commented on your post`;
      case 'repost': return `reposted your post`;
      case 'follow': return `followed you`;
      default: return '';
    }
  };

  const clearAllNotifications = async () => {
    if (window.confirm("Are you sure you want to clear all notifications?")) {
      try {
        await api.delete('/notifications/clear-all');
        setNotifications([]);
      } catch (error) {
        console.error("Error clearing notifications", error);
      }
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (error) {
      console.error("Error deleting notification", error);
    }
  };

  if (loading) return <div className="flex justify-center pt-10 text-accent">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.length > 0 && (
          <button 
            onClick={clearAllNotifications}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        {notifications.map(notification => (
          <div key={notification._id} className={`card flex items-center gap-4 p-4 group relative ${!notification.read ? 'bg-slate-800/50' : ''}`}>
            <div className="text-2xl">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <img 
                  src={notification.sender.profileImage || "https://via.placeholder.com/40"} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <p className="text-slate-200">
                  <span className="font-bold">{notification.sender.username}</span> {getMessage(notification)}
                </p>
              </div>
              {notification.post && (
                <p className="text-slate-500 text-sm mt-1 ml-10 line-clamp-1">
                  {notification.post.content}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </span>
              <button 
                onClick={() => deleteNotification(notification._id)}
                className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete notification"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-center text-slate-500 mt-10">No notifications yet.</p>
        )}
      </div>
    </div>
  );
};

export default Notifications;
