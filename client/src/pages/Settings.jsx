import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  LayoutDashboard, 
  XCircle, 
  Shield, 
  FileText, 
  Users, 
  UserPlus, 
  MapPin, 
  Route, 
  Globe, 
  ShoppingBag, 
  CreditCard, 
  GraduationCap 
} from 'lucide-react';

const Settings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get current section from URL
  const pathSegments = location.pathname.split('/');
  const currentSection = pathSegments[2] || 'general';

  const menuItems = [
    { id: 'general', label: 'General', icon: Home },
    { id: 'customer-portal', label: 'Customer Portal', icon: LayoutDashboard },
    { id: 'cancellation', label: 'Cancellation', icon: XCircle },
    { id: 'insurance', label: 'Insurance', icon: Shield },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'drivers', label: 'Drivers', icon: Users },
    { id: 'members', label: 'Members', icon: UserPlus },
    { id: 'zone-pricing', label: 'Zone Pricing', icon: MapPin },
    { id: 'trip-rules', label: 'Trip Rules', icon: Route },
    { id: 'website', label: 'Website', icon: Globe },
    { id: 'moovs-market', label: 'Moovs Market', icon: ShoppingBag },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
    { id: 'academy', label: 'Moovs Academy', icon: GraduationCap },
  ];

  const handleMenuClick = (sectionId) => {
    navigate(`/settings/${sectionId}`);
  };

  return (
    <div className="h-screen bg-gray-50">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          </div>
          
          <div className="p-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area - Renders nested routes */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Settings;