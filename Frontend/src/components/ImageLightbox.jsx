import { useState, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ImageLightbox = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]); // Re-bind if needed, or just [] is fine if we use functional updates

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-sm">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white z-10 p-2"
      >
        <FaTimes size={30} />
      </button>

      {images.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-4 text-white/70 hover:text-white z-10 p-2 bg-black/20 rounded-full hover:bg-black/40 transition-colors"
          >
            <FaChevronLeft size={30} />
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-4 text-white/70 hover:text-white z-10 p-2 bg-black/20 rounded-full hover:bg-black/40 transition-colors"
          >
            <FaChevronRight size={30} />
          </button>
        </>
      )}

      <div className="relative max-w-7xl max-h-screen p-4 flex flex-col items-center">
        <img 
          src={images[currentIndex]} 
          alt={`View ${currentIndex + 1}`} 
          className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl"
        />
        <div className="mt-4 text-white/80 font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
};

export default ImageLightbox;
