import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Tag, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RequiredInfo from './formTabContent/RequiredInfo';
import OptionalInfo from './formTabContent/OptionalInfo';
import Photos from './formTabContent/Photos';
import Features from './formTabContent/Features';
import Pricing from './formTabContent/Pricing';
import CustomerPortal from './formTabContent/CustomerPortal';

const VehicleForm = () => {

    const [active, setActive] = useState(0);

    const buttons = [
        { tag: "REQUIRED INFO" },
        { tag: "OPTIONAL INFO" },
        { tag: "PHOTOS" },
        { tag: "FEATURES" },
        { tag: "PRICING" },
        { tag: "CUSTOMER PORTAL SETTINGS" },
    ];
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

                <div className='flex flex-col h-full'>

                    <div className='flex justify-between p-7'>
                        <button onClick={() => navigate('/vehicles?tab=my-vehicles')}
                            className='transition-transform duration-300 ease-out'>
                            <X className='w-6.5 h-6.5 text-gray-600' strokeWidth={1.5} />
                        </button>

                        <h1 className='text-[16px] text-black/90 font-medium'>Create New Vehicle</h1>

                    </div>

                    <div className='flex overflow-x-auto whitespace-nowrap'>
                        {buttons.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => setActive(index)}
                                className={`relative text-sm font-[600] m-1 p-1 ${active === index ? "text-blue-600" : "text-gray-600"
                                    }`}
                            >
                                {item.tag}
                                {active === index && (
                                    <span className="absolute left-0 bottom-0 h-0.5 w-full bg-blue-600 transition-all duration-300" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className='p-6 overflow-y-auto flex-1'>
                        {active === 0 && <RequiredInfo />}
                        {active === 1 && <OptionalInfo />}
                        {active === 2 && <Photos />}
                        {active === 3 && <Features />}
                        {active === 4 && <Pricing />}
                        {active === 5 && <CustomerPortal />}

                            <h1 className='text-sm text-gray-900 font-medium mt-20 py-2 border-b border-gray-500/50'>INTERNAL COMMENTS</h1>

                        <input type="text"
                            required
                            className=' mt-3 hover:border-black outline-none focus:border-blue-600 focus:border-2 border border-gray-500/50 w-full h-13 rounded p-4'
                            placeholder='Comment ...' />

                    </div>

                </div>





            </div>

        </div>
    )
}

export default VehicleForm
