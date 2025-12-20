import { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';

// Smart URL detection: If we are on localhost, use local backend. Otherwise use Prod.
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const ENDPOINT = isLocal ? 'http://localhost:5001' : (import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://social-media-vdsn.onrender.com');

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(ENDPOINT);
      setSocket(newSocket);

      newSocket.emit("setup", user);

      newSocket.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      return () => {
        newSocket.close();
        setSocket(null);
      };
    } else {
      setSocket(prev => {
        if (prev) prev.close();
        return null;
      });
      setOnlineUsers([]);
    }
  }, [user]);

  const value = useMemo(() => ({
    socket,
    onlineUsers
  }), [socket, onlineUsers]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
