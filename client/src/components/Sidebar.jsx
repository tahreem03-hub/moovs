import React, { useState } from 'react'
import { Car, ChartColumnDecreasing, CircleDollarSign, ContactRound, Ellipsis, FileText, LayoutDashboard, Navigation, Route, SquareMenu, User, UserRoundPen, Wrench } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {


    return (
        <div className='w-50 min-h-screen md:w-25 flex flex-col p-2'>


            <NavLink to={'/quotes'} className={({ isActive }) =>`h-15 rounded flex md:flex-col items-center md:justify-center max-md:mb-0.5 max-md:pl-2 max-md:h-11 transition
            ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`
            }>
                <LayoutDashboard className='w-6 h-6 max-md:mr-3' strokeWidth={1.5} />
                <p className='font-medium text-xs'>Quotes</p>
            </NavLink>
            <NavLink to={'/reservations'} className={({ isActive }) =>`h-15 rounded flex md:flex-col items-center md:justify-center max-md:mb-0.5 max-md:pl-2 max-md:h-11 transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                <Navigation className='w-6 h-6 max-md:mr-3' strokeWidth={1.5} />
                <p className='font-medium text-xs'>Reservations</p>
            </NavLink>
            <NavLink to={'/dispatch'} className={({ isActive }) =>`h-15 rounded flex md:flex-col items-center md:justify-center max-md:mb-0.5 max-md:pl-2 max-md:h-11 transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                <SquareMenu className='w-6 h-6 max-md:mr-3' strokeWidth={1.5} />
                <p className='font-medium text-xs'>Dispatch</p>
            </NavLink>
            <NavLink to={'/driver-tracking'} className={({ isActive }) =>`h-15 rounded flex md:flex-col items-center md:justify-center max-md:mb-0.5 max-md:pl-2 max-md:h-11 transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                <Route className='w-6 h-6 max-md:mr-3' strokeWidth={1.5} />
                <p className='font-medium text-xs'>Driver Tracking</p>
            </NavLink>
            <NavLink to={'/vehicles'} className={({ isActive }) =>`h-15 rounded flex md:flex-col items-center md:justify-center max-md:mb-0.5 max-md:pl-2 max-md:h-11 transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                <Car className='w-6 h-6 max-md:mr-3' strokeWidth={1.5} />
                <p className='font-medium text-xs'>Vehicles</p>
            </NavLink>
            <NavLink to={'/contacts'} className={({ isActive }) =>`h-15 rounded flex md:flex-col items-center md:justify-center max-md:mb-0.5 max-md:pl-2 max-md:h-11 transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                <UserRoundPen className='w-6 h-6 max-md:mr-3' strokeWidth={1.5} />
                <p className='font-medium text-xs'>Contacts</p>
            </NavLink>
            <NavLink to={'/invoices'} className={({ isActive }) =>`h-15 rounded flex md:flex-col items-center md:justify-center max-md:mb-0.5 max-md:pl-2 max-md:h-11 transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                <FileText className='w-6 h-6 max-md:mr-3' strokeWidth={1.5} />
                <p className='font-medium text-xs'>Invoices</p>
            </NavLink>
            <NavLink to={'/payables'} className={({ isActive }) =>`h-15 rounded flex md:flex-col items-center md:justify-center max-md:mb-0.5 max-md:pl-2 max-md:h-11 transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                <CircleDollarSign className='w-6 h-6 max-md:mr-3' strokeWidth={1.5} />
                <p className='font-medium text-xs'>Payables</p>
            </NavLink>
            <NavLink to={'/crm'} className={({ isActive }) =>`h-15 rounded flex md:flex-col items-center md:justify-center max-md:mb-0.5 max-md:pl-2 max-md:h-11 transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                <ContactRound className='w-6 h-6 max-md:mr-3' strokeWidth={1.5} />
                <p className='font-medium text-xs'>CRM</p>
            </NavLink>
            <div className='h-15 rounded flex md:flex-col items-center md:justify-center max-md:mb-0.5 max-md:pl-2 max-md:h-11 transition  text-gray-800 hover:bg-sky-200/30'>
                <Ellipsis className='w-6 h-6 max-md:mr-3' strokeWidth={1.5} />
                <p className='font-medium text-xs'>More</p>
            </div>











            {/*<ChartColumnDecreasing className='w-6 h-6' strokeWidth={1.5} />
            <Wrench className='w-6 h-6' strokeWidth={1.5} />*/}
        </div>
    )
}

export default Sidebar
