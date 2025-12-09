import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaComment, FaRetweet, FaTrash, FaEdit } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

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
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);

  const isOwner = user?._id === post.author_id._id;

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await api.post(`/comments/${post._id}`, { content: commentText });
      setCommentsCount(prev => prev + 1);
      setCommentText('');
      toast.success("Comment added!");
      // Optionally fetch comments to display them, but for now just increment count
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
        toast.error("Error deleting post");
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

  const displayPost = post.isRepost ? post.originalPost : post;
  
  if (!displayPost) return null; // Handle case where original post is deleted

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
            {isOwner && !post.isRepost && (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(!isEditing)} className="text-slate-500 hover:text-accent">
                  <FaEdit />
                </button>
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
              {displayPost.image && (
                <img 
                  src={displayPost.image} 
                  alt="Post content" 
                  className="mt-3 rounded-lg w-full h-auto"
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
              onClick={() => setShowComments(!showComments)}
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

          {showComments && (
            <div className="mt-4 border-t border-slate-800 pt-4">
              <form onSubmit={handleComment} className="flex gap-2">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
