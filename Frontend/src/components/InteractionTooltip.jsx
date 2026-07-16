import React from 'react';
import { Link } from 'react-router-dom';

const InteractionTooltip = ({ users, title, children }) => {
  if (!users || users.length === 0) return children;

  return (
    <div className="relative group/tooltip">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 rounded-xl overflow-hidden shadow-2xl border border-white/10 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="bg-slate-700/50 px-3 py-1.5 border-b border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
        </div>
        <div className="max-h-40 overflow-y-auto p-1.5 custom-scrollbar">
          {users.map((u, i) => (
            <Link 
              key={i} 
              to={`/profile/${u._id}`}
              className="flex items-center gap-2.5 p-1.5 hover:bg-white/5 rounded-lg transition-colors pointer-events-auto"
            >
              <img 
                src={u.profileImage || `https://ui-avatars.com/api/?name=${u.username}&background=random`} 
                className="w-6 h-6 rounded-full object-cover border border-white/10"
                alt={u.username}
              />
              <span className="text-xs font-bold text-white truncate">{u.username}</span>
            </Link>
          ))}
          {users.length > 10 && (
            <p className="text-[9px] text-center text-slate-500 py-1 italic">and {users.length - 10} more...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractionTooltip;
