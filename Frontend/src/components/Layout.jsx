import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Pages that don't need the dashboard sidebars
  const isPublicPage = ['/login', '/register', '/about', '/contact'].includes(location.pathname);
  const showSidebars = user && !isPublicPage;

  return (
    <div className="min-h-screen bg-dark text-slate-200 flex flex-col font-sans">
      <Header />
      
      <div className="flex flex-1 relative">
        {showSidebars && <Sidebar />}
        
        <main className={`flex-1 p-4 md:p-6 transition-all duration-300 ${showSidebars ? 'md:ml-64 lg:mr-80' : 'container mx-auto'}`}>
          <div className="max-w-3xl mx-auto min-h-[calc(100vh-200px)]">
            <Outlet />
          </div>
        </main>
        
        {showSidebars && <RightSidebar />}
      </div>

      <Footer />
    </div>
  );
};

export default Layout;
