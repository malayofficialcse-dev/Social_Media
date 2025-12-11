import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import { FaTimes, FaCheck, FaUndo, FaRedo } from 'react-icons/fa';

const ImageCropper = ({ image, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onRotationChange = (rotation) => {
    setRotation(rotation);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = useCallback(async () => {
    try {
      const croppedImage = await getCroppedImg(
        image,
        croppedAreaPixels,
        rotation
      );
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  }, [image, croppedAreaPixels, rotation, onCropComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="relative w-full max-w-2xl h-[80vh] bg-slate-800 rounded-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h3 className="text-white font-bold">Edit Image</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <FaTimes size={24} />
          </button>
        </div>
        
        <div className="relative flex-1 bg-black">
          <Cropper
            image={image}
            crop={crop}
            rotation={rotation}
            zoom={zoom}
            aspect={4 / 3}
            onCropChange={onCropChange}
            onRotationChange={onRotationChange}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="p-4 bg-slate-800 space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm w-16">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              className="flex-1 accent-accent"
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm w-16">Rotate</span>
            <input
              type="range"
              value={rotation}
              min={0}
              max={360}
              step={1}
              aria-labelledby="Rotation"
              onChange={(e) => setRotation(e.target.value)}
              className="flex-1 accent-accent"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={onCancel}
              className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={showCroppedImage}
              className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors flex items-center gap-2"
            >
              <FaCheck /> Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
