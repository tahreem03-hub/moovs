import { X, CreditCard } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import axios from 'axios';
import toast from 'react-hot-toast';

/* Shared input styling so every field stays consistent */
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

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  companyPosition: '',
  homeAddress: '',
  workAddress: '',
  cardNumber: '',
  billingFullName: '',
  billingCountry: 'US',
  billingAddress: '',
  cardholderEmail: '',
  additionalNotes: '',
  preferences: '',
  comment: '',
};

/* Very light client-side brand detection — only display metadata is stored */
const detectBrand = (num) => {
  const n = num.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  if (/^6(?:011|5)/.test(n)) return 'discover';
  return 'other';
};

const ContactForm = ({onContactCreated}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const formOpen = location.pathname === '/contacts/create';

  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [phone, setPhone] = useState('');
  const [companies, setCompanies] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const tabs = ['CONTACT INFO', 'PREFERENCES'];

  /* Companies for the dropdown */
  useEffect(() => {
    if (!formOpen) return;
    axios
      .get(`${import.meta.env.VITE_URL}/company/list`)
      .then((res) => setCompanies(res.data.data || []))
      .catch(() => setCompanies([]));
  }, [formOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardNumber = (e) => {
    /* Keep digits only, group in 4s for readability */
    const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    setForm((prev) => ({ ...prev, cardNumber: formatted }));
  };

  const closeForm = () => {
    setForm(initialForm);
    setPhone('');
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

    /*
     * PCI note: never send/store the raw card number.
     * In production, tokenize with your gateway (e.g. stripe.createPaymentMethod)
     * and send only the returned token + display metadata.
     */
    const cardDigits = form.cardNumber.replace(/\s/g, '');
    const paymentMethod = cardDigits
      ? {
          gateway: 'stripe',
          gatewayPaymentMethodId: '', // TODO: replace with gateway token
          brand: detectBrand(cardDigits),
          last4: cardDigits.slice(-4),
          billing: {
            fullName: form.billingFullName,
            country: form.billingCountry,
            address: form.billingAddress,
            cardholderEmail: form.cardholderEmail,
            additionalNotes: form.additionalNotes,
          },
          isDefault: true,
        }
      : null;

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: { number: phone },
      company: form.company || null,
      companyPosition: form.companyPosition,
      homeAddress: form.homeAddress,
      workAddress: form.workAddress,
      paymentMethods: paymentMethod ? [paymentMethod] : [],
      preferences: form.preferences,
      comment: form.comment,
    };

    try {
      setSubmitting(true);
      const response = await axios.post(`${import.meta.env.VITE_URL}/contact/create`, payload);
      toast.success(response.data.message);
      closeForm();

       if (onContactCreated) {
        onContactCreated(); // This will refresh the list without page reload
      }
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
      setError(
        err.response?.data?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const initials = form.firstName && form.lastName 
    ? `${form.firstName[0]}${form.lastName[0]}`.toUpperCase()
    : 'CN';

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
            <h1 className="text-md text-black/90 font-bold">Add New Contact</h1>
          </div>

          {/* Tabs */}
          <div className="relative flex h-12 px-7 border-b border-gray-200">
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
              className="absolute bottom-0 left-7 h-0.5 bg-blue-600 transition-transform duration-300 ease-in-out"
              style={{
                width: 'calc(50% - 28px)',
                transform: `translateX(${activeTab * 100}%)`,
              }}
            />
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-7 pb-8">
            {/* ---------------- CONTACT INFO TAB ---------------- */}
            <div className={activeTab === 0 ? 'block' : 'hidden'}>
              <SectionTitle>Basic Info</SectionTitle>

              <div className="flex gap-3">
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  className={`${inputCls} my-2`}
                  placeholder="First Name *"
                />
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  className={`${inputCls} my-2`}
                  placeholder="Last Name *"
                />
              </div>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className={`${inputCls} my-2`}
                placeholder="Email *"
              />

              {/* Phone with country flag dropdown */}
              <div
                className="flex items-center w-full my-2 rounded border border-gray-400/50
                  px-4 py-2.5 hover:border-black
                  focus-within:ring-2 focus-within:ring-blue-600/90 focus-within:border-transparent
                  transition-all duration-200
                  [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:py-1
                  [&_.PhoneInputInput]:placeholder:text-gray-400"
              >
                <PhoneInput
                  international
                  defaultCountry="US"
                  value={phone}
                  onChange={setPhone}
                  placeholder="Phone Number *"
                  className="flex items-center w-full"
                />
              </div>

              <SectionTitle>Optional Info</SectionTitle>

              <select
                name="company"
                value={form.company}
                onChange={handleChange}
                className={`${inputCls} my-2 bg-white text-gray-600
                  ${form.company ? 'text-black' : 'text-gray-400'}`}
              >
                <option value="">Company</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                name="homeAddress"
                value={form.homeAddress}
                onChange={handleChange}
                className={`${inputCls} my-2`}
                placeholder="Home Address"
              />
              <input
                type="text"
                name="workAddress"
                value={form.workAddress}
                onChange={handleChange}
                className={`${inputCls} my-2`}
                placeholder="Work Address"
              />
              <input
                type="text"
                name="companyPosition"
                value={form.companyPosition}
                onChange={handleChange}
                className={`${inputCls} my-2`}
                placeholder="Company Position"
              />

              <SectionTitle>Billing</SectionTitle>

              <FieldLabel>Card Number</FieldLabel>
              <div
                className="flex items-center w-full rounded border border-gray-400/50
                  px-4 py-3 hover:border-black
                  focus-within:ring-2 focus-within:ring-blue-600/90 focus-within:border-transparent
                  transition-all duration-200"
              >
                <CreditCard className="w-5 h-5 text-gray-400 mr-3" strokeWidth={1.5} />
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={form.cardNumber}
                  onChange={handleCardNumber}
                  className="flex-1 outline-none placeholder:text-gray-400"
                  placeholder="Card number"
                />
              </div>

              <FieldLabel>Billing Information</FieldLabel>

              <p className="text-sm text-black/90 mb-1">Full name</p>
              <input
                type="text"
                name="billingFullName"
                value={form.billingFullName}
                onChange={handleChange}
                className={inputCls}
              />

              <p className="text-sm text-black/90 mb-1 mt-4">Country or region</p>
              <select
                name="billingCountry"
                value={form.billingCountry}
                onChange={handleChange}
                className={`${inputCls} bg-white`}
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="PK">Pakistan</option>
                <option value="AE">United Arab Emirates</option>
                <option value="other">Other</option>
              </select>

              <p className="text-sm text-black/90 mb-1 mt-4">Address</p>
              <input
                type="text"
                name="billingAddress"
                value={form.billingAddress}
                onChange={handleChange}
                className={inputCls}
              />

              <FieldLabel>Cardholder Email (Optional)</FieldLabel>
              <input
                type="email"
                name="cardholderEmail"
                value={form.cardholderEmail}
                onChange={handleChange}
                className={inputCls}
              />

              <FieldLabel>Additional Notes (Optional)</FieldLabel>
              <textarea
                name="additionalNotes"
                value={form.additionalNotes}
                onChange={handleChange}
                rows={2}
                className={`${inputCls} resize-none`}
              />

              {/* Internal Comments */}
              <SectionTitle>Internal Comments</SectionTitle>
              <div className="flex items-center gap-3 pt-1">
                <div
                  className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center
                    text-xs font-semibold text-gray-600 shrink-0"
                >
                  {initials}
                </div>
                <input
                  type="text"
                  name="comment"
                  value={form.comment}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Comment..."
                />
              </div>
            </div>

            {/* ---------------- PREFERENCES TAB ---------------- */}
            <div className={activeTab === 1 ? 'block' : 'hidden'}>
              <h2 className="text-xl font-bold text-black/90 mt-6">
                Contact Preferences
              </h2>
              <p className="text-gray-600 mt-1 mb-4">
                Internal notes about this contact. Not visible to the customer.
              </p>
              <textarea
                name="preferences"
                value={form.preferences}
                onChange={handleChange}
                rows={5}
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

          {/* Sticky footer — Save is shared by both tabs */}
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

export default ContactForm;