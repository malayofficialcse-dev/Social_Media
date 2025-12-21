import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import StoryBar from '../components/StoryBar';
import { FaExpand, FaCompress, FaLayerGroup } from 'react-icons/fa';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [focusedPostId, setFocusedPostId] = useState(null);
  const observer = useRef(null);

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

  useEffect(() => {
    if (focusMode) {
      observer.current = new IntersectionObserver((entries) => {
        let bestEntry = null;
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
              bestEntry = entry;
            }
          }
        });
        if (bestEntry) {
          setFocusedPostId(bestEntry.target.getAttribute('data-id'));
        }
      }, {
        threshold: [0.1, 0.5, 0.8, 0.9],
        rootMargin: '-5% 0px -5% 0px'
      });

      const elements = document.querySelectorAll('.PostCard_wrapper');
      elements.forEach(el => observer.current.observe(el));
    } else {
      if (observer.current) observer.current.disconnect();
      setFocusedPostId(null);
    }

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [focusMode, posts]);

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
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4 shadow-lg shadow-accent/10"></div>
        <p className="text-text-muted font-bold uppercase tracking-[0.2em] text-xs">Syncing Feed</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <StoryBar />
      <CreatePost onPostCreated={handlePostCreated} />
      
      <div className="flex items-center justify-between mt-8 mb-2 px-2">
        <div className="flex items-center gap-2">
           <FaLayerGroup className="text-accent" />
           <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Personalized Feed</span>
        </div>
        <button 
          onClick={() => setFocusMode(!focusMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${focusMode ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-surface/50 text-text-muted hover:text-accent border border-border-main'}`}
        >
          {focusMode ? <><FaCompress /> Focus Active</> : <><FaExpand /> Cinematic Mode</>}
        </button>
      </div>

      <div className={`space-y-6 pb-20 transition-all duration-500 ${focusMode ? 'focus-active' : ''}`}>
        {posts.map(post => (
          <div 
            key={post._id} 
            data-id={post._id}
            className={`PostCard_wrapper transition-all duration-500 ${focusedPostId === post._id ? 'focused-post' : ''}`}
          >
            <PostCard 
              post={post} 
              onDelete={handlePostDeleted}
              onUpdate={handlePostUpdated}
            />
          </div>
        ))}
        {posts.length === 0 && (
          <div className="card text-center py-20 border-dashed border-border-main">
            <p className="text-text-muted font-medium">No one has shared anything yet. Why not be the first?</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
