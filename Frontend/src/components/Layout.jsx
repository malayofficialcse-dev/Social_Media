import { Outlet, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Layout = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  
  // Pages that don't need the dashboard sidebars
  const isPublicPage = ['/login', '/register', '/about', '/contact'].includes(location.pathname);
  const showSidebars = user && !isPublicPage;

  return (
    <div className="min-h-screen bg-bg-main text-text-main flex flex-col font-sans transition-colors duration-300">
      <Header />
      
      <div className="flex flex-1 relative w-full overflow-x-hidden">
        {showSidebars && <Sidebar />}
        
        <main className={`flex-1 transition-all duration-300 w-full ${showSidebars ? 'md:ml-64 xl:mr-80' : ''}`}>
          <div className={`p-4 md:p-8 ${isPublicPage ? 'max-w-7xl' : 'max-w-4xl'} mx-auto min-h-[calc(100vh-200px)] w-full`}>
            <Outlet />
          </div>
        </main>
        
        {showSidebars && <RightSidebar />}
      </div>

      <Footer />
      <ToastContainer theme={theme} position="bottom-right" />
    </div>
  );
};

export default Layout;
