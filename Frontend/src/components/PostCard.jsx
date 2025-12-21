import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaComment, FaRetweet, FaTrash, FaEdit } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import ImageLightbox from './ImageLightbox';
import InteractionTooltip from './InteractionTooltip';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=1e293b&color=fff&size=200';

const PostCard = ({ post, onDelete, onUpdate }) => {
  const { user } = useAuth();
  
  // Interaction states
  const [liked, setLiked] = useState(post.likes?.some(l => (l._id || l) === user?._id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [reposted, setReposted] = useState(post.reposts?.some(r => (r._id || r) === user?._id));
  const [repostsCount, setRepostsCount] = useState(post.reposts?.length || 0);
  
  // UI states
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [loadingComments, setLoadingComments] = useState(false);

  // Interaction lists for tooltips
  const [localLikes, setLocalLikes] = useState(post.likes || []);
  const [localReposts, setLocalReposts] = useState(post.reposts || []);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const isOwner = user?._id === post.author_id._id;
  const isAdmin = user?.role === 'admin';

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const { data } = await api.get(`/comments/${post._id}`);
      setComments(data);
      setCommentsCount(data.length);
    } catch (error) {
      console.error("Error fetching comments", error);
    }
    setLoadingComments(false);
  };

  const toggleComments = () => {
    if (!showComments && comments.length === 0) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const { data } = await api.post(`/comments/${post._id}`, { content: commentText });
      setCommentText('');
      toast.success("Comment shared");
      setComments(prev => [data, ...prev]);
      setCommentsCount(prev => prev + 1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding comment");
    }
  };

  const handleLike = async () => {
    try {
      if (liked) {
        await api.put(`/posts/${post._id}/unlike`);
        setLikesCount(prev => prev - 1);
        setLocalLikes(prev => prev.filter(l => (l._id || l) !== user?._id));
      } else {
        await api.put(`/posts/${post._id}/like`);
        setLikesCount(prev => prev + 1);
        setLocalLikes(prev => [...prev, { _id: user._id, username: user.username, profileImage: user.profileImage }]);
      }
      setLiked(!liked);
    } catch (error) {
      console.error("Error liking post", error);
    }
  };

  const handleRepost = async () => {
    try {
      if (reposted) return;
      await api.post(`/posts/${post._id}/repost`);
      setReposted(true);
      setRepostsCount(prev => prev + 1);
      setLocalReposts(prev => [...prev, { _id: user._id, username: user.username, profileImage: user.profileImage }]);
      toast.success("Shared to your feed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error reposting");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Remove this post permanently?")) {
      try {
        await api.delete(`/posts/${post._id}`);
        onDelete(post._id);
        toast.success("Post removed");
    } catch {
      toast.error("Error deleting post");
    }
  }
};

const handleDeleteComment = async (commentId) => {
  if (window.confirm("Remove this comment?")) {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(comments.filter(c => c._id !== commentId));
      setCommentsCount(prev => prev - 1);
      toast.success("Comment removed");
    } catch {
      toast.error("Error deleting comment");
    }
  }
};

  const handleUpdate = async () => {
    try {
      const { data } = await api.put(`/posts/${post._id}`, { content: editContent });
      onUpdate(data);
      setIsEditing(false);
      toast.success("Post updated");
    } catch {
      toast.error("Error updating post");
    }
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const displayPost = post.isRepost ? post.originalPost : post;
  
  if (!displayPost) return null;

  const visibleComments = showComments ? comments : (post.lastComments || []);

  return (
    <article className="card mb-6 overflow-hidden border-border-main hover:border-accent/20 group/card bg-card">
      {post.isRepost && (
        <div className="flex items-center gap-2 text-text-muted text-[11px] font-black uppercase tracking-wider mb-4 px-1">
          <FaRetweet className="text-green-500" />
          <span>{post.author_id.username} Shared</span>
        </div>
      )}
      
      <div className="flex gap-4">
        <Link to={`/profile/${displayPost.author_id._id}`} className="shrink-0">
          <div className="relative">
            <img 
              src={displayPost.author_id.profileImage || "https://via.placeholder.com/48"} 
              alt="Profile" 
              className="w-12 h-12 rounded-full object-cover border-2 border-border-main shadow-lg group-hover/card:border-accent transition-colors"
              onError={(e) => { e.target.src = "https://via.placeholder.com/48"; }}
            />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-surface rounded-full"></div>
          </div>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Link to={`/profile/${displayPost.author_id._id}`} className="font-black text-text-main hover:text-accent transition-colors truncate max-w-[150px] sm:max-w-[250px]">
                {displayPost.author_id.username}
              </Link>
              <span className="w-1 h-1 rounded-full bg-border-main"></span>
              <span className="text-text-muted text-[11px] font-medium">
                {formatDistanceToNow(new Date(displayPost.createdAt), { addSuffix: true })}
              </span>
            </div>
            {(isOwner || isAdmin) && !post.isRepost && (
              <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                {isOwner && (
                  <button onClick={() => setIsEditing(!isEditing)} className="p-2 text-text-muted hover:text-accent hover:bg-accent/10 rounded-full transition-all">
                    <FaEdit size={14} />
                  </button>
                )}
                <button onClick={handleDelete} className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all">
                  <FaTrash size={14} />
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mt-3 animate-in fade-in slide-in-from-top-2">
              <textarea 
                value={editContent} 
                onChange={(e) => setEditContent(e.target.value)}
                className="input-field mb-3 min-h-[100px]"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsEditing(false)} className="text-sm font-bold text-text-muted hover:text-text-main px-4">Cancel</button>
                <button onClick={handleUpdate} className="btn btn-primary text-sm px-6">Save Changes</button>
              </div>
            </div>
          ) : (
            <>
              {displayPost.title && (
                <h3 className="text-lg font-black text-text-main mt-1 mb-2 tracking-tight leading-snug">{displayPost.title}</h3>
              )}
              <p className="text-text-main/90 whitespace-pre-wrap text-[15px] leading-relaxed mb-4">{displayPost.content}</p>
              
              {(displayPost.images && displayPost.images.length > 0) || displayPost.image ? (
                <div className={`mt-4 rounded-2xl overflow-hidden border border-border-main shadow-xl ${
                  displayPost.images?.length > 1 ? 'grid grid-cols-2 gap-1.5' : ''
                }`}>
                  {displayPost.images && displayPost.images.length > 0 ? (
                    displayPost.images.slice(0, 4).map((img, index) => (
                      <div 
                        key={index} 
                        className={`relative cursor-pointer group/img overflow-hidden ${
                          displayPost.images.length === 3 && index === 0 ? 'col-span-2' : ''
                        } ${displayPost.images.length === 1 ? '' : 'h-60'}`}
                        onClick={() => openLightbox(index)}
                      >
                        <img 
                          src={img} 
                          alt={`Post content ${index}`} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                        />
                        {displayPost.images.length > 4 && index === 3 && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white font-black text-2xl">
                            +{displayPost.images.length - 4}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div 
                      className="cursor-pointer group/img overflow-hidden"
                      onClick={() => openLightbox(0)}
                    >
                      <img 
                        src={displayPost.image} 
                        alt="Post content" 
                        className="w-full h-auto max-h-[600px] object-cover transition-transform duration-700 group-hover/img:scale-105"
                        onError={(e) => { e.target.style.display = 'none'; }} 
                      />
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}

          <div className="flex items-center gap-2 sm:gap-8 mt-6 pt-4 border-t border-border-main">
            <InteractionTooltip users={localLikes} title="Liked by">
              <button 
                onClick={handleLike}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${liked ? 'bg-red-500/10 text-red-500' : 'hover:bg-red-500/5 text-text-muted hover:text-red-500'}`}
              >
                {liked ? <FaHeart className="animate-in zoom-in duration-300" /> : <FaRegHeart />}
                <span className="text-sm font-black">{likesCount}</span>
              </button>
            </InteractionTooltip>
            
            <InteractionTooltip users={post.commenters} title="Commented by">
              <button 
                onClick={toggleComments}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${showComments ? 'bg-accent/10 text-accent' : 'hover:bg-accent/5 text-text-muted hover:text-accent'}`}
              >
                <FaComment />
                <span className="text-sm font-black">{commentsCount}</span> 
              </button>
            </InteractionTooltip>
            
            <InteractionTooltip users={localReposts} title="Shared by">
              <button 
                onClick={handleRepost}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${reposted ? 'bg-green-500/10 text-green-500' : 'hover:bg-green-500/5 text-text-muted hover:text-green-500'}`}
              >
                <FaRetweet className={reposted ? 'rotate-180 transition-transform duration-500' : ''} />
                <span className="text-sm font-black">{repostsCount}</span>
              </button>
            </InteractionTooltip>
          </div>

          <div className={`mt-4 space-y-4 animate-in fade-in duration-500 ${visibleComments.length > 0 ? 'pt-4 border-t border-border-main' : ''}`}>
            {showComments && (
              <form onSubmit={handleComment} className="flex gap-3 mb-6">
                <img src={user?.profileImage || DEFAULT_AVATAR} className="w-8 h-8 rounded-full border border-border-main" alt="Me" />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full bg-bg-main border border-border-main rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-accent/30 focus:ring-4 focus:ring-accent/5 transition-all outline-none text-text-main"
                  />
                  <button 
                    type="submit" 
                    disabled={!commentText.trim()}
                    className="absolute right-3 top-1.5 text-accent font-black text-[11px] uppercase tracking-wider disabled:opacity-0 transition-opacity"
                  >
                    Post
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {loadingComments ? (
                <div className="flex justify-center py-4"><span className="animate-pulse text-text-muted font-bold uppercase tracking-tighter">Loading conversation...</span></div>
              ) : visibleComments.length > 0 ? (
                <>
                  {visibleComments.map((comment) => (
                    <div key={comment._id} className="flex gap-3 animate-in slide-in-from-left-2 group/comment">
                      <Link to={`/profile/${comment.author_id._id}`}>
                        <img 
                          src={comment.author_id.profileImage || DEFAULT_AVATAR} 
                          alt={comment.author_id.username}
                          className="w-8 h-8 rounded-full object-cover border border-border-main group-hover/comment:border-accent/30 transition-colors"
                        />
                      </Link>
                      <div className="flex-1 bg-bg-main/50 rounded-2xl p-3 relative border border-border-main">
                        <div className="flex items-center justify-between mb-1">
                          <Link to={`/profile/${comment.author_id._id}`} className="font-bold text-text-main hover:text-accent transition-colors text-xs">
                            {comment.author_id.username}
                          </Link>
                          {(user?._id === comment.author_id._id || isAdmin) && (
                            <button 
                              onClick={() => handleDeleteComment(comment._id)}
                              className="text-text-muted hover:text-red-500 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                            >
                              <FaTrash size={10} />
                            </button>
                          )}
                        </div>
                        <p className="text-text-main/80 text-sm leading-relaxed">{comment.content}</p>
                        <span className="absolute -bottom-4 right-2 text-[9px] font-bold text-text-muted uppercase tracking-tighter">
                          {formatDistanceToNow(new Date(comment.createdAt))} ago
                        </span>
                      </div>
                    </div>
                  ))}
                  {!showComments && commentsCount > (post.lastComments?.length || 0) && (
                    <button 
                      onClick={toggleComments}
                      className="text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-accent transition-colors w-full py-2"
                    >
                      Show all conversation
                    </button>
                  )}
                </>
              ) : showComments ? (
                <div className="text-center py-6">
                  <p className="text-text-muted text-sm italic font-medium">Be the first to share a thought.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {lightboxOpen && (
        <ImageLightbox
          images={displayPost.images && displayPost.images.length > 0 ? displayPost.images : [displayPost.image]}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </article>
  );
};

export default PostCard;
