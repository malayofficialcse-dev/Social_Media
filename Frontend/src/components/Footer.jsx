import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-surface border-t border-slate-800 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-400 text-sm">
            © {new Date().getFullYear()} Innobytes. All rights reserved.
          </div>
          
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-accent transition-colors"><FaGithub size={20} /></a>
            <a href="#" className="text-slate-400 hover:text-accent transition-colors"><FaTwitter size={20} /></a>
            <a href="#" className="text-slate-400 hover:text-accent transition-colors"><FaLinkedin size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
