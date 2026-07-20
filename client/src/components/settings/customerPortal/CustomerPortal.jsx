import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Settings, Palette, Ticket, Share2 } from 'lucide-react';
import Payments from './Payments';
import SettingsTab from './SettingsTab';
import Branding from './Branding';
import PromoCodes from './PromoCodes';
import InstallationShare from './InstallationShare';

const CustomerPortal = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'payments';

  const tabs = [
    { id: 'installation', label: 'Installation & Share', icon: Share2 },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'promo-codes', label: 'Promo Codes', icon: Ticket },
  ];

  const handleTabChange = (tabId) => {
    navigate(`/settings/customer-portal?tab=${tabId}`);
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'installation': return <InstallationShare />;
      case 'payments': return <Payments />;
      case 'settings': return <SettingsTab />;
      case 'branding': return <Branding />;
      case 'promo-codes': return <PromoCodes />;
      default: return <Payments />;
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Customer Portal</h1>
      <p className="text-sm text-gray-500 mb-6">
        Configure how customers interact with your booking portal
      </p>

      <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`pb-2 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2
              ${activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {renderContent()}
    </div>
  );
};

export default CustomerPortal;