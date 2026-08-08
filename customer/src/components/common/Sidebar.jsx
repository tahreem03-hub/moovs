// src/components/common/Sidebar.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Car,
    Receipt,
    CreditCard,
    Wallet,
    User,
    LogOut,
    ChevronLeft,
    Menu,
    ChevronDown,
    ChevronRight,
    Bell
} from 'lucide-react';

const Sidebar = ({ open, toggleDrawer }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, contact, logout } = useAuth();
    const [openSubMenu, setOpenSubMenu] = useState({ trips: false, payments: false });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNavigate = (path) => {
        navigate(path);
        if (window.innerWidth < 768) toggleDrawer();
    };

    const toggleSubMenu = (key) => {
        setOpenSubMenu(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        {
            label: 'Trips',
            icon: Car,
            submenu: true,
            key: 'trips',
            items: [
                { label: 'All Trips', path: '/trips' },
                { label: 'Book a Ride', path: '/book-ride' }
            ]
        },
        { icon: Receipt, label: 'Invoices', path: '/invoices' },
        {
            label: 'Payments',
            icon: CreditCard,
            submenu: true,
            key: 'payments',
            items: [
                { label: 'Payment Methods', path: '/payments' },
                { label: 'Payment History', path: '/payments' }
            ]
        },
        { icon: Wallet, label: 'Cashback', path: '/cashback' },
        { icon: User, label: 'Profile', path: '/profile' }
    ];

    return (
        <div 
            className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-20 flex flex-col ${
                open ? 'w-60' : 'w-[72px]'
            }`}
        >
            {/* Logo */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                {open ? (
                    <span className="text-xl font-bold text-blue-600">Moovs</span>
                ) : (
                    <span className="text-xl font-bold text-blue-600">M</span>
                )}
                <button onClick={toggleDrawer} className="p-1 hover:bg-gray-100 rounded-lg">
                    {open ? <ChevronLeft className="w-5 h-5 text-gray-500" /> : <Menu className="w-5 h-5 text-gray-500" />}
                </button>
            </div>

            {/* User Info */}
            <div className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 ${!open && 'justify-center'}`}>
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {contact?.firstName?.[0] || user?.email?.[0] || 'U'}
                </div>
                {open && (
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {contact?.firstName} {contact?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {menuItems.map((item, index) => {
                    if (item.submenu) {
                        const isOpen = openSubMenu[item.key];
                        return (
                            <div key={index}>
                                <button
                                    onClick={() => toggleSubMenu(item.key)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                                        !open && 'justify-center'
                                    }`}
                                >
                                    <item.icon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                                    {open && (
                                        <>
                                            <span className="flex-1 text-left text-sm text-gray-700">{item.label}</span>
                                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </>
                                    )}
                                </button>
                                {open && isOpen && (
                                    <div className="ml-6 space-y-0.5 mt-0.5">
                                        {item.items.map((sub, subIdx) => (
                                            <button
                                                key={subIdx}
                                                onClick={() => handleNavigate(sub.path)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                                    isActive(sub.path)
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                            >
                                                {sub.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => handleNavigate(item.path)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                !open && 'justify-center'
                            } ${
                                isActive(item.path)
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {open && <span className="text-sm">{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="border-t border-gray-100 p-2 space-y-0.5">
                <button
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                        !open && 'justify-center'
                    }`}
                >
                    <Bell className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    {open && <span className="text-sm text-gray-600">Notifications</span>}
                </button>
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors ${
                        !open && 'justify-center'
                    }`}
                >
                    <LogOut className="w-5 h-5 text-red-500 flex-shrink-0" />
                    {open && <span className="text-sm text-red-500">Logout</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;