import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="w-full bg-surface border-t border-border-main/50 py-6 md:py-8 mt-auto">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="text-text-muted text-xs md:text-sm font-medium">
            © {new Date().getFullYear()} Innobytes. Built for P Connect.
          </div>
          
          <div className="flex gap-4 md:gap-6">
            <a href="#" className="text-text-muted hover:text-accent transition-all hover:scale-110"><FaGithub size={18} /></a>
            <a href="#" className="text-text-muted hover:text-accent transition-all hover:scale-110"><FaTwitter size={18} /></a>
            <a href="#" className="text-text-muted hover:text-accent transition-all hover:scale-110"><FaLinkedin size={18} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
