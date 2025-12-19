import { motion } from 'framer-motion';
import { FaGithub, FaLinkedin, FaTwitter, FaEnvelope } from 'react-icons/fa';
import image1 from '../assets/Screenshot 2025-12-19 230324.png';
import image2 from '../assets/Screenshot 2025-12-19 230348.png';
import image3 from '../assets/Screenshot 2025-12-19 230526.png';
import image4 from '../assets/Screenshot 2025-12-19 230611.png';

const About = () => {
  const team = [
    {
      name: "Jyotirmoyee Maity",
      role: "Lead Developer & Visionary",
      image: image1,
      bio: "Crafting digital experiences with passion and precision.",
      socials: { github: "#", linkedin: "#", twitter: "#" }
    },
    {
      name: "Misha Samanta",
      role: "Product Designer",
      image: image2,
      bio: "Specializing in intuitive UI/UX and visual storytelling.",
      socials: { github: "#", linkedin: "#", twitter: "#" }
    },
    {
      name: "Subhrojyoti Chowdhury",
      role: "Project Designer",
      image: image3,
      bio: "Ensuring scalability and performance at every layer.",
      socials: { github: "#", linkedin: "#", twitter: "#" }
    },
    {
      name: "Malay Maity",
      role: "Full Stack Developer",
      image: image4,
      bio: "Bringing designs to life with smooth animations.",
      socials: { github: "#", linkedin: "#", twitter: "#" }
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="py-16 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -z-10" />

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center mb-24 px-6"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-block mb-4 px-4 py-1 rounded-full border border-accent/30 bg-accent/5 text-accent text-sm font-semibold tracking-wider uppercase"
        >
          Our Story
        </motion.div>
        <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent tracking-tight">
          P Connect
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
          Redefining social connectivity for the modern age. A space where 
          privacy meets innovation, and connections become meaningful.
        </p>
      </motion.div>

      {/* Team Section */}
      <div className="px-6">
        <div className="flex flex-col items-center mb-16">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-white mb-4"
          >
            Meet the Visionaries
          </motion.h2>
          <div className="w-20 h-1 bg-accent rounded-full" />
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10"
        >
          {team.map((member, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -15 }}
              className="group relative"
            >
              <div className="relative bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-accent/30 hover:shadow-[0_20px_50px_rgba(6,182,212,0.15)] group-hover:bg-slate-900/60">
                {/* Image Wrap */}
                <div className="p-4">
                  <div className="aspect-[4/5] rounded-[2rem] overflow-hidden relative shadow-inner">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Overlay Socials */}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center pb-8 translate-y-4 group-hover:translate-y-0">
                      <div className="flex gap-4 p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                        <a href={member.socials.github} className="p-2 text-white hover:text-accent transition-colors"><FaGithub size={22} /></a>
                        <a href={member.socials.linkedin} className="p-2 text-white hover:text-accent transition-colors"><FaLinkedin size={22} /></a>
                        <a href={member.socials.twitter} className="p-2 text-white hover:text-accent transition-colors"><FaTwitter size={22} /></a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-8 pb-10 pt-2 text-center">
                  <h3 className="text-2xl font-bold text-white mb-2 transition-colors group-hover:text-accent">
                    {member.name}
                  </h3>
                  <div className="text-accent/80 text-sm font-semibold mb-4 tracking-tighter uppercase">
                    {member.role}
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed font-light line-clamp-2">
                    {member.bio}
                  </p>
                </div>
              </div>

              {/* Decorative background glow on hover */}
              <div className="absolute -inset-2 bg-gradient-to-r from-accent/20 to-blue-500/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Stats/Values Section */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-8 px-6"
      >
        {[
          { title: "Privacy First", desc: "Your data belongs to you. We ensure end-to-end security and full control over your digital footprint." },
          { title: "Real Interaction", desc: "Moving beyond likes and shares to foster genuine human connections in a digital landscape." },
          { title: "Open Source", desc: "Built with transparency in mind. Empowering developers to build a better web together." }
        ].map((item, i) => (
          <div key={i} className="p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl hover:bg-white/[0.08] transition-colors">
            <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
            <p className="text-slate-400 leading-relaxed font-light">{item.desc}</p>
          </div>
        ))}
      </motion.div>

      {/* CTA Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-40 text-center px-6 relative"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-accent/5 rounded-full blur-[150px] -z-10" />
        <h2 className="text-4xl font-bold text-white mb-8">Ready to Connect?</h2>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(6,182,212,0.3)" }}
          whileTap={{ scale: 0.95 }}
          className="bg-accent hover:bg-accent-hover text-white px-12 py-5 rounded-2xl text-lg font-bold transition-all duration-300 flex items-center gap-3 mx-auto shadow-2xl shadow-accent/20"
        >
          Join the Movement <FaEnvelope />
        </motion.button>
      </motion.div>
    </div>
  );
};

export default About;

