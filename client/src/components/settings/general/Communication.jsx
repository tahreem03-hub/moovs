import React, { useState, useEffect } from 'react';
import { Save, Globe, Mail, CheckCircle, AlertCircle, Send, RefreshCw, Copy } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

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

const Toggle = ({ enabled, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100">
    <div>
      <p className="text-sm font-medium text-gray-900">{label}</p>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  </div>
);

const Communication = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showDNS, setShowDNS] = useState(false);
  const [dnsRecords, setDnsRecords] = useState([]);
  const [settings, setSettings] = useState({
    sendAutomatedChargeEmails: false,
    sendAutomatedCancellationEmails: true,
    customDomain: '',
    domainVerified: false,
    domainEmail: '',
    smtp: {
      host: '',
      port: 587,
      secure: false,
      username: '',
      password: ''
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${import.meta.env.VITE_URL}/company-profile/communication`
      );
      if (data.data) {
        setSettings(prev => ({ ...prev, ...data.data }));
      }
    } catch (error) {
      toast.error('Failed to load communication settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSmtpChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      smtp: {
        ...prev.smtp,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${import.meta.env.VITE_URL}/company-profile/communication`, settings);
      toast.success('Communication settings saved!');
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const verifyDomain = async () => {
    if (!settings.customDomain) {
      toast.error('Please enter your domain name first');
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_URL}/company-profile/verify-domain`,
        {
          domain: settings.customDomain,
          email: settings.domainEmail
        }
      );
      
      if (response.data.success) {
        setSettings(prev => ({ ...prev, domainVerified: true }));
        setDnsRecords(response.data.data?.dnsRecords || []);
        setShowDNS(true);
        toast.success('Domain configured successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify domain');
    }
  };

  const testEmail = async () => {
    setTesting(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_URL}/company-profile/test-email`,
        { email: settings.domainEmail }
      );
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <SectionTitle>Notifications</SectionTitle>
      
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <Toggle
          enabled={settings.sendAutomatedChargeEmails}
          onChange={() => handleToggle('sendAutomatedChargeEmails')}
          label="Send automated charge emails to booking contact"
          description="Automated outgoing emails when charge initiated to booking contact"
        />
        
        <Toggle
          enabled={settings.sendAutomatedCancellationEmails}
          onChange={() => handleToggle('sendAutomatedCancellationEmails')}
          label="Send automated cancellation emails to booking contact"
          description="Automated outgoing emails when trip cancelled to booking contact"
        />
      </div>

      <SectionTitle>Chat</SectionTitle>
      
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Mail className="w-4 h-4" />
          <span>Email Communication</span>
        </div>
        <p className="text-sm text-gray-600">
          Configure your email settings to send automated notifications to customers.
        </p>
      </div>

      <SectionTitle>Custom Email Domain</SectionTitle>
      
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <p className="text-sm text-gray-600">
          Set up your own domain to send emails from your company's email address 
          (e.g., noreply@yourcompany.com).
        </p>

        <div>
          <FieldLabel>Domain Name</FieldLabel>
          <input
            type="text"
            name="customDomain"
            value={settings.customDomain}
            onChange={handleChange}
            className={inputCls}
            placeholder="yourcompany.com"
          />
          <p className="text-xs text-gray-400 mt-1">
            Enter your company's domain name (e.g., acmetransport.com)
          </p>
        </div>

        <div>
          <FieldLabel>From Email Address</FieldLabel>
          <input
            type="email"
            name="domainEmail"
            value={settings.domainEmail}
            onChange={handleChange}
            className={inputCls}
            placeholder="noreply@yourcompany.com"
          />
          <p className="text-xs text-gray-400 mt-1">
            The email address that will appear in the "From" field
          </p>
        </div>

        {settings.domainVerified ? (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">Domain verified! You can now send emails.</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={verifyDomain}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Verify Domain
          </button>
        )}

        {showDNS && dnsRecords.length > 0 && (
          <div className="mt-4">
            <FieldLabel>DNS Records to Add</FieldLabel>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {dnsRecords.map((record, index) => (
                <div key={index} className="flex items-center gap-2 text-sm p-2 bg-white rounded border">
                  <span className="font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">
                    {record.type}
                  </span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{record.host}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs flex-1 truncate">{record.value}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(record.value)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <Copy className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Add these DNS records to your domain provider's DNS settings. 
              Verification may take 24-48 hours to propagate.
            </p>
          </div>
        )}
      </div>

      <SectionTitle>SMTP Settings</SectionTitle>
      
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <p className="text-sm text-gray-600">
          Configure your SMTP server settings to send emails. Your email provider will provide these details.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>SMTP Host</FieldLabel>
            <input
              type="text"
              name="host"
              value={settings.smtp.host}
              onChange={handleSmtpChange}
              className={inputCls}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div>
            <FieldLabel>Port</FieldLabel>
            <input
              type="number"
              name="port"
              value={settings.smtp.port}
              onChange={handleSmtpChange}
              className={inputCls}
              placeholder="587"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Username</FieldLabel>
            <input
              type="text"
              name="username"
              value={settings.smtp.username}
              onChange={handleSmtpChange}
              className={inputCls}
              placeholder="your@email.com"
            />
          </div>
          <div>
            <FieldLabel>Password</FieldLabel>
            <input
              type="password"
              name="password"
              value={settings.smtp.password}
              onChange={handleSmtpChange}
              className={inputCls}
              placeholder="••••••••"
            />
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="secure"
            checked={settings.smtp.secure}
            onChange={handleSmtpChange}
            className="w-4 h-4"
          />
          <span className="text-sm">Use secure connection (SSL/TLS)</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={testEmail}
            disabled={testing}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {testing ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default Communication;