// src/components/common/Layout.jsx
import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
    const { user } = useAuth();
    const [open, setOpen] = useState(true);

    const toggleDrawer = () => setOpen(!open);

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar open={open} toggleDrawer={toggleDrawer} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="bg-white shadow-sm z-10" style={{ marginLeft: open ? '240px' : '72px', width: `calc(100% - ${open ? 240 : 72}px)` }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            onClick={toggleDrawer}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <Menu className="w-5 h-5 text-gray-600" />
                        </button>
                        <span className="text-gray-700 font-medium">
                            Welcome, {user?.Fname || 'Customer'}!
                        </span>
                    </div>
                </header>

                {/* Page Content */}
                <main 
                    className="flex-1 overflow-y-auto p-6 mt-14"
                    style={{ marginLeft: open ? '240px' : '72px', width: `calc(100% - ${open ? 240 : 72}px)` }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;