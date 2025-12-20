import { useState, useEffect } from 'react';
import api from '../services/api';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import StoryBar from '../components/StoryBar';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ... (rest is same, skipping to render)
  
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await api.get('/posts');
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 animate-in fade-in duration-700">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Syncing Feed</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <StoryBar />
      <CreatePost onPostCreated={handlePostCreated} />
      <div className="space-y-6 pb-20">
        {posts.map(post => (
          <PostCard 
            key={post._id} 
            post={post} 
            onDelete={handlePostDeleted}
            onUpdate={handlePostUpdated}
          />
        ))}
        {posts.length === 0 && (
          <div className="card text-center py-20 border-dashed border-white/5">
            <p className="text-slate-500 font-medium">No one has shared anything yet. Why not be the first?</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
