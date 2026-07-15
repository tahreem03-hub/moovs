import React from 'react'
import { useLocation } from 'react-router-dom'
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const VehicleForm = () => {
     const navigate = useNavigate();
    {/* check endpoint if it is create then dull background */ }

    const location = useLocation();
    const isForm = location.pathname === "/vehicles/create"
    return (
        <div className={`
                fixed inset-0 z-50
                transition-opacity duration-300
                ${isForm ? "opacity-100 visible" : "opacity-0 invisible"}
            `}>
            {/* dull background */}
            <div className='absolute inset-0 bg-gray-600/60'></div>

            <div className={`
                    absolute right-0 top-0 h-full w-[600px]
                    bg-white border shadow-xl
                    transform transition-transform duration-300 ease-in-out
                    ${isForm ? "translate-x-0" : "translate-x-full"}
                `}>
                <button onClick={() => navigate('/vehicles?tab=my-vehicles')}>
                    <X />
                </button>
            </div>

        </div>
    )
}

export default VehicleForm
