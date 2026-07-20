import React, { useState, useEffect } from 'react';
import { Save, Building2, X } from 'lucide-react';
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

const Company = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    website: '',
    permitNumber: '',
    generalEmail: '',
    bookingEmail: '',
    supportEmail: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/company-profile/profile`
      );
      const data = response.data.data;
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address?.street || '',
        city: data.address?.city || '',
        state: data.address?.state || '',
        zipCode: data.address?.zipCode || '',
        country: data.address?.country || 'US',
        website: data.website || '',
        permitNumber: data.permitNumber || '',
        generalEmail: data.generalEmail || '',
        bookingEmail: data.bookingEmail || '',
        supportEmail: data.supportEmail || ''
      });
      if (data.logo?.url) {
        setLogoPreview(data.logo.url);
      }
    } catch (error) {
      toast.error('Failed to fetch company profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'address' || key === 'city' || key === 'state' || key === 'zipCode' || key === 'country') {
          formDataToSend.append(`address[${key}]`, formData[key]);
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      if (logo) formDataToSend.append('logo', logo);

      await axios.put(
        `${import.meta.env.VITE_URL}/company-profile/profile`,
        formDataToSend,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      toast.success('Company profile updated successfully!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <SectionTitle>Company Information</SectionTitle>

      {/* Logo Upload */}
      <div>
        <FieldLabel>Company Logo</FieldLabel>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <div className="relative">
              <img src={logoPreview} alt="Logo" className="w-20 h-20 object-cover rounded-lg border" />
              <button type="button" onClick={removeLogo} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div>
            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm transition-colors">
              Upload Logo
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
            </label>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG (max 5MB)</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <FieldLabel>Company Name</FieldLabel>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputCls} required />
        </div>

        <div>
          <FieldLabel>Phone Number</FieldLabel>
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={inputCls} />
        </div>

        <div>
          <FieldLabel>Email Address</FieldLabel>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputCls} />
        </div>

        <div>
          <FieldLabel>Street Address</FieldLabel>
          <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>City</FieldLabel>
            <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <FieldLabel>State/Province</FieldLabel>
            <input type="text" name="state" value={formData.state} onChange={handleChange} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Zip/Postal Code</FieldLabel>
            <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <FieldLabel>Country</FieldLabel>
            <select name="country" value={formData.country} onChange={handleChange} className={`${inputCls} bg-white`}>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="AU">Australia</option>
              <option value="PK">Pakistan</option>
              <option value="AE">UAE</option>
            </select>
          </div>
        </div>

        <div>
          <FieldLabel>Website URL</FieldLabel>
          <input type="text" name="website" value={formData.website} onChange={handleChange} className={inputCls} />
        </div>

        <div>
          <FieldLabel>Permit #</FieldLabel>
          <input type="text" name="permitNumber" value={formData.permitNumber} onChange={handleChange} className={inputCls} />
        </div>

        <SectionTitle>Additional Details</SectionTitle>

        <div>
          <FieldLabel>General Email</FieldLabel>
          <input type="email" name="generalEmail" value={formData.generalEmail} onChange={handleChange} className={inputCls} />
        </div>

        <div>
          <FieldLabel>Booking Email</FieldLabel>
          <input type="email" name="bookingEmail" value={formData.bookingEmail} onChange={handleChange} className={inputCls} />
        </div>

        <div>
          <FieldLabel>Support Email</FieldLabel>
          <input type="email" name="supportEmail" value={formData.supportEmail} onChange={handleChange} className={inputCls} />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default Company;