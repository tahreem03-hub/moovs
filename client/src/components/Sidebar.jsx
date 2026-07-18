import React, { useState } from 'react'
import { Car, ChartColumnDecreasing, CircleDollarSign, ContactRound, Ellipsis, FileText, LayoutDashboard, Navigation, Route, SquareMenu, User, UserRoundPen, Wrench } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    const toggleMoreMenu = () => {
        setShowMoreMenu(!showMoreMenu);
    };

    const closeMoreMenu = () => {
        setShowMoreMenu(false);
    };

    return (
        <>
            <div className="fixed top-18 left-0 w-50 sm:w-25 h-[calc(100vh-72px)] overflow-y-auto bg-white border-r border-gray-300 z-40">
                <div className='flex flex-col p-2'>
                    <NavLink to={'/quotes'} className={({ isActive }) => `h-15 rounded flex sm:flex-col items-center sm:justify-center max-sm:mb-0.5 max-sm:pl-2 max-sm:h-11 transition
                        ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`
                    }>
                        <LayoutDashboard className='w-6 h-6 max-sm:mr-3' strokeWidth={1.5} />
                        <p className='font-medium text-[11px]'>Quotes</p>
                    </NavLink>
                    
                    <NavLink to={'/reservations'} className={({ isActive }) => `h-15 rounded flex sm:flex-col items-center sm:justify-center max-sm:mb-0.5 max-sm:pl-2 max-sm:h-11 transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                        <Navigation className='w-6 h-6 max-sm:mr-3' strokeWidth={1.5} />
                        <p className='font-medium text-[11px]'>Reservations</p>
                    </NavLink>
                    
                    <NavLink to={'/dispatch'} className={({ isActive }) => `h-15 rounded flex sm:flex-col items-center sm:justify-center max-sm:mb-0.5 max-sm:pl-2 max-sm:h-11 transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                        <SquareMenu className='w-6 h-6 max-sm:mr-3' strokeWidth={1.5} />
                        <p className='font-medium text-[11px]'>Dispatch</p>
                    </NavLink>
                    
                    <NavLink to={'/driver-tracking'} className={({ isActive }) => `h-15 rounded flex sm:flex-col items-center sm:justify-center max-sm:mb-0.5 max-sm:pl-2 max-sm:h-11 transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                        <Route className='w-6 h-6 max-sm:mr-3' strokeWidth={1.5} />
                        <p className='font-medium text-[10px]'>Driver Tracking</p>
                    </NavLink>
                    
                    <NavLink to={'/vehicles'} className={({ isActive }) => `h-15 rounded flex sm:flex-col items-center sm:justify-center max-sm:mb-0.5 max-sm:pl-2 max-sm:h-11 transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                        <Car className='w-6 h-6 max-sm:mr-3' strokeWidth={1.5} />
                        <p className='font-medium text-[11px]'>Vehicles</p>
                    </NavLink>
                    
                    <NavLink to={'/contacts'} className={({ isActive }) => `h-15 rounded flex sm:flex-col items-center sm:justify-center max-sm:mb-0.5 max-sm:pl-2 max-sm:h-11 transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                        <UserRoundPen className='w-6 h-6 max-sm:mr-3' strokeWidth={1.5} />
                        <p className='font-medium text-[11px]'>Contacts</p>
                    </NavLink>
                    
                    <NavLink to={'/invoices'} className={({ isActive }) => `h-15 rounded flex sm:flex-col items-center sm:justify-center max-sm:mb-0.5 max-sm:pl-2 max-sm:h-11 transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                        <FileText className='w-6 h-6 max-sm:mr-3' strokeWidth={1.5} />
                        <p className='font-medium text-[11px]'>Invoices</p>
                    </NavLink>
                    
                    <NavLink to={'/payables'} className={({ isActive }) => `h-15 rounded flex sm:flex-col items-center sm:justify-center max-sm:mb-0.5 max-sm:pl-2 max-sm:h-11 transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                        <CircleDollarSign className='w-6 h-6 max-sm:mr-3' strokeWidth={1.5} />
                        <p className='font-medium text-[11px]'>Payables</p>
                    </NavLink>
                    
                    <NavLink to={'/crm'} className={({ isActive }) => `h-15 rounded flex sm:flex-col items-center sm:justify-center max-sm:mb-0.5 max-sm:pl-2 max-sm:h-11 transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                        <ContactRound className='w-6 h-6 max-sm:mr-3' strokeWidth={1.5} />
                        <p className='font-medium text-[11px]'>CRM</p>
                    </NavLink>

                    {/* More Button */}
                    <div 
                        className='relative h-15 rounded flex sm:flex-col items-center sm:justify-center max-sm:mb-0.5 max-sm:pl-2 max-sm:h-11 transition text-gray-800 hover:bg-sky-200/30 cursor-pointer'
                        onClick={toggleMoreMenu}
                    >
                        <Ellipsis className='w-6 h-6 max-sm:mr-3' strokeWidth={1.5} />
                        <p className='font-medium text-[11px]'>More</p>
                    </div>
                </div>
            </div>

            {/* Dropdown Menu - Rendered outside sidebar to avoid overflow issues */}
            {showMoreMenu && (
                <>
                    <div 
                        className="fixed left-14 bottom-24 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[999]"
                        style={{ 
                            bottom: '100px',
                            left: '20px'
                        }}
                    >
                        <NavLink 
                            to={'/settings'} 
                            className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${isActive ? "text-blue-600 bg-blue-50" : "text-gray-700"}`}
                            onClick={closeMoreMenu}
                        >
                            <Wrench className='w-4 h-4' strokeWidth={1.5} />
                            <span>Settings</span>
                        </NavLink>
                        
                        <NavLink 
                            to={'/analytics'} 
                            className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${isActive ? "text-blue-600 bg-blue-50" : "text-gray-700"}`}
                            onClick={closeMoreMenu}
                        >
                            <ChartColumnDecreasing className='w-4 h-4' strokeWidth={1.5} />
                            <span>Analytics</span>
                        </NavLink>

                        <NavLink 
                            to={'/profile'} 
                            className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${isActive ? "text-blue-600 bg-blue-50" : "text-gray-700"}`}
                            onClick={closeMoreMenu}
                        >
                            <User className='w-4 h-4' strokeWidth={1.5} />
                            <span>Profile</span>
                        </NavLink>
                    </div>
                    
                    {/* Click outside to close */}
                    <div className="fixed inset-0 z-[998]" onClick={closeMoreMenu}></div>
                </>
            )}
        </>
    )
}

export default Sidebar