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
    return <div className="flex justify-center pt-10 text-accent">Loading...</div>;
  }

  return (
    <div>
      <StoryBar />
      <CreatePost onPostCreated={handlePostCreated} />
      <div className="space-y-4">
        {posts.map(post => (
          <PostCard 
            key={post._id} 
            post={post} 
            onDelete={handlePostDeleted}
            onUpdate={handlePostUpdated}
          />
        ))}
        {posts.length === 0 && (
          <p className="text-center text-slate-500 mt-10">No posts yet. Be the first to post!</p>
        )}
      </div>
    </div>
  );
};

export default Home;
