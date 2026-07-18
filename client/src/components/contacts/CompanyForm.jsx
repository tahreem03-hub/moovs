import { X } from 'lucide-react';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

/* Shared input styling */
const inputCls = `border rounded w-full px-4 py-3 border-gray-400/50 outline-none
  placeholder:text-gray-400 hover:border-black
  focus:ring-2 focus:ring-blue-600/90 focus:border-transparent
  transition-all duration-200`;

const SectionTitle = ({ children }) => (
  <h2 className="text-sm mt-6 mb-2 font-bold tracking-wide text-black/90 uppercase">
    {children}
  </h2>
);

const FieldLabel = ({ children }) => (
  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-1.5 mt-4">
    {children}
  </p>
);

const CompanyForm = ({ onCompanyCreated }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const formOpen = location.pathname === '/companies/create';

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    description: '',
  });

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, GIF, WEBP)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  const closeForm = () => {
    setForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      website: '',
      description: '',
    });
    setPhoto(null);
    setPhotoPreview(null);
    setError('');
    navigate('/companies');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.name.trim()) {
      setError('Company name is required.');
      return;
    }

    const formData = new FormData();
    formData.append('name', form.name.trim());
    formData.append('phone', form.phone.trim());
    formData.append('email', form.email.trim());
    formData.append('address', form.address.trim());
    formData.append('website', form.website.trim());
    formData.append('description', form.description.trim());

    if (photo) {
      formData.append('photo', photo);
    }

    try {
      setSubmitting(true);
      const response = await axios.post(
        `${import.meta.env.VITE_URL}/company/create`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      toast.success(response.data.message || 'Company created successfully!');
      if (onCompanyCreated) {
        onCompanyCreated(); // This will refresh the list without page reload
      }

      closeForm();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300
        ${formOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
    >
      {/* Dimmed backdrop */}
      <div className="absolute inset-0 bg-gray-600/60" onClick={closeForm} />

      {/* Slide-in panel */}
      <div
        className={`absolute right-0 top-0 h-full w-[600px] max-w-full
          bg-white border shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${formOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-7 border-b border-gray-400/50">
            <button
              type="button"
              onClick={closeForm}
              className="transition-transform duration-300 ease-out hover:rotate-90"
            >
              <X className="w-6 h-6 text-gray-600" strokeWidth={1.5} />
            </button>
            <h1 className="text-md text-black/90 font-bold">Add New Company</h1>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-7 pb-8">
            {/* Company Photo */}
            <SectionTitle>Company Photo</SectionTitle>

            {photoPreview ? (
              <div className="relative inline-block mt-2">
                <img
                  src={photoPreview}
                  alt="Company preview"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-xs text-gray-500 mt-1">Add Photo</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handlePhotoChange}
                  />
                </label>
                <p className="text-xs text-gray-400 mt-2">
                  Click to upload a new photo.
                  <br />
                  JPEG/PNG files only
                </p>
              </div>
            )}

            {/* Basic Info */}
            <SectionTitle>Basic Info</SectionTitle>

            <FieldLabel>Company Name *</FieldLabel>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className={inputCls}
              placeholder="Enter company name"
            />

            <FieldLabel>Phone Number</FieldLabel>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={inputCls}
              placeholder="Enter phone number"
            />

            <FieldLabel>Company Email</FieldLabel>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={inputCls}
              placeholder="Enter company email"
            />

            <FieldLabel>Company Address</FieldLabel>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className={inputCls}
              placeholder="Enter company address"
            />

            <FieldLabel>Company Website</FieldLabel>
            <input
              type="text"
              name="website"
              value={form.website}
              onChange={handleChange}
              className={inputCls}
              placeholder="Enter company website"
            />

            <SectionTitle>Description</SectionTitle>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className={`${inputCls} resize-none mt-2`}
              placeholder="Enter company description..."
            />

            {error && (
              <p className="text-sm text-red-600 mt-4 bg-red-50 border border-red-200 rounded px-4 py-2.5">
                {error}
              </p>
            )}
          </div>

          {/* Sticky footer */}
          <div className="border-t border-gray-200 bg-gray-100/70 px-7 py-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white font-medium rounded px-8 py-2.5
                hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed
                transition-colors duration-200"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyForm;