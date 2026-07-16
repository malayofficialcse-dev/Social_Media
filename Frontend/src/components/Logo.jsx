import React from 'react';

const Logo = ({ className = "", iconClassName = "w-9 h-9", textClassName = "text-xl" }) => {
  return (
    <div className={`flex items-center gap-2 group cursor-pointer transition-all duration-500 hover:scale-105 w-fit ${className}`}>
      <div className="relative shrink-0">
        {/* Main Logo Hexagon/Shaped Background */}
        <div className={`${iconClassName} bg-gradient-to-br from-accent via-accent-hover to-purple-600 rounded-[12px] flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(6,182,212,0.6)] transform rotate-12 group-hover:rotate-0 transition-all duration-500`}>
           {/* Inner white glow */}
           <div className="absolute inset-0 rounded-[12px] bg-white/10 blur-[2px] opacity-50"></div>
           
           {/* The 'P' Icon */}
           <span className="text-white font-black text-xl -rotate-12 group-hover:rotate-0 transition-all duration-500 select-none">P</span>
        </div>
        
        {/* Floating Accent Dot */}
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-110 transition-all duration-700 delay-100">
           <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
        </div>
      </div>
      
      <div className="flex flex-col -space-y-1.5">
        <span className={`font-black tracking-tighter transition-colors duration-500 ${textClassName} bg-gradient-to-r from-text-main via-text-main/80 to-accent bg-clip-text text-transparent`}>
          Connect
        </span>
        <span className="text-[10px] uppercase tracking-[0.3em] font-black text-accent/60 ml-0.5 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-x-1 group-hover:translate-x-0">
          Premium
        </span>
      </div>
    </div>
  );
};

export default Logo;
