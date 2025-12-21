import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Chat from './pages/Chat';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex justify-center items-center h-screen text-accent">Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex justify-center items-center h-screen text-accent">Loading...</div>;
  
  if (user) {
    return <Navigate to="/" />;
  }
  
  return children;
};

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <SocketProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Layout />}>
                  {/* Public Routes */}
                  <Route path="login" element={<PublicRoute><Login /></PublicRoute>} />
                  <Route path="register" element={<PublicRoute><Register /></PublicRoute>} />
                  <Route path="about" element={<About />} />
                  <Route path="contact" element={<Contact />} />

                  {/* Protected Routes */}
                  <Route index element={<ProtectedRoute><Home /></ProtectedRoute>} />
                  <Route path="profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                  <Route path="chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                  <Route path="admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                </Route>
              </Routes>
            </Router>
          </SocketProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
