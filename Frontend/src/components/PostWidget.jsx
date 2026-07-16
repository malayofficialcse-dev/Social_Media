import { useState, useEffect } from 'react';
import { FaPoll, FaHourglassHalf, FaQuestionCircle, FaCheck, FaChevronRight } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';

const PostWidget = ({ widget, postId, onUpdate, context = 'post' }) => {
  const [voted, setVoted] = useState(false);
  const [pollData, setPollData] = useState(widget?.poll);
  const [qaAnswers, setQaAnswers] = useState(widget?.qa?.answers || []);
  const [qaInput, setQaInput] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (widget?.type === 'poll' && widget.poll) {
      // Check if user has already voted (this would ideally come from the post object)
      // For now we rely on the backend check, but we can optimistically set it if we track it
    }

    if (widget?.type === 'countdown' && widget.countdown?.targetDate) {
      const timer = setInterval(() => {
        const target = new Date(widget.countdown.targetDate).getTime();
        const now = new Date().getTime();
        const difference = target - now;

        if (difference < 0) {
          setTimeLeft('Event Started!');
          clearInterval(timer);
        } else {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [widget]);

  const handleVote = async (optionIndex) => {
    try {
      const endpoint = context === 'story' ? `/stories/${postId}/vote` : `/posts/${postId}/vote`;
      const { data } = await api.post(endpoint, { optionIndex });
      if (data.success) {
        const updatedWidget = context === 'story' ? data.story.widget : data.post.widget;
        setPollData(updatedWidget.poll);
        setVoted(true);
        toast.success("Vote recorded!");
        if (onUpdate) onUpdate(context === 'story' ? data.story : data.post);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Voting failed");
    }
  };

  const handleAnswerQA = async () => {
    if (!qaInput.trim()) return;
    try {
      const endpoint = context === 'story' ? `/stories/${postId}/answer-qa` : `/posts/${postId}/answer-qa`;
      const { data } = await api.post(endpoint, { text: qaInput });
      if (data.success) {
        const updatedWidget = context === 'story' ? data.story.widget : data.post.widget;
        setQaAnswers(updatedWidget.qa.answers);
        setQaInput('');
        toast.success("Answer posted!");
        if (onUpdate) onUpdate(context === 'story' ? data.story : data.post);
      }
    } catch (error) {
      toast.error("Failed to post answer");
    }
  };

  if (!widget) return null;

  return (
    <div className="mt-4 p-5 rounded-[2rem] bg-surface/30 border border-border-main/20 backdrop-blur-md overflow-hidden relative group">
      {/* Decorative background element */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>

      {widget.type === 'poll' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/10 rounded-xl text-accent">
              <FaPoll size={18} />
            </div>
            <h4 className="font-black text-text-main tracking-tight">{widget.poll.question}</h4>
          </div>
          <div className="space-y-2">
            {pollData.options.map((option, index) => {
              const totalVotes = pollData.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
              const percentage = totalVotes > 0 ? Math.round((option.votes?.length || 0) / totalVotes * 100) : 0;
              
              return (
                <button
                  key={index}
                  onClick={() => !voted && handleVote(index)}
                  disabled={voted}
                  className={`relative w-full p-4 rounded-2xl border transition-all text-left overflow-hidden group/opt ${voted ? 'border-border-main/40 cursor-default' : 'border-border-main hover:border-accent/40 active:scale-[0.98]'}`}
                >
                  {voted && (
                    <div 
                      className="absolute inset-y-0 left-0 bg-accent/10 transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  )}
                  <div className="relative flex items-center justify-between">
                    <span className={`font-bold text-sm ${voted ? 'text-text-main' : 'text-text-muted group-hover/opt:text-text-main transition-colors'}`}>
                      {option.text}
                    </span>
                    {voted && (
                      <span className="text-xs font-black text-accent">{percentage}%</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {voted && (
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-center mt-2">
              {pollData.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0)} Total Votes
            </p>
          )}
        </div>
      )}

      {widget.type === 'countdown' && (
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
             <FaHourglassHalf className="animate-pulse" /> {widget.countdown.label || 'Coming Soon'}
          </div>
          <div className="text-3xl md:text-4xl font-black text-text-main tracking-tighter tabular-nums drop-shadow-sm">
            {timeLeft}
          </div>
        </div>
      )}

      {widget.type === 'qa' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
              <FaQuestionCircle size={18} />
            </div>
            <h4 className="font-black text-text-main tracking-tight">{widget.qa.question}</h4>
          </div>
          
          <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {qaAnswers.map((answer, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-2xl bg-bg-main/40 border border-border-main/10 animate-in slide-in-from-bottom-2 duration-300">
                <img src={answer.user?.profileImage || `https://ui-avatars.com/api/?name=${answer.user?.username}`} className="w-6 h-6 rounded-full border border-border-main" alt="" />
                <div className="flex-1">
                  <p className="text-[10px] font-black text-accent uppercase">{answer.user?.username}</p>
                  <p className="text-xs text-text-main font-medium">{answer.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-2">
            <input 
              type="text" 
              placeholder="Ask or answer..."
              value={qaInput}
              onChange={(e) => setQaInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnswerQA()}
              className="w-full pl-4 pr-12 py-3 bg-bg-main/60 border border-border-main/50 rounded-2xl text-xs font-bold text-text-main focus:outline-none focus:border-accent/40 transition-all placeholder:text-text-muted/50"
            />
            <button 
              onClick={handleAnswerQA}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-accent text-white rounded-xl shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
            >
              <FaChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostWidget;
