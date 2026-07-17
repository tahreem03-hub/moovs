import { Image, Info, Star } from 'lucide-react'
import { createPortal } from "react-dom";
import React, { useState } from 'react'
import ImageCard from './ImageCard';
import UploadCard from './UploadCard';

const Photos = ({ formData, setFormData }) => {

  const MAX_IMAGES = 6;


  const [info, setInfo] = useState(false);
  const [images, setImages] = useState([]);


  const handleUpload = (e) => {
    const files = Array.from(e.target.files);

    const newImages = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file)
    }));

    setFormData(prev => ({
      ...prev,
      images: [
        ...prev.images,
        ...newImages
      ].slice(0, MAX_IMAGES)
    }));
  };

  const removeImage = (id) => {

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== id)
    }));
  };


  return (
    <div className='relative'>
      {info && createPortal(
        <div className="fixed top-25 left-20 z-[999] bg-gray-900 text-xs text-white px-3 py-2 rounded w-64">
          Drag to reorder photos. The first photo is your featured image.
        </div>,
        document.body
      )}

      <div>
        <div className='flex items-center'>

          <h1 className='text-black/90 font-bold text-xl'>
            Photos
          </h1>


          <Info
            className='h-4 w-4 text-gray-800 ml-2 hover:text-blue-600'
            onMouseEnter={() => setInfo(true)}
            onMouseLeave={() => setInfo(false)}
            strokeWidth={1.5}
          />
        </div>

        <h1 className='text-gray-800 text-xs'>.jpg and .png files</h1>
      </div>

      {/* imgaes input */}

      <div className="flex flex-wrap gap-5 mt-4">
        {formData.images.map((image, index) => (
          <ImageCard
            key={image.id}
            image={image}
            index={index}
            onRemove={removeImage}
          />
        ))}

        {formData.images.length < MAX_IMAGES && (
          <UploadCard onUpload={handleUpload}
            length={formData.images.length}
          />
        )}
      </div>


    </div>
  )
}

{/* more functionality has to be added like drag and drop images primary secondary images etc */ }

export default Photos
