import { Link, useNavigate } from 'react-router-dom';
import { FaChartLine,FaUser, FaSignOutAlt, FaHome, FaInfoCircle, FaSearch, FaBars, FaBell, FaPaperPlane, FaSun, FaMoon, FaUsers, FaTimes, FaShieldAlt, FaGhost, FaEyeSlash } from 'react-icons/fa';
import VerifiedBadge from './VerifiedBadge';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import api from '../services/api';
import Logo from './Logo';

const Header = () => {
  const { user, setUser, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [ghostMode, setGhostMode] = useState(user?.isGhostMode || false);

  const toggleGhostMode = async () => {
    if (!user?.isPro) {
      toast.info("Elite Ghost Mode requires Pro membership");
      return;
    }
    try {
      const { data } = await api.put('/users/ghost-mode');
      if (data.success) {
        setGhostMode(data.isGhostMode);
        toast.success(data.isGhostMode ? "Ghost Mode: Active (Invisible)" : "Ghost Mode: Disabled (Visible)");
        setUser({ ...user, isGhostMode: data.isGhostMode });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle Ghost Mode");
    }
  };

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

  const handleMobileNav = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 left-0 right-0 w-full z-[70] bg-surface/80 backdrop-blur-xl border-b border-border-main/20 py-2 md:py-3 transition-all duration-500 shadow-sm">
      <div className="w-full max-w-[1700px] mx-auto px-4 md:px-8 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-6">
          <button 
            className="lg:hidden text-text-muted hover:text-text-main p-2 hover:bg-surface/50 rounded-xl transition-all border border-transparent active:scale-95"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
          
          <Link to="/" className="shrink-0">
            <Logo 
              iconClassName="w-7 h-7 md:w-9 h-9" 
              textClassName="text-base md:text-xl" 
            />
          </Link>
        </div>
        
        {/* Desktop Search Bar */}
        <div className="relative flex-1 max-w-xl hidden lg:block group mx-6">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
            <FaSearch className="text-text-muted w-4 h-4 group-focus-within:text-accent transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-6 py-2.5 bg-bg-main/40 border border-border-main/50 rounded-[1.25rem] text-text-main placeholder-text-muted/60 focus:outline-none focus:bg-surface focus:border-accent/40 focus:ring-8 focus:ring-accent/5 transition-all text-sm font-medium shadow-sm hover:shadow-md"
            placeholder="Search the network..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            onFocus={() => setShowResults(true)}
          />
          
          {showResults && searchResults.length > 0 && (
            <div className="absolute mt-3 w-full bg-surface border border-border-main/60 rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] z-[70] max-h-[70vh] overflow-y-auto p-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted/40 mb-3 px-3">Top Profiles</p>
              <div className="space-y-1">
                {searchResults.map((result) => (
                  <Link 
                    key={result._id} 
                    to={`/profile/${result._id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-accent/5 rounded-[1.25rem] transition-all group/item border border-transparent hover:border-accent/10"
                    onClick={() => {
                      setSearchQuery('');
                      setShowResults(false);
                    }}
                  >
                    <div className="relative">
                      <img 
                        src={result.profileImage || `https://ui-avatars.com/api/?name=${result.username}`} 
                        alt={result.username} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-border-main group-hover/item:border-accent/40 transition-colors"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-surface rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-main leading-tight group-hover/item:text-accent transition-colors flex items-center gap-1">
                        {result.username}
                        {result.isVerified && <VerifiedBadge size={10} />}
                      </p>
                      <p className="text-[11px] text-text-muted truncate max-w-[250px] font-medium">{result.bio || "Platform Creator"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 p-1 bg-surface/30 border border-border-main/30 rounded-2xl mr-4">
          <Link to="/" title="Home" className="p-3 rounded-xl text-text-muted hover:text-accent hover:bg-accent/5 transition-all group">
            <FaHome size={22} className="group-hover:scale-110 transition-transform" />
          </Link>
          <Link to="/notifications" title="Notifications" className="p-3 rounded-xl text-text-muted hover:text-accent hover:bg-accent/5 transition-all relative group">
            <FaBell size={21} className="group-hover:scale-110 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 bg-accent text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border-2 border-surface">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link to="/chat" title="Messages" className="p-3 rounded-xl text-text-muted hover:text-accent hover:bg-accent/5 transition-all group">
            <FaPaperPlane size={20} className="group-hover:scale-110 transition-transform" />
          </Link>
          <Link to="/analytics" title="Network Insights" className="p-3 rounded-xl text-text-muted hover:text-accent hover:bg-accent/5 transition-all group">
            <FaChartLine size={20} className="group-hover:scale-110 transition-transform" />
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" title="Admin Control" className="p-3 rounded-xl text-purple-500 hover:text-purple-600 hover:bg-purple-500/5 transition-all group border-l border-border-main/20 ml-1">
              <FaShieldAlt size={20} className="group-hover:scale-110 transition-transform" />
            </Link>
          )}
          <Link to="/about" title="About" className={`p-3 rounded-xl text-text-muted hover:text-accent hover:bg-accent/5 transition-all group ${user?.role === 'admin' ? '' : 'border-l border-border-main/20 ml-1'}`}>
            <FaInfoCircle size={21} className="group-hover:scale-110 transition-transform" />
          </Link>
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-xl text-text-muted hover:text-accent hover:bg-accent/5 transition-all group"
            title={theme === 'dark' ? "Eye Care: Enabled" : "High Contrast: On"}
          >
            {theme === 'dark' ? <FaSun size={20} className="group-hover:rotate-45 transition-transform" /> : <FaMoon size={20} className="group-hover:-rotate-12 transition-transform" />}
          </button>
        </nav>

        {/* User Workspace */}
        <div className="flex items-center gap-1.5 md:gap-3">
          {user ? (
            <div className="flex items-center gap-1.5 md:gap-3 p-1 rounded-2xl border border-border-main/10 bg-surface/30">
              <Link to={`/profile/${user._id}`} className="flex items-center gap-2 pl-1 pr-1 md:pr-4 py-1 rounded-xl transition-all hover:bg-accent/5 group">
                <img 
                  src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}`} 
                  alt="My Profile" 
                  className="w-7 h-7 md:w-9 h-9 rounded-xl object-cover border border-border-main group-hover:border-accent/40 shadow-sm"
                />
                <div className="hidden xl:flex flex-col items-start -space-y-1">
                  <span className="text-[13px] font-black text-text-main group-hover:text-accent transition-colors">{user.username?.split(' ')[0]}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-text-muted/60">Professional</span>
                </div>
              </Link>
              
              {user.isPro && (
                <button 
                  onClick={toggleGhostMode}
                  className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center border-l border-border-main/10 group ${ghostMode ? 'bg-purple-500/10 text-purple-500' : 'text-text-muted hover:text-accent hover:bg-accent/5'}`}
                  title={ghostMode ? "Ghost Mode Active (Invisible)" : "Activate Ghost Mode"}
                >
                   {ghostMode ? <FaEyeSlash size={16} className="animate-pulse" /> : <FaGhost size={16} />}
                </button>
              )}

              <button 
                onClick={logout}
                className="w-7 h-7 md:w-10 md:h-10 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/5 transition-all flex items-center justify-center border-l border-border-main/10"
                title="Secure logout"
              >
                <FaSignOutAlt size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-text-muted hover:text-text-main text-xs md:text-sm font-black px-2 md:px-4 py-2 transition-all uppercase tracking-widest">Login</Link>
              <Link to="/register" className="bg-accent text-white px-4 md:px-8 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-black shadow-lg shadow-accent/20 hover:scale-105 transition-all active:scale-95">Enroll</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile/Tablet Drawer Content */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full glass border-b border-border-main/40 p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-4 duration-500 overflow-y-auto max-h-[calc(100vh-80px)]">
           {/* Enhanced Mobile Search */}
           <div className="mb-8 relative">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-3 px-1">Network Discovery</p>
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text"
                  placeholder="Find collaborators..."
                  className="w-full pl-12 pr-4 py-4 bg-bg-main/50 border border-border-main rounded-2xl text-text-main focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-bold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {searchQuery && searchResults.length > 0 && (
                <div className="mt-4 space-y-3 bg-surface/50 rounded-2xl p-3 border border-border-main">
                   {searchResults.slice(0, 5).map(result => (
                      <Link key={result._id} to={`/profile/${result._id}`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-2 rounded-xl border border-transparent hover:bg-accent/5">
                         <img src={result.profileImage || `https://ui-avatars.com/api/?name=${result.username}`} className="w-10 h-10 rounded-full border border-border-main" />
                         <span className="font-bold text-sm text-text-main flex items-center gap-1">
                           {result.username}
                           {result.isVerified && <VerifiedBadge size={10} />}
                         </span>
                      </Link>
                   ))}
                </div>
              )}
           </div>

           <div className="grid grid-cols-2 gap-4 mb-8">
              <button onClick={() => handleMobileNav('/')} className="flex flex-col items-center justify-center gap-2 p-6 rounded-3xl bg-surface/40 border border-border-main hover:border-accent/30 transition-all group">
                <FaHome className="text-accent group-hover:scale-110 transition-transform" size={24} /> 
                <span className="font-black text-[11px] uppercase tracking-widest text-text-main">Home</span>
              </button>
              <button onClick={() => handleMobileNav('/chat')} className="flex flex-col items-center justify-center gap-2 p-6 rounded-3xl bg-surface/40 border border-border-main hover:border-accent/30 transition-all group">
                <FaPaperPlane className="text-accent group-hover:scale-110 transition-transform" size={22} /> 
                <span className="font-black text-[11px] uppercase tracking-widest text-text-main">Messages</span>
              </button>
              <button onClick={() => handleMobileNav('/analytics')} className="flex flex-col items-center justify-center gap-2 p-6 rounded-3xl bg-surface/40 border border-border-main hover:border-accent/30 transition-all group">
                <FaChartLine className="text-accent group-hover:scale-110 transition-transform" size={22} /> 
                <span className="font-black text-[11px] uppercase tracking-widest text-text-main">Analytics</span>
              </button>
              <button onClick={() => handleMobileNav('/notifications')} className="flex flex-col items-center justify-center gap-2 p-6 rounded-3xl bg-surface/40 border border-border-main hover:border-accent/30 transition-all group relative">
                <FaBell className="text-accent group-hover:scale-110 transition-transform" size={22} /> 
                <span className="font-black text-[11px] uppercase tracking-widest text-text-main">Alerts</span>
                {unreadCount > 0 && <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full border-2 border-surface"></div>}
              </button>
              <button onClick={() => handleMobileNav('/')} className="flex flex-col items-center justify-center gap-2 p-6 rounded-3xl bg-accent text-white shadow-xl shadow-accent/20 transition-all active:scale-95">
                <FaUsers size={22} /> 
                <span className="font-black text-[11px] uppercase tracking-widest">Community</span>
              </button>
           </div>

           <div className="flex flex-col gap-3">
              <button onClick={() => handleMobileNav('/about')} className="flex items-center justify-between p-5 rounded-2xl bg-surface/20 border border-border-main text-text-muted hover:text-text-main transition-all font-bold">
                 <div className="flex items-center gap-4">
                    <FaInfoCircle size={18} /> <span>About P Connect</span>
                 </div>
                 <FaUser size={12} className="opacity-20" />
              </button>
              
              {user?.role === 'admin' && (
                <button onClick={() => handleMobileNav('/admin')} className="flex items-center justify-between p-5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 font-black uppercase tracking-widest text-xs transition-all hover:bg-purple-500 hover:text-white group">
                  <div className="flex items-center gap-4">
                    <FaShieldAlt size={18} className="group-hover:rotate-12 transition-transform" /> <span>Admin Center</span>
                  </div>
                  <div className="px-2 py-0.5 bg-purple-500/20 rounded text-[8px]">ROOT</div>
                </button>
              )}

               <div className="h-[1px] bg-border-main/50 my-2"></div>

               {user?.isPro && (
                <button 
                  onClick={toggleGhostMode}
                  className={`flex items-center justify-between p-5 rounded-2xl border transition-all font-bold ${ghostMode ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-surface/40 border-border-main text-text-main'}`}
                >
                  <div className="flex items-center gap-4">
                    {ghostMode ? <FaEyeSlash size={18} /> : <FaGhost size={18} />}
                    <span>{ghostMode ? 'Ghost Mode: Active' : 'Ghost Mode: Hidden'}</span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${ghostMode ? 'bg-purple-500 animate-pulse shadow-[0_0_8px_#a855f7]' : 'bg-slate-400 opacity-20'}`}></div>
                </button>
              )}

               <button 
                onClick={toggleTheme}
                className="flex items-center justify-between p-5 rounded-2xl bg-surface/40 border border-border-main text-text-main font-bold"
              >
                <div className="flex items-center gap-4">
                  {theme === 'dark' ? <FaSun size={18} /> : <FaMoon size={18} />}
                  <span>{theme === 'dark' ? 'Light Appearance' : 'Dark Appearance'}</span>
                </div>
                <div className="w-10 h-5 bg-border-main rounded-full relative">
                   <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${theme === 'dark' ? 'right-1 bg-accent' : 'left-1 bg-slate-400'}`}></div>
                </div>
              </button>

              {user && (
                <button 
                  onClick={() => { logout(); setIsMenuOpen(false); }}
                  className="mt-4 flex items-center justify-center gap-4 p-5 rounded-2xl bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black uppercase tracking-widest text-sm"
                >
                  <FaSignOutAlt /> Terminate Session
                </button>
              )}
           </div>
        </div>
      )}
    </header>
  );
};

export default Header;
