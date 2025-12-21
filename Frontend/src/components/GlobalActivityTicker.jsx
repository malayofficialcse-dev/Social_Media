import React, { useState, useEffect } from 'react';
import { FaBolt, FaFire, FaGlobe, FaUserPlus, FaHeart } from 'react-icons/fa';

const GlobalActivityTicker = () => {
  const [activities, setActivities] = useState([
    { id: 1, icon: <FaUserPlus />, text: "New Elite Member joined from Tokyo", color: "text-accent" },
    { id: 2, icon: <FaFire />, text: "Post in #Technology trending in London", color: "text-amber-500" },
    { id: 3, icon: <FaBolt />, text: "Social Wealth Score surge in Mumbai", color: "text-purple-500" },
    { id: 4, icon: <FaHeart />, text: "Elite Badge awarded to 12 active creators", color: "text-rose-500" },
    { id: 5, icon: <FaGlobe />, text: "Network latency: 24ms - Optimal Stability", color: "text-green-500" }
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [activities.length]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] px-4 pb-4 pointer-events-none hidden md:block">
      <div className="max-w-screen-xl mx-auto flex justify-center">
        <div className="pointer-events-auto flex items-center gap-4 px-6 py-2.5 bg-surface/40 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-5 duration-700">
          <div className="flex items-center gap-2 pr-4 border-r border-white/10">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Live Pulse</span>
          </div>

          <div className="overflow-hidden h-5 w-64 md:w-96 relative">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className={`absolute inset-0 flex items-center gap-3 transition-all duration-700 transform ${
                  index === currentIndex 
                    ? 'translate-y-0 opacity-100' 
                    : index === (currentIndex - 1 + activities.length) % activities.length
                    ? '-translate-y-full opacity-0'
                    : 'translate-y-full opacity-0'
                }`}
              >
                <span className={`${activity.color} group-hover:scale-110 transition-transform`}>
                  {activity.icon}
                </span>
                <span className="text-xs font-bold text-text-main tracking-tight truncate">
                  {activity.text}
                </span>
              </div>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-white/10">
            <span className="text-[9px] font-black uppercase text-accent">Status: Encrypted</span>
            <FaGlobe className="text-text-muted transition-colors hover:text-accent cursor-help" size={10} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalActivityTicker;
