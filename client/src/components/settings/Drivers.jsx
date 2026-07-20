import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, User, Phone, Mail, Calendar, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const inputCls = `border rounded w-full px-4 py-2.5 border-gray-400/50 outline-none
  placeholder:text-gray-400 hover:border-black
  focus:ring-2 focus:ring-blue-600/90 focus:border-transparent
  transition-all duration-200 text-sm`;

const FieldLabel = ({ children }) => (
  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
    {children}
  </p>
);

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    hireDate: '',
    licenseNumber: '',
    licenseExpiry: '',
    garageLocation: '',
    notes: '',
    isAvailable: true,
    isActive: true
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/driver/list`
      );
      setDrivers(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch drivers');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, GIF, WEBP)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setProfilePicture(null);
    setProfilePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error('First name, last name and phone are required');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('firstName', formData.firstName);
    formDataToSend.append('lastName', formData.lastName);
    formDataToSend.append('phone', formData.phone);
    if (formData.email) formDataToSend.append('email', formData.email);
    if (formData.hireDate) formDataToSend.append('hireDate', formData.hireDate);
    if (formData.licenseNumber) formDataToSend.append('licenseNumber', formData.licenseNumber);
    if (formData.licenseExpiry) formDataToSend.append('licenseExpiry', formData.licenseExpiry);
    if (formData.garageLocation) formDataToSend.append('garageLocation', formData.garageLocation);
    if (formData.notes) formDataToSend.append('notes', formData.notes);
    formDataToSend.append('isAvailable', formData.isAvailable);
    formDataToSend.append('isActive', formData.isActive);
    
    if (profilePicture) {
      formDataToSend.append('profilePicture', profilePicture);
    }

    try {
      let response;
      if (editingDriver) {
        response = await axios.put(
          `${import.meta.env.VITE_URL}/driver/update/${editingDriver._id}`,
          formDataToSend,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_URL}/driver/create`,
          formDataToSend,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      }
      
      toast.success(response.data.message);
      setShowForm(false);
      setEditingDriver(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        hireDate: '',
        licenseNumber: '',
        licenseExpiry: '',
        garageLocation: '',
        notes: '',
        isAvailable: true,
        isActive: true
      });
      setProfilePicture(null);
      setProfilePreview(null);
      fetchDrivers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save driver');
      console.error('Submit error:', error);
    }
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      firstName: driver.firstName || '',
      lastName: driver.lastName || '',
      email: driver.email || '',
      phone: driver.phone || '',
      hireDate: driver.hireDate?.split('T')[0] || '',
      licenseNumber: driver.licenseNumber || '',
      licenseExpiry: driver.licenseExpiry?.split('T')[0] || '',
      garageLocation: driver.garageLocation || '',
      notes: driver.notes || '',
      isAvailable: driver.isAvailable !== undefined ? driver.isAvailable : true,
      isActive: driver.isActive !== undefined ? driver.isActive : true
    });
    if (driver.profilePicture?.url) {
      setProfilePreview(driver.profilePicture.url);
    }
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_URL}/driver/delete/${id}`
      );
      toast.success(response.data.message);
      fetchDrivers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete driver');
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_URL}/driver/update/${id}`,
        { isAvailable: !currentStatus }
      );
      toast.success(`Driver ${!currentStatus ? 'available' : 'unavailable'}`);
      fetchDrivers();
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your drivers and their information
          </p>
        </div>
        <button
          onClick={() => {
            setEditingDriver(null);
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              hireDate: '',
              licenseNumber: '',
              licenseExpiry: '',
              garageLocation: '',
              notes: '',
              isAvailable: true,
              isActive: true
            });
            setProfilePicture(null);
            setProfilePreview(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Driver
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : drivers.length > 0 ? (
        <div className="space-y-4">
          {drivers.map((driver) => (
            <div key={driver._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Profile Picture */}
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {driver.profilePicture?.url ? (
                      <img 
                        src={driver.profilePicture.url} 
                        alt={driver.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-gray-600">
                        {getInitials(driver.firstName, driver.lastName)}
                      </span>
                    )}
                  </div>

                  {/* Driver Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">
                        {driver.firstName} {driver.lastName}
                      </h3>
                      {driver.isAvailable ? (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Available
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Unavailable
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-0.5 text-sm text-gray-500">
                      {driver.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {driver.phone}
                        </span>
                      )}
                      {driver.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {driver.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAvailability(driver._id, driver.isAvailable)}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      driver.isAvailable 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {driver.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                  </button>
                  <button
                    onClick={() => handleEdit(driver)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(driver._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg">No drivers added yet</p>
          <p className="text-sm">Click "Add Driver" to add your first driver</p>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-gray-600/60 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {editingDriver ? 'Edit Driver' : 'Add Driver'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingDriver(null);
                  setProfilePicture(null);
                  setProfilePreview(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Profile Picture */}
              <div>
                <FieldLabel>Profile Picture</FieldLabel>
                <div className="flex items-center gap-4">
                  {profilePreview ? (
                    <div className="relative">
                      <img
                        src={profilePreview}
                        alt="Profile preview"
                        className="w-20 h-20 rounded-full object-cover border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm transition-colors">
                      Upload Photo
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                    </label>
                    <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WEBP (max 5MB)</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>First Name</FieldLabel>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="First name"
                    required
                  />
                </div>
                <div>
                  <FieldLabel>Last Name</FieldLabel>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Phone Number</FieldLabel>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="+1 234 567 890"
                    required
                  />
                </div>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="driver@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Hire Date</FieldLabel>
                  <input
                    type="date"
                    name="hireDate"
                    value={formData.hireDate}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>
                <div>
                  <FieldLabel>License Number</FieldLabel>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="License number"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>License Expiry</FieldLabel>
                <input
                  type="date"
                  name="licenseExpiry"
                  value={formData.licenseExpiry}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>

              <div>
                <FieldLabel>Garage Location</FieldLabel>
                <input
                  type="text"
                  name="garageLocation"
                  value={formData.garageLocation}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Where does the driver start from?"
                />
              </div>

              <div>
                <FieldLabel>Notes</FieldLabel>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className={`${inputCls} resize-none`}
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Available for trips</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Active driver</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingDriver(null);
                    setProfilePicture(null);
                    setProfilePreview(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingDriver ? 'Update Driver' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;