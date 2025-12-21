import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
  FaGlobe, FaArrowUp, FaUsers, FaEye, FaBolt, FaCrown, FaStar, 
  FaCompass, FaTrophy, FaFire
} from 'react-icons/fa';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PostCard from '../components/PostCard';
import VerifiedBadge from '../components/VerifiedBadge';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/users/analytics');
      if (data.success) {
         setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch analytics", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const simulateTraffic = async () => {
    setSimulating(true);
    try {
      await api.post('/users/seed-analytics');
      toast.success("Traffic Simulated!");
      fetchStats();
    } catch (error) {
      toast.error("Simulation failed");
    } finally {
      setSimulating(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p className="text-text-muted font-black uppercase tracking-widest text-xs">Simulating Neural Network Insights...</p>
    </div>
  );

  if (!stats) return <div className="text-center py-20">Failed to load insights.</div>;

  const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Top Hero Section */}
      <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-bg-main to-surface p-8 md:p-12 border border-border-main/50 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-accent/10 transition-all duration-700"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-black text-text-main tracking-tighter mb-4">
              Social <span className="gradient-text">Wealth</span>
            </h1>
            <p className="text-text-muted max-w-md font-medium leading-relaxed">
              Your network influence and growth metrics over the last 30 days. You are reaching people across the globe.
            </p>
            <button 
              onClick={simulateTraffic}
              disabled={simulating}
              className="mt-6 flex items-center gap-2 px-6 py-3 bg-accent/20 border border-accent/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent hover:text-white transition-all shadow-lg shadow-accent/10"
            >
              <FaBolt className={simulating ? 'animate-spin' : ''} /> {simulating ? 'Simulating Neural Pulse...' : 'Generate Demo Insights'}
            </button>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-bg-main" />
                <circle cx="80" cy="80" r="70" fill="transparent" stroke="url(#scoreGradient)" strokeWidth="12" strokeDasharray={440} strokeDashoffset={440 - (440 * stats.networkScore) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-text-main">{stats.networkScore}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-accent">Pulse Score</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/10 rounded-full text-accent border border-accent/20">
               <FaBolt size={10} />
               <span className="text-[10px] font-black uppercase">Elite Tier</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card glass-premium group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-accent/10 rounded-2xl text-accent group-hover:scale-110 transition-transform">
              <FaEye size={20} />
            </div>
            <span className="text-[10px] font-black uppercase text-green-500 flex items-center gap-1">
              <FaArrowUp /> 12%
            </span>
          </div>
          <h3 className="text-3xl font-black text-text-main mt-4">{stats.totalViews}</h3>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">Profile Visits</p>
        </div>

        <div className="card glass-premium group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500 group-hover:scale-110 transition-transform">
              <FaFire size={20} />
            </div>
            <span className="text-[10px] font-black uppercase text-green-500 flex items-center gap-1">
              <FaArrowUp /> 8%
            </span>
          </div>
          <h3 className="text-3xl font-black text-text-main mt-4">{stats.totalEngagements}</h3>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">Total Engagements</p>
        </div>

        <div className="card glass-premium group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500 group-hover:scale-110 transition-transform">
              <FaTrophy size={20} />
            </div>
            <span className="text-[10px] font-black uppercase text-blue-500">Global Rank</span>
          </div>
          <h3 className="text-3xl font-black text-text-main mt-4">#142</h3>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">Network Standing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Engagement Landscape */}
        <div className="card glass-premium p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-text-main flex items-center gap-2">
                <FaCompass className="text-accent" /> Engagement Landscape
              </h2>
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest mt-1">Interaction density by country</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {stats.locations.length > 0 ? stats.locations.map((loc, i) => (
              <div key={i} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-bg-main flex items-center justify-center text-xs font-black border border-border-main group-hover:border-accent/30 transition-all">
                      {loc._id || '??'}
                    </div>
                    <span className="font-bold text-text-main">{loc.country || 'Global'}</span>
                  </div>
                  <span className="text-sm font-black text-text-muted">{loc.count} <span className="text-[10px] uppercase font-bold ml-1">Hits</span></span>
                </div>
                <div className="h-1.5 w-full bg-bg-main rounded-full overflow-hidden border border-border-main/20">
                   <div 
                    className="h-full bg-gradient-to-r from-accent to-purple-500 transition-all duration-1000"
                    style={{ width: `${Math.min(100, (loc.count / stats.totalEngagements) * 100)}%` }}
                   ></div>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-text-muted italic">No interaction data recorded yet.</div>
            )}
          </div>
        </div>

        {/* Global Impact Map (Simulated with Heat Grid) */}
        <div className="card glass-premium overflow-hidden relative">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
             <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          </div>
          
          <div className="p-8 relative z-10">
            <h2 className="text-xl font-black text-text-main mb-6 flex items-center gap-2">
              <FaGlobe className="text-accent" /> Network Footprint
            </h2>
            
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-border-main/50 rounded-[2rem] bg-bg-main/20">
               <div className="text-center">
                  <div className="relative inline-block mb-4">
                     <FaGlobe className="text-accent/20 animate-pulse" size={80} />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <FaCompass className="text-accent" size={30} />
                     </div>
                  </div>
                  <p className="text-xs font-black text-text-muted uppercase tracking-[0.3em]">Mapping Connections...</p>
                  <div className="flex justify-center gap-2 mt-4">
                    {stats.locations.slice(0, 3).map((l, i) => (
                      <div key={i} className="px-3 py-1 bg-surface/80 border border-border-main rounded-full text-[10px] font-black text-accent drop-shadow-lg">
                        {l.country}
                      </div>
                    ))}
                  </div>
               </div>
            </div>
            
            <div className="mt-8 flex items-center justify-between p-4 bg-bg-main/40 rounded-2xl border border-border-main/10 shadow-inner">
               <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Global Reach</span>
                 <span className="text-lg font-black text-accent">{stats.locations.length} Countries</span>
               </div>
               <div className="flex -space-x-3">
                 {stats.locations.slice(0, 4).map((l, i) => (
                   <div key={i} className="w-10 h-10 rounded-full bg-accent border-2 border-surface flex items-center justify-center text-[10px] font-black text-white shadow-xl">
                     {l._id}
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Recent Profile Interest */}
         <div className="lg:col-span-1 card glass-premium">
           <h2 className="text-lg font-black text-text-main mb-6 flex items-center gap-2">
             <FaUsers className="text-accent" /> Recent Interest
           </h2>
           <div className="space-y-4">
             {stats.recentVisitors.length > 0 ? stats.recentVisitors.map((visitor, i) => (
               <Link key={i} to={`/profile/${visitor._id}`} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-accent/5 transition-all group border border-transparent hover:border-border-main">
                  <div className="relative">
                    <img src={visitor.profileImage || `https://ui-avatars.com/api/?name=${visitor.username}`} className="w-10 h-10 rounded-full object-cover border-2 border-border-main " alt={visitor.username} />
                    {visitor.isVerified && <div className="absolute -bottom-0.5 -right-0.5"><VerifiedBadge size={10} /></div>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-text-main group-hover:text-accent transition-colors">{visitor.username}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest italic">Viewed your pulse</p>
                  </div>
               </Link>
             )) : (
              <div className="text-center py-10 text-text-muted italic border-2 border-dashed border-border-main rounded-3xl">No visitors recorded yet.</div>
             )}
           </div>
         </div>

         {/* Trending Content */}
         <div className="lg:col-span-2 card glass-premium p-8">
            <h2 className="text-xl font-black text-text-main mb-6 flex items-center gap-2">
              <FaStar className="text-yellow-500" /> High Performance Pulse
            </h2>
            {stats.trendingPost ? (
              <div className="scale-95 origin-top -mt-4 opacity-100 group">
                <div className="mb-4 flex items-center gap-2">
                   <div className="px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <FaFire /> Trending Post
                   </div>
                </div>
                <PostCard post={stats.trendingPost} />
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-border-main rounded-[2rem] bg-bg-main/10">
                <FaBolt className="mx-auto text-accent/20 mb-4" size={40} />
                <p className="text-sm font-bold text-text-muted">Keep posting to see your pulse trending!</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Analytics;
