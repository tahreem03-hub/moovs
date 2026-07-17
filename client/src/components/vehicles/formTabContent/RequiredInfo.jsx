import { Bus, Car, Van, ChevronDown, Search } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'

const RequiredInfo = ({ formData, setFormData }) => {




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

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleVehicleType = (item) => {
        setSelected(item);

        setFormData(prev => ({
            ...prev,
            type: item.name
        }));

        setOpen(false);
        setSearch("");
    };

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
            <h1 className='text-black/90 text-xl font-bold'>Required Info</h1>

            

                <input
                    type="text"
                    name='name'
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className='mt-3 hover:border-black outline-none focus:border-blue-600 focus:border-2 border border-gray-500/50 w-full h-13 rounded p-4'
                    placeholder='Vehicle Name *' />

                {/* Custom dropdown replaces plain input */}
                <div className='relative mt-3' ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setOpen((prev) => !prev)}
                        className={`flex items-center justify-between w-full h-13 rounded p-4 border outline-none
                            ${open ? "border-blue-600 border-2" : "border-gray-500/50 hover:border-black"}`}
                    >
                        <span className={formData.type ? "text-black" : "text-gray-500"}>
                            {formData.type || "Vehicle Type *"}
                        </span>
                        <ChevronDown
                            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                        />
                    </button>

                    {open && (
                        <div className='absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg overflow-hidden'>
                            <div className='flex items-center gap-2 px-3 py-2 border-b border-gray-100'>
                                <Search className='w-4 h-4 text-gray-400' />
                                <input
                                    autoFocus
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder='Search vehicle type...'
                                    className='outline-none text-sm w-full py-1'
                                />
                            </div>

                            <div className='max-h-64 overflow-y-auto'>
                                {filtered.length === 0 && (
                                    <div className='px-4 py-3 text-sm text-gray-400'>No results found</div>
                                )}
                                {filtered.map((item, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleVehicleType(item)}
                                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer text-sm
                                            ${selected?.name === item.name ? "bg-blue-50" : "hover:bg-gray-50"}`}
                                    >
                                        <span className='text-gray-500 [&>svg]:w-4 [&>svg]:h-4'>{item.icon}</span>
                                        <span className='text-gray-800'>{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* hidden input so `required` still works on form submit */}
                    <input
                        type="text"
                        required
                        value={selected?.name || ""}
                        readOnly
                        tabIndex={-1}
                        className='sr-only'
                    />
                </div>

                <input type="text"
                    required
                    name="passengerCapacity"
                    value={formData.passengerCapacity}
                    onChange={handleChange}
                    className='mt-3 hover:border-black outline-none focus:border-blue-600 focus:border-2 border border-gray-500/50 w-full h-13 rounded p-4'
                    placeholder='Passenger Capacity *' />

        </div>
    )
}

export default RequiredInfo