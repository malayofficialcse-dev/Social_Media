import { Link } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaHome, FaInfoCircle, FaEnvelope, FaSearch, FaBars, FaBell, FaPaperPlane } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useState, useEffect } from 'react';
import api from '../services/api';

const Header = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const { data } = await api.get(`/users/search?query=${searchQuery}`);
        setSearchResults(data);
      } catch (error) {
        console.error("Search error", error);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Hamburger Button (Mobile) */}
          <button 
            className="md:hidden text-slate-300 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <FaBars size={24} />
          </button>
          <Link to="/" className="text-xl md:text-2xl font-bold text-accent shrink-0">Innobytes</Link>
        </div>
        
        {/* Search Bar (Desktop) */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-md leading-5 bg-slate-800 text-slate-300 placeholder-slate-400 focus:outline-none focus:bg-slate-900 focus:border-accent sm:text-sm transition duration-150 ease-in-out"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            onFocus={() => setShowResults(true)}
          />
          
          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute mt-1 w-full bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <Link 
                  key={result._id} 
                  to={`/profile/${result._id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors"
                  onClick={() => {
                    setSearchQuery('');
                    setShowResults(false);
                  }}
                >
                  <img 
                    src={result.profileImage || "https://via.placeholder.com/40"} 
                    alt={result.username} 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{result.username}</p>
                    <p className="text-xs text-slate-400 truncate">{result.bio || "No bio available"}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
            <FaHome size={20} />
            <span className="text-xs">Home</span>
          </Link>
          <Link to="/notifications" className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors relative">
            <div className="relative">
              <FaBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs">Notifications</span>
          </Link>
          <Link to="/chat" className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
            <FaPaperPlane size={20} />
            <span className="text-xs">Messages</span>
          </Link>
          <Link to="/about" className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
            <FaInfoCircle size={20} />
            <span className="text-xs">About</span>
          </Link>
          <Link to="/contact" className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
            <FaEnvelope size={20} />
            <span className="text-xs">Contact</span>
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to={`/profile/${user._id}`} className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
                <img 
                  src={user.profileImage || "https://via.placeholder.com/32"} 
                  alt="Profile" 
                  className="w-6 h-6 rounded-full object-cover border border-slate-600"
                />
                <span className="text-xs hidden sm:block">Me</span>
              </Link>
              <button 
                onClick={logout}
                className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <FaSignOutAlt size={20} />
                <span className="text-xs hidden sm:block">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex gap-4">
              <Link to="/login" className="text-slate-300 hover:text-white font-medium">Login</Link>
              <Link to="/register" className="btn btn-primary py-1.5 px-4 text-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-surface border-b border-slate-800 p-4 shadow-xl">
          <div className="flex flex-col gap-4">
            {/* Mobile Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-md bg-slate-800 text-slate-300 placeholder-slate-400 focus:outline-none focus:border-accent"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
              />
               {/* Mobile Search Results */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute mt-1 w-full bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <Link 
                      key={result._id} 
                      to={`/profile/${result._id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors"
                      onClick={() => {
                        setSearchQuery('');
                        setShowResults(false);
                        setIsMenuOpen(false);
                      }}
                    >
                      <img 
                        src={result.profileImage || "https://via.placeholder.com/40"} 
                        alt={result.username} 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{result.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <nav className="flex flex-col gap-2">
              <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300" onClick={() => setIsMenuOpen(false)}>
                <FaHome /> Home
              </Link>
              <Link to="/notifications" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300" onClick={() => setIsMenuOpen(false)}>
                <div className="relative">
                  <FaBell />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-3 w-3 flex items-center justify-center"></span>
                  )}
                </div>
                Notifications
              </Link>
              <Link to="/chat" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300" onClick={() => setIsMenuOpen(false)}>
                <FaPaperPlane /> Messages
              </Link>
              <Link to="/about" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300" onClick={() => setIsMenuOpen(false)}>
                <FaInfoCircle /> About Us
              </Link>
              <Link to="/contact" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300" onClick={() => setIsMenuOpen(false)}>
                <FaEnvelope /> Contact Us
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
