import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';

const inputCls = `border rounded w-full px-4 py-2.5 border-gray-400/50 outline-none
  placeholder:text-gray-400 hover:border-black
  focus:ring-2 focus:ring-blue-600/90 focus:border-transparent
  transition-all duration-200 text-sm`;

const SectionTitle = ({ children }) => (
  <h2 className="text-sm font-bold tracking-wide text-black/90 uppercase mb-4">
    {children}
  </h2>
);

const FieldLabel = ({ children }) => (
  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
    {children}
  </p>
);

const General = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get tab from URL query or default to 'company'
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'company';

  const tabs = [
    { id: 'company', label: 'Company' },
    { id: 'communication', label: 'Communication' },
    { id: 'payments', label: 'Payments' },
    { id: 'preferences', label: 'Preferences' },
  ];

  const handleTabChange = (tabId) => {
    navigate(`/settings/general?tab=${tabId}`);
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">General</h1>
      
      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`pb-2 text-sm font-medium transition-colors
              ${activeTab === tab.id 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Company Tab Content (Default) */}
      {activeTab === 'company' && (
        <div>
          <SectionTitle>Company Information</SectionTitle>

          <div className="space-y-4">
            <div>
              <FieldLabel>Company Name</FieldLabel>
              <input
                type="text"
                className={inputCls}
                placeholder="Enter company name"
                defaultValue="hi"
              />
            </div>

            <div>
              <FieldLabel>Company Address</FieldLabel>
              <input
                type="text"
                className={inputCls}
                placeholder="Enter company address"
                defaultValue="Pakistan"
              />
            </div>

            <div>
              <FieldLabel>Website URL</FieldLabel>
              <input
                type="text"
                className={inputCls}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <FieldLabel>Permit #</FieldLabel>
              <input
                type="text"
                className={inputCls}
                placeholder="Enter permit number"
              />
            </div>

            <SectionTitle>Additional Details</SectionTitle>

            <div>
              <FieldLabel>General Email</FieldLabel>
              <input
                type="email"
                className={inputCls}
                placeholder="Enter general email"
                defaultValue="tahreemnoor244@gmail.com"
              />
            </div>

            <div>
              <FieldLabel>From Email</FieldLabel>
              <input
                type="email"
                className={inputCls}
                placeholder="Set up your domain in Communication to use"
              />
              <p className="text-xs text-gray-400 mt-1">
                Set up your domain in Communication to use
              </p>
            </div>

            <div>
              <FieldLabel>Booking Email</FieldLabel>
              <input
                type="email"
                className={inputCls}
                placeholder="Enter booking email"
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Communication Tab */}
      {activeTab === 'communication' && (
        <div>
          <SectionTitle>Communication Settings</SectionTitle>
          <div className="space-y-4">
            <div>
              <FieldLabel>Email Settings</FieldLabel>
              <input
                type="text"
                className={inputCls}
                placeholder="SMTP Server"
              />
            </div>
            <div>
              <FieldLabel>Domain</FieldLabel>
              <input
                type="text"
                className={inputCls}
                placeholder="example.com"
              />
            </div>
            <div className="pt-4 border-t border-gray-200">
              <button className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div>
          <SectionTitle>Payment Settings</SectionTitle>
          <div className="space-y-4">
            <div>
              <FieldLabel>Stripe API Key</FieldLabel>
              <input
                type="text"
                className={inputCls}
                placeholder="Enter Stripe API key"
              />
            </div>
            <div>
              <FieldLabel>Currency</FieldLabel>
              <select className={inputCls}>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>PKR</option>
              </select>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <button className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div>
          <SectionTitle>Preferences</SectionTitle>
          <div className="space-y-4">
            <div>
              <FieldLabel>Timezone</FieldLabel>
              <select className={inputCls}>
                <option>UTC - 5:00</option>
                <option>UTC - 4:00</option>
                <option>UTC + 0:00</option>
                <option>UTC + 5:00</option>
              </select>
            </div>
            <div>
              <FieldLabel>Date Format</FieldLabel>
              <select className={inputCls}>
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <button className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default General;