import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, Mail, CreditCard, Settings as SettingsIcon } from 'lucide-react';
import Company from './general/Company';
import Communication from './general/Communication';
import Payments from './general/Payments';
import Preferences from './general/Preferences';

const General = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'company';

  const tabs = [
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'communication', label: 'Communication', icon: Mail },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
  ];

  const handleTabChange = (tabId) => {
    navigate(`/settings/general?tab=${tabId}`);
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'company': return <Company />;
      case 'communication': return <Communication />;
      case 'payments': return <Payments />;
      case 'preferences': return <Preferences />;
      default: return <Company />;
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">General</h1>

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

export default General;