import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications/unread-count');
      
      if (data.count > unreadCount) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log("Audio play failed", e));
      }
      
      setUnreadCount(data.count);
    } catch (error) {
      console.error("Error fetching notification count", error);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking notifications as read", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Poll every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{ unreadCount, fetchUnreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
