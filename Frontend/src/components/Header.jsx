import { Link } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaHome, FaInfoCircle, FaEnvelope, FaSearch, FaBars, FaBell, FaPaperPlane, FaSun, FaMoon } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';
import api from '../services/api';

const Header = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5 py-2 px-4 md:px-6">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            className="md:hidden text-slate-300 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-all"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <FaBars size={20} />
          </button>
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
              <span className="text-white font-black text-xl">P</span>
            </div>
            <span className="text-xl font-black gradient-text tracking-tighter hidden sm:block">Connect</span>
          </Link>
        </div>
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-lg hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FaSearch className="text-slate-500 w-4 h-4" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-2 bg-surface border border-border-main rounded-2xl text-text-main placeholder-text-muted focus:outline-none focus:bg-surface focus:border-accent/30 focus:ring-4 focus:ring-accent/5 transition-all text-sm"
            placeholder="Explore users..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            onFocus={() => setShowResults(true)}
          />
          
          {showResults && searchResults.length > 0 && (
            <div className="absolute mt-2 w-full glass border border-border-main rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto p-2 animate-in fade-in zoom-in-95 duration-200">
              {searchResults.map((result) => (
                <Link 
                  key={result._id} 
                  to={`/profile/${result._id}`}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-bg-main/50 rounded-xl transition-all"
                  onClick={() => {
                    setSearchQuery('');
                    setShowResults(false);
                  }}
                >
                  <img 
                    src={result.profileImage || "https://via.placeholder.com/40"} 
                    alt={result.username} 
                    className="w-9 h-9 rounded-full object-cover border border-border-main"
                  />
                  <div>
                    <p className="text-sm font-semibold text-text-main leading-tight">{result.username}</p>
                    <p className="text-[11px] text-text-muted truncate max-w-[200px]">{result.bio || "Active member"}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-2">
          <Link to="/" title="Home" className="p-2.5 rounded-xl text-text-muted hover:text-text-main hover:bg-accent/5 transition-all">
            <FaHome size={22} />
          </Link>
          <Link to="/notifications" title="Notifications" className="p-2.5 rounded-xl text-text-muted hover:text-text-main hover:bg-accent/5 transition-all relative">
            <FaBell size={21} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border-2 border-surface">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link to="/chat" title="Messages" className="p-2.5 rounded-xl text-text-muted hover:text-text-main hover:bg-accent/5 transition-all">
            <FaPaperPlane size={20} />
          </Link>
          <Link to="/about" title="About" className="p-2.5 rounded-xl text-text-muted hover:text-text-main hover:bg-accent/5 transition-all">
            <FaInfoCircle size={21} />
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" title="Admin" className="p-2.5 rounded-xl text-text-muted hover:text-accent hover:bg-accent/5 transition-all">
              <FaUser size={20} />
            </Link>
          )}
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-text-muted hover:text-accent hover:bg-accent/5 transition-all"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <FaSun size={20} /> : <FaMoon size={20} />}
          </button>
        </nav>

        {/* User Profile / Auth */}
        <div className="flex items-center gap-2 md:gap-4 ml-2">
          {user ? (
            <>
              <div className="h-8 w-[1px] bg-border-main mx-1 hidden md:block"></div>
              <Link to={`/profile/${user._id}`} className="flex items-center gap-3 p-1.5 pl-1.5 pr-4 rounded-full hover:bg-bg-main/50 transition-all border border-transparent hover:border-border-main">
                <img 
                  src={user.profileImage || "https://via.placeholder.com/32"} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover border-2 border-border-main shadow-sm"
                />
                <span className="text-sm font-semibold text-text-main hidden xl:block">{user.username?.split(' ')[0]}</span>
              </Link>
              <button 
                onClick={logout}
                className="p-2.5 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/5 transition-all"
                title="Logout"
              >
                <FaSignOutAlt size={18} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-slate-400 hover:text-white text-sm font-semibold px-4 py-2 transition-all">Login</Link>
              <Link to="/register" className="btn btn-primary text-sm px-6 py-2">Join Now</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full glass border-b border-white/10 p-4 shadow-2xl animate-in slide-in-from-top-4 duration-300">
           {/* ... mobile menu content ... */}
           <div className="flex flex-col gap-2">
              <Link to="/" className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 text-slate-200" onClick={() => setIsMenuOpen(false)}>
                <FaHome className="text-accent" /> <span className="font-semibold">Home</span>
              </Link>
              <Link to="/notifications" className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 text-slate-200" onClick={() => setIsMenuOpen(false)}>
                <FaBell className="text-accent" /> <span className="font-semibold">Notifications</span>
              </Link>
              <Link to="/chat" className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 text-slate-200" onClick={() => setIsMenuOpen(false)}>
                <FaPaperPlane className="text-accent" /> <span className="font-semibold">Messages</span>
              </Link>
              <button 
                onClick={() => { logout(); setIsMenuOpen(false); }}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-red-400/5 text-red-400 transition-all font-semibold"
              >
                <FaSignOutAlt /> Sign Out
              </button>
           </div>
        </div>
      )}
    </header>
  );
};

export default Header;
