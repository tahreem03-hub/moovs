
import { Bus, Car, Van, ChevronDown, Search } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'

const OptionalInfo = () => {




  const handleSubmit = (e) => {
    e.preventDefault();
  }

  const vehicleType = [
    { name: "ADA Mini Coach", icon: <Bus /> },
    { name: "ADA Motor Coach", icon: <Bus /> },
    { name: "ADA Van", icon: <Van /> },
    { name: "Antique", icon: <Car /> },
    { name: "Cargo Van", icon: <Van /> },
    { name: "Hearse", icon: <Car /> },
    { name: "Limousine", icon: <Car /> },
    { name: "Mini Coach", icon: <Bus /> },
    { name: "Minivan", icon: <Van /> },
    { name: "Motor Coach", icon: <Bus /> },
    { name: "Party Bus", icon: <Bus /> },
    { name: "Party Van", icon: <Van /> },
    { name: "School Bus", icon: <Bus /> },
    { name: "Sedan", icon: <Car /> },
    { name: "Shuttle Van", icon: <Van /> },
    { name: "Sprinter Executive", icon: <Van /> },
    { name: "Sprinter Jet", icon: <Van /> },
    { name: "Sprinter Limo", icon: <Van /> },
    { name: "SUV", icon: <Car /> },
    { name: "Van", icon: <Van /> },
  ]

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const dropdownRef = useRef(null);

  // close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = vehicleType.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className='text-black/90 text-xl font-bold'>Optional Info</h1>

      <form onSubmit={handleSubmit}>

        <input type="text"
          className='mt-3 hover:border-black outline-none focus:border-blue-600 focus:border-2 border border-gray-500/50 w-full h-13 rounded p-4'
          placeholder='License Plate #' />

          <input type="text"
          className='mt-3 hover:border-black outline-none focus:border-blue-600 focus:border-2 border border-gray-500/50 w-full h-30 rounded p-4'
          placeholder='Description' />


        <input type="text"
          required
          className='mt-3 hover:border-black outline-none focus:border-blue-600 focus:border-2 border border-gray-500/50 w-full h-13 rounded p-4'
          placeholder='Exterior Color' />


           <input type="text"
          required
          className='mt-3 hover:border-black outline-none focus:border-blue-600 focus:border-2 border border-gray-500/50 w-full h-13 rounded p-4'
          placeholder='VIN Number' />



          {/* need fization it will show calcellation and insurance policy that operatpr will add file in setiing and thirs feature is pro */}
           <input type="text"
          required
          className='mt-3 hover:border-black outline-none focus:border-blue-600 focus:border-2 border border-gray-500/50 w-full h-13 rounded p-4'
          placeholder='VIN Number' />
           <input type="text"
          required
          className='mt-3 hover:border-black outline-none focus:border-blue-600 focus:border-2 border border-gray-500/50 w-full h-13 rounded p-4'
          placeholder='VIN Number' /> <input type="text"
          required
          className='mt-3 hover:border-black outline-none focus:border-blue-600 focus:border-2 border border-gray-500/50 w-full h-13 rounded p-4'
          placeholder='VIN Number' />

      </form>

    </div>
  )
}

export default OptionalInfo
