
import { Bus, Car, Van, ChevronDown, Search } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'

const OptionalInfo = ({ formData, setFormData }) => {

  const handleChange = (e) => {
    setFormData( prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }
  return (
    <div>
      <h1 className='text-black/90 text-xl font-bold'>Optional Info</h1>

      

        <input type="text"
          name='licenseNo'
          value={formData.licenseNo}
          onChange={handleChange}
          className='mt-3 hover:border-black outline-none focus:border-blue-600 focus:border-2 border border-gray-500/50 w-full h-13 rounded p-4'
          placeholder='License Plate #' />

        <input type="text"
          name='description'
          onChange={handleChange}
          value={formData.description}
          className='mt-3 hover:border-black outline-none focus:border-blue-600 focus:border-2 border border-gray-500/50 w-full h-30 rounded p-4'
          placeholder='Description' />


        <input type="text"
          name='exteriorColor'
          value={formData.exteriorColor}
          onChange={handleChange}
          className='mt-3 hover:border-black outline-none focus:border-blue-600 focus:border-2 border border-gray-500/50 w-full h-13 rounded p-4'
          placeholder='Exterior Color' />


        <input type="text"
          name='vinNumber'
          value={formData.vinNumber}
          onChange={handleChange}
          className='mt-3 hover:border-black outline-none focus:border-blue-600 focus:border-2 border border-gray-500/50 w-full h-13 rounded p-4'
          placeholder='VIN Number' />



        {/* need fixation it will show calcellation and insurance policy that operatpr will add file in setiing and thirs feature is pro */}
        {/* <input type="text"
          className='mt-3 hover:border-black outline-none focus:border-blue-600 focus:border-2 border border-gray-500/50 w-full h-13 rounded p-4'
          placeholder='VIN Number' />
           <input type="text"
          className='mt-3 hover:border-black outline-none focus:border-blue-600 focus:border-2 border border-gray-500/50 w-full h-13 rounded p-4'
          placeholder='VIN Number' /> <input type="text"
          className='mt-3 hover:border-black outline-none focus:border-blue-600 focus:border-2 border border-gray-500/50 w-full h-13 rounded p-4'
          placeholder='VIN Number' />*/}


    </div>
  )
}

export default OptionalInfo
