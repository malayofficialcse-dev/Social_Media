import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';

const VerifiedBadge = ({ size = 14, className = "" }) => {
  return (
    <div className={`relative inline-flex items-center justify-center group ${className}`}>
      {/* Outer Pulse Effect */}
      <div className="absolute inset-0 bg-accent/30 rounded-full animate-ping group-hover:bg-accent/50 transition-colors"></div>
      
      {/* The Badge */}
      <FaCheckCircle 
        size={size} 
        className="text-accent relative z-10 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-in zoom-in duration-500" 
      />
    </div>
  );
};

export default VerifiedBadge;
