import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Crown, LayoutDashboard, Users, CreditCard, LogOut } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext'; // adjust path if your context lives elsewhere

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/operators', label: 'Operators', icon: Users, end: false },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard, end: false },
  { to: '/admin/plans', label: 'Plans', icon: Crown, end: false },
  { to: '/admin/pending-requests', label: 'Payment Requests', icon: CreditCard, end: false },
];



const AdminLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-gray-900 text-white flex flex-col p-4">
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="h-11 w-11 rounded-2xl border border-gray-500/60 bg-gray-700 flex items-center justify-center">
            <Crown className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-sm">Supreme Limo</p>
            <p className="text-white/50 text-xs">Admin console</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-white/70 hover:bg-gray-700/60'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          {user && (
            <div className="px-4 py-3 text-xs text-white/50 truncate">
              Signed in as {user.email}
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/70 hover:bg-gray-700/60 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Content — each page renders here */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;