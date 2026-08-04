// operator-frontend/src/components/InstallationShare.jsx

import React, { useState, useEffect } from 'react';
import { Copy, Check, Share2, Code, ExternalLink, Smartphone, Globe, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext'; 
const InstallationShare = () => {
  // Get operator from auth context
  const { user } = useAuth();
  
  const [copiedLink, setCopiedLink] = useState('');
  const [operatorId, setOperatorId] = useState('');
  
  // Customer Registration Form Link
  const [formLink, setFormLink] = useState('');

  // Existing portal data
  const [portalUrl, setPortalUrl] = useState('https://yourdomain.com/booking/acme-transport');
  const [widgetCode, setWidgetCode] = useState(`<!-- Moovs Booking Widget -->
<script src="https://yourdomain.com/widget.js" data-company="acme-transport"></script>`);
  const [iframeCode, setIframeCode] = useState(`<iframe 
  src="https://yourdomain.com/booking/iframe?slug=acme-transport"
  width="100%" 
  height="600"
  frameborder="0"
  allow="payment"
></iframe>`);

  useEffect(() => {
    // Get operator ID from auth context
    if (user && user._id) {
      setOperatorId(user._id);
      
      // Generate customer registration form link
      const customerBaseUrl = import.meta.env.VITE_CUSTOMER_URL || 'https://customer.moovs.com';
      const link = `${customerBaseUrl}/register?operatorId=${user._id}`;
      setFormLink(link);
    }
  }, [user]);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedLink(''), 2000);
  };

  // If loading or no user, show loading state
  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading operator information...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Option 1: Customer Registration Form Link (NEW - Most Important) */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <UserPlus className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Customer Registration Form</h3>
            <p className="text-sm text-gray-600">
              Share this link with your customers to create their accounts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-blue-200">
          <input
            type="text"
            value={formLink}
            readOnly
            className="flex-1 bg-transparent outline-none text-sm text-gray-700"
          />
          <button
            type="button"
            onClick={() => copyToClipboard(formLink, 'form')}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            {copiedLink === 'form' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <a
            href={formLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const emailBody = `Register for our transportation services:\n\n${formLink}\n\nThank you,\n${user?.Fname || 'Your'} ${user?.Lname || 'Transport'}`;
              window.location.href = `mailto:?subject=Register for Transportation Services&body=${encodeURIComponent(emailBody)}`;
            }}
            className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
          >
            Share via Email
          </button>
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Register for Transportation Services',
                  text: 'Click the link to register for our transportation services:',
                  url: formLink
                }).catch(() => {});
              }
            }}
            className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
          >
            Share
          </button>
          <button
            type="button"
            onClick={() => {
              const whatsappText = `Register for our transportation services: ${formLink}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank');
            }}
            className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
          >
            WhatsApp
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Customers will use this link to register and create their account. They will automatically be associated with your company.
        </p>
      </div>

      {/* Option 2: Customer Portal Link (Existing) */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <Globe className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Customer Portal Link</h3>
            <p className="text-sm text-gray-500">
              Share this link directly with your customers to book rides
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
          <input
            type="text"
            value={portalUrl}
            readOnly
            className="flex-1 bg-transparent outline-none text-sm text-gray-700"
          />
          <button
            type="button"
            onClick={() => copyToClipboard(portalUrl, 'portal')}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            {copiedLink === 'portal' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Share this link via email, social media, or add it as a button on your website
        </p>
      </div>

      {/* Option 3: Website Widget (Existing) */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <Code className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Website Widget</h3>
            <p className="text-sm text-gray-500">
              Add a floating "Book Now" button to your website
            </p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-700 overflow-x-auto">
          <pre className="whitespace-pre-wrap">{widgetCode}</pre>
        </div>
        <button
          type="button"
          onClick={() => copyToClipboard(widgetCode, 'widget')}
          className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {copiedLink === 'widget' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          Copy Code
        </button>
        <p className="text-xs text-gray-400 mt-2">
          Paste this code in your website's header or footer. Works with all website builders.
        </p>
      </div>

      {/* Option 4: iFrame Embed (Existing) */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <Smartphone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">iFrame Embed</h3>
            <p className="text-sm text-gray-500">
              Embed the booking form directly into a page on your website
            </p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-700 overflow-x-auto">
          <pre className="whitespace-pre-wrap">{iframeCode}</pre>
        </div>
        <button
          type="button"
          onClick={() => copyToClipboard(iframeCode, 'iframe')}
          className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {copiedLink === 'iframe' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          Copy Code
        </button>
        <p className="text-xs text-gray-400 mt-2">
          Paste this code where you want the booking form to appear on your page.
        </p>
      </div>
    </div>
  );
};

export default InstallationShare;