import { Crown, ListCheck, Mail, MessagesSquare, Search } from 'lucide-react'
import React from 'react'
import { NavLink } from 'react-router-dom'

const Header = () => {

    return (
        <div className="fixed top-0 left-0 right-0 h-18 bg-white z-50 flex border border-gray-300">

            <div className='flex justify-center p-2'>
                <div className='flex items-center'>
                    <Crown className='text-yellow-500 w-6.5 h-6.5' />
                    <div className='flex flex-col p-2'>
                        <h1 className='text-3xl font-bold'>SUPREME</h1>
                        <h1 className='text-gray-600 font-medium text-xs'>LIMO AND CAR SERVICE</h1>
                    </div>
                </div>



                <div className='flex items-center bg-sky-50/50 rounded border border-gray-400/50 mx-3 px-3 py-2 w-80 shadow-sm 
                focus-within:ring-1 focus-within:ring-sky-300/30 focus-within:shadow-md transition'>
                    <Search />
                    <input
                        type="text"
                        placeholder='Search for contacts, orders, or companies'
                        className='ml-2 outline-none w-full text-sm'
                    />
                </div>

                <div className='flex items-center space-x-2'>

                    <NavLink to={'/getting-started'} className={({ isActive }) => `px-0.5 h-15 rounded flex flex-col items-center justify-center transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                        <ListCheck className='h-6 w-6' strokeWidth={1}/>
                        <h1 className='text-[10px] text-gray-800 font-medium'> Getting Started </h1>
                    </NavLink>
                    <NavLink to={'/getting-started'} className={({ isActive }) => `px-0.5 h-15 rounded flex flex-col items-center justify-center transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                        <Mail className='h-6 w-6' strokeWidth={1}/>
                        <h1 className='text-[10px] text-gray-800 font-medium'> Compose Email</h1>
                    </NavLink>
                    <NavLink to={'/getting-started'} className={({ isActive }) => `px-0.5 h-15 rounded flex flex-col items-center justify-center transition ${isActive ? "bg-sky-200/50 text-blue-600" : "text-gray-800 hover:bg-sky-200/30"}`}>
                        <MessagesSquare className='h-6 w-6' strokeWidth={1}/>
                        <h1 className='text-[10px] text-gray-800 font-medium'> Chat</h1>
                    </NavLink>
                    

                </div>


            </div>
        </div>
    )
}

export default Header
