import React, { useState, useEffect } from 'react';
import { Copy, Check, Share2, Code, ExternalLink, Smartphone, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const InstallationShare = () => {
  const [copied, setCopied] = useState(false);
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Option 1: Customer Portal Link */}
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
            onClick={() => copyToClipboard(portalUrl)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
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

      {/* Option 2: Website Widget */}
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
          onClick={() => copyToClipboard(widgetCode)}
          className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          Copy Code
        </button>
        <p className="text-xs text-gray-400 mt-2">
          Paste this code in your website's header or footer. Works with all website builders.
        </p>
      </div>

      {/* Option 3: iFrame Embed */}
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
          onClick={() => copyToClipboard(iframeCode)}
          className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
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