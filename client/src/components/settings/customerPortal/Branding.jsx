import React, { useState, useEffect } from 'react';
import { Save, Upload, X, Paintbrush, Lock } from 'lucide-react';
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

const Branding = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    logo: null,
    primaryColor: '#2563EB',
    secondaryColor: '#1E293B',
    accentColor: '#F59E0B',
    fontFamily: 'Inter',
    buttonStyle: 'rounded'
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${import.meta.env.VITE_URL}/customer-portal`
      );
      if (data.data?.branding) {
        setSettings(prev => ({ ...prev, ...data.data.branding }));
        if (data.data.branding.logo?.url) {
          setLogoPreview(data.data.branding.logo.url);
        }
      }
    } catch (error) {
      toast.error('Failed to load branding');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(settings).forEach(key => {
        if (key !== 'logo') {
          formData.append(key, settings[key]);
        }
      });
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      await axios.put(
        `${import.meta.env.VITE_URL}/customer-portal/branding`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      toast.success('Branding saved!');
    } catch (error) {
      toast.error('Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* ============ LOGO ============ */}
      <div>
        <SectionTitle>Logo</SectionTitle>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-6">
            {logoPreview ? (
              <div className="relative">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-32 h-32 object-contain border border-gray-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div>
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm transition-colors">
                Upload Logo
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
              </label>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (max 2MB)</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ COLORS ============ */}
      <div>
        <SectionTitle>Colors</SectionTitle>
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div>
            <FieldLabel>Primary Color</FieldLabel>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="primaryColor"
                value={settings.primaryColor}
                onChange={handleChange}
                className="w-12 h-12 border rounded cursor-pointer"
              />
              <input
                type="text"
                name="primaryColor"
                value={settings.primaryColor}
                onChange={handleChange}
                className={`${inputCls} flex-1`}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Secondary Color</FieldLabel>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="secondaryColor"
                value={settings.secondaryColor}
                onChange={handleChange}
                className="w-12 h-12 border rounded cursor-pointer"
              />
              <input
                type="text"
                name="secondaryColor"
                value={settings.secondaryColor}
                onChange={handleChange}
                className={`${inputCls} flex-1`}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Accent Color</FieldLabel>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="accentColor"
                value={settings.accentColor}
                onChange={handleChange}
                className="w-12 h-12 border rounded cursor-pointer"
              />
              <input
                type="text"
                name="accentColor"
                value={settings.accentColor}
                onChange={handleChange}
                className={`${inputCls} flex-1`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============ TYPOGRAPHY ============ */}
      <div>
        <SectionTitle>Typography</SectionTitle>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <FieldLabel>Font Family</FieldLabel>
          <select
            name="fontFamily"
            value={settings.fontFamily}
            onChange={handleChange}
            className={`${inputCls} w-full`}
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Lato">Lato</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Poppins">Poppins</option>
          </select>
        </div>
      </div>

      {/* ============ BUTTON STYLE ============ */}
      <div>
        <SectionTitle>Button Style</SectionTitle>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex gap-4">
            {['rounded', 'pill', 'square'].map((style) => (
              <label key={style} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="buttonStyle"
                  value={style}
                  checked={settings.buttonStyle === style}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span className="text-sm capitalize">{style}</span>
              </label>
            ))}
          </div>
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

export default Branding;