import { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';

// Smart URL detection: If we are on localhost, use local backend. Otherwise use Prod.
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const ENDPOINT = isLocal ? 'http://localhost:5001' : (import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://social-media-vdsn.onrender.com');

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(ENDPOINT);
      socketRef.current = newSocket;

      newSocket.emit("setup", user);

      newSocket.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      return () => {
        newSocket.close();
        socketRef.current = null;
      };
    } else {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setOnlineUsers([]);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
