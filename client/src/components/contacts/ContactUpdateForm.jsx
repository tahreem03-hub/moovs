import { X, CreditCard, User, Phone, Mail, MapPin, Building2, MoreVertical, Plus, Trash2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import axios from 'axios';
import toast from 'react-hot-toast';

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

const ContactUpdateForm = ({ onContactUpdated }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const formOpen = location.pathname.includes('/contact/update/');

  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    companyPosition: '',
    homeAddress: '',
    workAddress: '',
    phone: '',
    preferences: '',
    comment: '',
  });
  const [phone, setPhone] = useState('');
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  const tabs = ['PROFILE', 'TRIPS', 'PREFERENCES'];

  // Fetch companies for dropdown
  useEffect(() => {
    if (!formOpen) return;
    axios
      .get(`${import.meta.env.VITE_URL}/company/list`) // ✅ Singular
      .then((res) => setCompanies(res.data.data || []))
      .catch(() => setCompanies([]));
  }, [formOpen]);

  // Fetch contact data
  useEffect(() => {
    if (formOpen && id) {
      fetchContact();
    }
  }, [formOpen, id]);

  const fetchContact = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/contact/${id}` // ✅ Singular
      );
      const contact = response.data.data;
      
      setForm({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        email: contact.email || '',
        company: contact.company?._id || contact.company || '',
        companyPosition: contact.companyPosition || '',
        homeAddress: contact.homeAddress || '',
        workAddress: contact.workAddress || '',
        phone: contact.phone?.number || '',
        preferences: contact.preferences || '',
        comment: '',
      });
      setPhone(contact.phone?.number || '');
    } catch (error) {
      toast.error('Failed to fetch contact details');
      console.error('Error fetching contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const closeForm = () => {
    setActiveTab(0);
    setError('');
    navigate('/contacts');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.firstName || !form.lastName || !form.email || !phone) {
      setError('First name, last name, email and phone are required.');
      setActiveTab(0);
      return;
    }

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: { number: phone },
      company: form.company || null,
      companyPosition: form.companyPosition || '',
      homeAddress: form.homeAddress || '',
      workAddress: form.workAddress || '',
      preferences: form.preferences || '',
      comment: form.comment || '',
    };

    try {
      setSubmitting(true);
      const response = await axios.put(
        `${import.meta.env.VITE_URL}/contact/update/${id}`, // ✅ Singular
        payload
      );
      toast.success(response.data.message || 'Contact updated successfully!');
      if (onContactUpdated) {
        onContactUpdated();
      }
      closeForm();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_URL}/contact/delete/${id}` // ✅ Singular
      );
      toast.success(response.data.message || 'Contact deleted successfully!');
      if (onContactUpdated) {
        onContactUpdated();
      }
      closeForm();
    } catch (error) {
      toast.error('Failed to delete contact');
      console.error('Error deleting contact:', error);
    }
  };

  const getInitials = () => {
    return `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`.toUpperCase() || 'CN';
  };

  const handlePhoneChange = (value) => {
    setPhone(value);
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
        className={`absolute right-0 top-0 h-full w-[800px] max-w-full
          bg-white border shadow-xl overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          ${formOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-400/50 sticky top-0 bg-white z-10">
              <button
                type="button"
                onClick={closeForm}
                className="transition-transform duration-300 ease-out hover:rotate-90"
              >
                <X className="w-6 h-6 text-gray-600" strokeWidth={1.5} />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                {form.firstName} {form.lastName}
              </h1>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
                {showDeleteMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteMenu(false);
                        handleDelete();
                      }}
                      className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="relative flex h-12 px-6 border-b border-gray-200">
              {tabs.map((tag, index) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTab(index)}
                  className={`flex-1 text-sm font-semibold tracking-wide transition-colors duration-300
                    ${activeTab === index ? 'text-blue-600' : 'text-gray-600'}`}
                >
                  {tag}
                </button>
              ))}
              <span
                className="absolute bottom-0 left-6 h-0.5 bg-blue-600 transition-transform duration-300 ease-in-out"
                style={{
                  width: 'calc(33.33% - 32px)',
                  transform: `translateX(${activeTab * 100}%)`,
                }}
              />
            </div>

            {/* Body */}
            <div className="flex-1 px-6 py-6">
              {/* PROFILE TAB */}
              <div className={activeTab === 0 ? 'block' : 'hidden'}>
                {/* Profile Header */}
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-semibold text-gray-600">
                      {getInitials()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {form.firstName} {form.lastName}
                    </h2>
                    <p className="text-sm text-gray-500">{form.email}</p>
                    <p className="text-sm text-gray-500">{phone}</p>
                  </div>
                </div>

                {/* Basic Info */}
                <SectionTitle>Basic Info</SectionTitle>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>First Name</FieldLabel>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <FieldLabel>Last Name</FieldLabel>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                </div>

                <FieldLabel>Mobile Phone</FieldLabel>
                <div className="flex items-center w-full rounded border border-gray-400/50 px-4 py-2.5 hover:border-black focus-within:ring-2 focus-within:ring-blue-600/90 focus-within:border-transparent transition-all duration-200">
                  <PhoneInput
                    international
                    defaultCountry="US"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="Phone Number *"
                    className="flex items-center w-full [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:py-1"
                  />
                </div>

                <FieldLabel>Company</FieldLabel>
                <select
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  className={`${inputCls} bg-white`}
                >
                  <option value="">Select Company</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <FieldLabel>Company Position</FieldLabel>
                <input
                  type="text"
                  name="companyPosition"
                  value={form.companyPosition}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="e.g., CEO, Manager"
                />

                <FieldLabel>Email Address</FieldLabel>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={inputCls}
                />

                <SectionTitle>Address</SectionTitle>

                <FieldLabel>Home Address</FieldLabel>
                <input
                  type="text"
                  name="homeAddress"
                  value={form.homeAddress}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Home Address"
                />

                <FieldLabel>Work Address</FieldLabel>
                <input
                  type="text"
                  name="workAddress"
                  value={form.workAddress}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Work Address"
                />

                <SectionTitle>Credit Cards</SectionTitle>
                <button
                  type="button"
                  className="border border-dashed border-gray-300 rounded-lg w-full py-4 text-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
                >
                  <Plus className="w-5 h-5 inline mr-2" />
                  Add Card
                </button>

                <SectionTitle>Linked Passengers</SectionTitle>
                <button
                  type="button"
                  className="border border-blue-600 text-blue-600 rounded px-5 py-2.5 text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  Link Passenger
                </button>

                <SectionTitle>Internal Comments</SectionTitle>
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                    {getInitials()}
                  </div>
                  <input
                    type="text"
                    name="comment"
                    value={form.comment}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="Comment..."
                  />
                  <button
                    type="button"
                    className="bg-blue-600 text-white px-4 py-2.5 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Submit →
                  </button>
                </div>
              </div>

              {/* TRIPS TAB */}
              <div className={activeTab === 1 ? 'block' : 'hidden'}>
                <div className="flex items-center justify-center h-64 text-gray-400">
                  <div className="text-center">
                    <p className="text-lg">Trips</p>
                    <p className="text-sm">Coming soon...</p>
                  </div>
                </div>
              </div>

              {/* PREFERENCES TAB */}
              <div className={activeTab === 2 ? 'block' : 'hidden'}>
                <SectionTitle>Contact Preferences</SectionTitle>
                <p className="text-sm text-gray-600 mb-4">
                  Internal notes about this contact. Not visible to the customer.
                </p>
                <textarea
                  name="preferences"
                  value={form.preferences}
                  onChange={handleChange}
                  rows={8}
                  className={`${inputCls} resize-none`}
                  placeholder="Contact Preferences"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 mt-4 bg-red-50 border border-red-200 rounded px-4 py-2.5">
                  {error}
                </p>
              )}
            </div>

            {/* Sticky footer */}
            <div className="border-t border-gray-200 bg-gray-100/70 px-6 py-4 flex justify-end">
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
        )}
      </div>
    </div>
  );
};

export default ContactUpdateForm;