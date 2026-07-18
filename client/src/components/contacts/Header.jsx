import React from 'react'
import { Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'


const Header = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const path = location.pathname

    // Map paths to display names
    // Get the base route name
    const getPageTitle = () => {
        const path = location.pathname;

        // For contacts routes
        if (path.includes('/contact')) {
            return 'Contacts';
        }

        // For companies routes
        if (path.includes('/company') || path.includes('/companies')) {
            return 'Companies';
        }

        // For affiliates routes
        if (path.includes('/affiliate')) {
            return 'Affiliates';
        }

    };

    const buttons = [
        { name: "CONTACTS", path: '/contacts' },
        { name: "COMPANIES", path: '/companies' },
        { name: "AFFILIATES", path: '/affiliates' },
    ]

    const pageTitle = getPageTitle().toUpperCase();

    return (
        <div className='bg-white'>
            <div className='border border-b border-gray-400/20'>
                <div className='flex justify-between p-4'>
                    <h1 className='text-3xl font-bold text-black/90'>{pageTitle}</h1>
                    <div className="border border-gray-400 rounded flex items-center px-2 
                     hover:border-black/70 
                      focus-within:border-blue-500 
                      focus-within:ring-1 
                      focus-within:ring-blue-500">
                        <Search className='w-5.5 h-6 text-blue-600' strokeWidth={1.5} />
                        <input type="text"
                            className='outline-none'
                            placeholder={`Search ${getPageTitle()}...`}
                        />
                    </div>

                    <div>
                        <button className='rounded text-white bg-blue-600/95 text-md px-4 py-2'
                            onClick={() => navigate('create')}> {/* Changed to show form */}
                            Create {getPageTitle()}
                        </button>
                    </div>
                </div>

                {/* buttons */}
                <div>
                    {
                        buttons.map((item, index) => (
                            <button key={index}
                                className={`text-xs font-bold p-4
                                ${path === item.path ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700'}`}
                                onClick={() => navigate(item.path)}>
                                {item.name}
                            </button>
                        ))
                    }

                </div>


            </div>
        </div>
    )
}

export default Header