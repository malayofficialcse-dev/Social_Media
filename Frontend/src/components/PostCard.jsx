import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaComment, FaRetweet, FaTrash, FaEdit } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import ImageLightbox from './ImageLightbox';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=1e293b&color=fff&size=200';

const PostCard = ({ post, onDelete, onUpdate }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.likes.includes(user?._id));
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [reposted, setReposted] = useState(post.reposts.includes(user?._id));
  const [repostsCount, setRepostsCount] = useState(post.reposts.length);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [loadingComments, setLoadingComments] = useState(false);

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
      toast.success("Comment added!");
      // Update local state immediately
      setComments(prev => [data, ...prev]);
      setCommentsCount(prev => prev + 1);
      // Also update post.lastComments if needed (optional, but good for UI consistency)
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding comment");
    }
  };

  const handleLike = async () => {
    try {
      if (liked) {
        await api.put(`/posts/${post._id}/unlike`);
        setLikesCount(prev => prev - 1);
      } else {
        await api.put(`/posts/${post._id}/like`);
        setLikesCount(prev => prev + 1);
      }
      setLiked(!liked);
    } catch (error) {
      console.error("Error liking post", error);
    }
  };

  const handleRepost = async () => {
    try {
      if (reposted) return; // Already reposted
      await api.post(`/posts/${post._id}/repost`);
      setReposted(true);
      setRepostsCount(prev => prev + 1);
      toast.success("Post reposted!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error reposting");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await api.delete(`/posts/${post._id}`);
        onDelete(post._id);
        toast.success("Post deleted");
      } catch (error) {
        console.error(error);
        toast.error("Error deleting post");
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        await api.delete(`/comments/${commentId}`);
        setComments(comments.filter(c => c._id !== commentId));
        setCommentsCount(prev => prev - 1);
        toast.success("Comment deleted");
      } catch (error) {
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
    } catch (error) {
      toast.error("Error updating post");
    }
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const displayPost = post.isRepost ? post.originalPost : post;
  
  if (!displayPost) return null; // Handle case where original post is deleted

  // Determine which comments to show
  // If showComments is true, show 'comments' state (fetched from API)
  // If showComments is false, show 'post.lastComments' (passed from parent/backend)
  const visibleComments = showComments ? comments : (post.lastComments || []);

  return (
    <div className="card mb-4 hover:bg-slate-800/50 transition-colors">
      {post.isRepost && (
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-2 ml-2">
          <FaRetweet />
          <span>{post.author_id.username} reposted</span>
        </div>
      )}
      
      <div className="flex gap-4">
        <Link to={`/profile/${displayPost.author_id._id}`}>
          <img 
            src={displayPost.author_id.profileImage || "https://via.placeholder.com/40"} 
            alt="Profile" 
            className="w-12 h-12 rounded-full object-cover"
            onError={(e) => { e.target.src = "https://via.placeholder.com/40"; }}
          />
        </Link>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to={`/profile/${displayPost.author_id._id}`} className="font-bold text-white hover:underline">
                {displayPost.author_id.username}
              </Link>
              <span className="text-slate-500 text-sm">
                {formatDistanceToNow(new Date(displayPost.createdAt), { addSuffix: true })}
              </span>
            </div>
            {(isOwner || isAdmin) && !post.isRepost && (
              <div className="flex gap-2">
                {isOwner && (
                  <button onClick={() => setIsEditing(!isEditing)} className="text-slate-500 hover:text-accent">
                    <FaEdit />
                  </button>
                )}
                <button onClick={handleDelete} className="text-slate-500 hover:text-red-500">
                  <FaTrash />
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2">
              <textarea 
                value={editContent} 
                onChange={(e) => setEditContent(e.target.value)}
                className="input-field mb-2"
                rows="3"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="btn btn-secondary text-sm">Cancel</button>
                <button onClick={handleUpdate} className="btn btn-primary text-sm">Save</button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-bold mt-1 mb-2">{displayPost.title}</h3>
              <p className="text-slate-300 whitespace-pre-wrap">{displayPost.content}</p>
              {displayPost.images && displayPost.images.length > 0 ? (
                <div className={`grid gap-1 mt-3 rounded-lg overflow-hidden ${
                  displayPost.images.length === 1 ? 'grid-cols-1' : 
                  'grid-cols-2'
                }`}>
                  {displayPost.images.slice(0, 4).map((img, index) => (
                    <div key={index} className={`relative cursor-pointer ${
                      displayPost.images.length === 3 && index === 0 ? 'col-span-2' : ''
                    } ${displayPost.images.length === 1 ? '' : 'h-48'}`}
                    onClick={() => openLightbox(index)}
                    >
                      <img 
                        src={img} 
                        alt={`Post content ${index}`} 
                        className={`w-full h-full object-cover ${displayPost.images.length === 1 ? 'max-h-[500px]' : ''}`}
                      />
                      {displayPost.images.length > 4 && index === 3 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl">
                          +{displayPost.images.length - 4}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : displayPost.image && (
                <img 
                  src={displayPost.image} 
                  alt="Post content" 
                  className="mt-3 rounded-lg w-full h-auto max-h-[500px] object-cover cursor-pointer"
                  onClick={() => openLightbox(0)}
                  onError={(e) => { e.target.style.display = 'none'; }} 
                />
              )}
            </>
          )}

          <div className="flex items-center gap-6 mt-4 text-slate-500">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-2 hover:text-red-500 transition-colors ${liked ? 'text-red-500' : ''}`}
            >
              {liked ? <FaHeart /> : <FaRegHeart />}
              <span>{likesCount}</span>
            </button>
            
            <button 
              onClick={toggleComments}
              className="flex items-center gap-2 hover:text-accent transition-colors"
            >
              <FaComment />
              <span>{commentsCount}</span> 
            </button>
            
            <button 
              onClick={handleRepost}
              className={`flex items-center gap-2 hover:text-green-500 transition-colors ${reposted ? 'text-green-500' : ''}`}
            >
              <FaRetweet />
              <span>{repostsCount}</span>
            </button>
          </div>

          {/* Always show comments section if there are comments or if user wants to add one */}
          <div className="mt-4 border-t border-slate-800 pt-4">
            {/* Input always visible if showComments is true OR if we want to allow quick comment? 
                User requirement: "always last 2 comment will be always visible at the the below of the image"
                Let's keep the input hidden unless showComments is true, to save space? 
                Or maybe just show the comments list.
            */}
            
            {showComments && (
              <form onSubmit={handleComment} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-slate-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button 
                  type="submit" 
                  disabled={!commentText.trim()}
                  className="text-accent font-bold disabled:opacity-50"
                >
                  Post
                </button>
              </form>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {loadingComments ? (
                <p className="text-center text-slate-500 text-sm">Loading comments...</p>
              ) : visibleComments.length > 0 ? (
                <>
                  {visibleComments.map((comment) => (
                    <div key={comment._id} className="flex gap-3 bg-slate-800/50 rounded-lg p-3 group">
                      <Link to={`/profile/${comment.author_id._id}`}>
                        <img 
                          src={comment.author_id.profileImage || DEFAULT_AVATAR} 
                          alt={comment.author_id.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Link 
                              to={`/profile/${comment.author_id._id}`}
                              className="font-medium text-white hover:underline text-sm"
                            >
                              {comment.author_id.username}
                            </Link>
                            <span className="text-xs text-slate-500">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          {(user?._id === comment.author_id._id || isAdmin) && (
                            <button 
                              onClick={() => handleDeleteComment(comment._id)}
                              className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FaTrash size={12} />
                            </button>
                          )}
                        </div>
                        <p className="text-slate-300 text-sm mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {!showComments && commentsCount > 2 && (
                    <button 
                      onClick={toggleComments}
                      className="text-sm text-slate-500 hover:text-accent w-full text-left pl-2"
                    >
                      View all {commentsCount} comments
                    </button>
                  )}
                </>
              ) : showComments ? (
                <p className="text-center text-slate-500 text-sm">No comments yet. Be the first to comment!</p>
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
    </div>
  );
};

export default PostCard;
