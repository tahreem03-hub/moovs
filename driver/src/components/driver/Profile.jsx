// driver-app/src/components/driver/Profile.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  User, Phone, Mail, Car, Shield, AlertCircle,
  Calendar as CalendarIcon, Loader2, Upload,
  X, CheckCircle, Clock, Eye, Download, Trash2,
  FileText, Image, Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { driverApi } from '../../services/api';

const Profile = () => {
  const [driver, setDriver] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [expiryDate, setExpiryDate] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
    loadDocuments();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await driverApi.getProfile();
      const driverData = response.data.data || response.data.user || response.data;
      setDriver(driverData);
      setFormData({
        firstName: driverData.Fname || driverData.firstName || '',
        lastName: driverData.Lname || driverData.lastName || '',
        phone: driverData.phone || '',
        email: driverData.email || '',
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Couldn\'t load profile');
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await driverApi.getDocuments();
      setDocuments(response.data.data || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Couldn\'t load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType) {
      toast.error('Please select a file and document type');
      return;
    }

    try {
      setUploading(true);
      await driverApi.uploadDocument(
        selectedFile,
        selectedDocType,
        expiryDate || null,
        getDisplayNameForType(selectedDocType)
      );
      toast.success('Document uploaded successfully');
      setShowUploadModal(false);
      setSelectedFile(null);
      setSelectedDocType('');
      setExpiryDate('');
      await loadDocuments();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm('Delete this document?')) return;

    try {
      await driverApi.deleteDocument(docId);
      toast.success('Document deleted');
      await loadDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Profile updated successfully');
      setIsEditing(false);
      await loadProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: driver?.Fname || driver?.firstName || '',
      lastName: driver?.Lname || driver?.lastName || '',
      phone: driver?.phone || '',
      email: driver?.email || '',
    });
  };

  const getDocumentIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return Image;
    return FileText;
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        color: 'bg-[#B8860B]/10 text-[#B8860B]',
        icon: Clock,
        label: 'Pending Review'
      },
      approved: {
        color: 'bg-[#0B5C48]/10 text-[#0B5C48]',
        icon: CheckCircle,
        label: 'Verified'
      },
      expired: {
        color: 'bg-[#B42318]/10 text-[#B42318]',
        icon: X,
        label: 'Expired'
      },
      rejected: {
        color: 'bg-[#B42318]/10 text-[#B42318]',
        icon: X,
        label: 'Rejected'
      }
    };
    return configs[status] || configs.pending;
  };

  const isExpiring = (expiryDate) => {
    if (!expiryDate) return false;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[120px] rounded-2xl border border-[#EEEFF2] bg-white animate-pulse motion-reduce:animate-none"
          />
        ))}
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E1E3E8] bg-white/60 px-6 py-16 text-center">
        <User className="mx-auto h-12 w-12 text-[#D6D9DF]" />
        <p className="mt-3 text-[15px] font-medium text-[#14181F]">No profile data</p>
        <p className="mt-1 text-sm text-[#8A909C]">We couldn't load your profile information</p>
        <button
          onClick={loadProfile}
          className="mt-4 rounded-full bg-[#14181F] px-6 py-2 text-sm font-medium text-white transition hover:bg-[#2A2F38]"
        >
          Try again
        </button>
      </div>
    );
  }

  const fullName = `${formData.firstName} ${formData.lastName}`.trim() || 'Driver';

  return (
    <div className="max-w-4xl text-[#14181F]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-none tracking-[-0.02em]">Profile</h1>
          <p className="mt-2 text-sm text-[#8A909C]">
            {driver.role || 'Driver'} · {driver.isActive ? 'Active' : 'Inactive'}
          </p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition
            ${isEditing
              ? 'border border-[#E8E9ED] bg-white text-[#14181F] hover:border-[#14181F]'
              : 'bg-[#14181F] text-white hover:bg-[#2A2F38]'
            }`}
        >
          {isEditing ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Edit2 className="h-4 w-4" />
              Edit profile
            </>
          )}
        </button>
      </div>

      {/* Profile Card */}
      <form onSubmit={handleSubmit} className="mt-6">
        <div className="rounded-2xl border border-[#E8E9ED] bg-white overflow-hidden">
          {/* Profile Header */}
          <div className="p-6 sm:p-8 border-b border-[#F0F1F3]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="h-20 w-20 rounded-full bg-[#F5F5F3] flex items-center justify-center border-2 border-[#E8E9ED]">
                  {driver.profilePicture?.url ? (
                    <img
                      src={driver.profilePicture.url}
                      alt={fullName}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-[#8A909C]" />
                  )}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white 
                  ${driver.isActive ? 'bg-[#0B5C48]' : 'bg-[#B8860B]'}`}
                />
              </div>

              {/* Name & Details */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-[#14181F]">
                  {isEditing ? (
                    <div className="flex flex-wrap gap-3">
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="First name"
                        className="min-w-[120px] rounded-lg border border-[#E8E9ED] px-3 py-1.5 text-sm outline-none 
                                 focus:border-[#0B5C48] focus:ring-2 focus:ring-[#0B5C48]/15"
                        required
                      />
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Last name"
                        className="min-w-[120px] rounded-lg border border-[#E8E9ED] px-3 py-1.5 text-sm outline-none 
                                 focus:border-[#0B5C48] focus:ring-2 focus:ring-[#0B5C48]/15"
                        required
                      />
                    </div>
                  ) : (
                    fullName
                  )}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[#6B7280]">
                  <span className="capitalize">{driver.role || 'Driver'}</span>
                  <span className="text-[#D6D9DF]">·</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium 
                    ${driver.isActive ? 'text-[#0B5C48]' : 'text-[#B8860B]'}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full 
                      ${driver.isActive ? 'bg-[#0B5C48]' : 'bg-[#B8860B]'}`}
                    />
                    {driver.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {driver.subscriptionPlan && (
                    <>
                      <span className="text-[#D6D9DF]">·</span>
                      <span className="text-xs capitalize text-[#8A909C]">
                        {driver.subscriptionPlan} · {driver.subscriptionStatus}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Save/Cancel buttons when editing */}
              {isEditing && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-full border border-[#E8E9ED] px-4 py-2 text-sm font-medium text-[#6B7280] 
                             transition hover:border-[#14181F] hover:text-[#14181F]"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-full bg-[#14181F] px-5 py-2 text-sm font-medium 
                             text-white transition hover:bg-[#2A2F38] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* Contact Information */}
            <section>
              <h3 className="text-sm font-medium text-[#3A414D] mb-4">Contact information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProfileField
                  icon={Phone}
                  label="Phone"
                  value={formData.phone}
                  isEditing={isEditing}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <ProfileField
                  icon={Mail}
                  label="Email"
                  value={formData.email}
                  isEditing={isEditing}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  type="email"
                />
              </div>
            </section>

            {/* Additional Information */}
            {(driver.hireDate || driver.garageLocation || driver.licenseNumber) && (
              <section className="border-t border-[#F0F1F3] pt-6">
                <h3 className="text-sm font-medium text-[#3A414D] mb-4">Additional information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {driver.hireDate && (
                    <InfoItem
                      icon={CalendarIcon}
                      label="Hire date"
                      value={new Date(driver.hireDate).toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    />
                  )}
                  {driver.garageLocation && (
                    <InfoItem
                      icon={Car}
                      label="Garage location"
                      value={driver.garageLocation}
                    />
                  )}
                  {driver.licenseNumber && (
                    <InfoItem
                      icon={Shield}
                      label="License number"
                      value={driver.licenseNumber}
                    />
                  )}
                  {driver.licenseExpiry && (
                    <InfoItem
                      icon={AlertCircle}
                      label="License expiry"
                      value={new Date(driver.licenseExpiry).toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    />
                  )}
                </div>
              </section>
            )}

            {/* Documents Section */}
            <section className="border-t border-[#F0F1F3] pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-medium text-[#3A414D]">Documents</h3>
                  <p className="text-xs text-[#8A909C] mt-0.5">Required documents for verification</p>
                </div>
                <button
                  type='button'
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#0B5C48] px-4 py-2 text-sm font-medium 
                           text-white transition hover:bg-[#0A4D3B]"
                >
                  <Upload className="h-4 w-4" />
                  Upload document
                </button>
              </div>

              {documents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#E1E3E8] bg-white/60 px-6 py-8 text-center">
                  <FileText className="mx-auto h-10 w-10 text-[#D6D9DF]" />
                  <p className="mt-2 text-sm text-[#6B7280]">No documents uploaded</p>
                  <p className="text-xs text-[#8A909C]">Upload your documents for verification</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => {
                    const Icon = getDocumentIcon(doc.mimeType);
                    const statusConfig = getStatusConfig(doc.status);
                    const expiring = isExpiring(doc.expiryDate);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <div
                        key={doc._id}
                        className={`rounded-xl border p-4 transition ${expiring
                            ? 'border-[#B8860B]/30 bg-[#B8860B]/5'
                            : 'border-[#F0F1F3] bg-[#FAFAFA] hover:border-[#E8E9ED]'
                          }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <div className="rounded-lg bg-white p-2 shrink-0">
                              <Icon className="h-5 w-5 text-[#0B5C48]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-[#14181F] truncate">
                                  {doc.displayName || doc.filename}
                                </p>
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.color}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig.label}
                                </span>
                                {expiring && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#B8860B]/10 px-2 py-0.5 text-xs font-medium text-[#B8860B]">
                                    <Clock className="h-3 w-3" />
                                    Expiring soon
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#8A909C]">
                                <span className="truncate max-w-[120px]">{doc.filename}</span>
                                {doc.fileSize && (
                                  <>
                                    <span className="text-[#D6D9DF]">·</span>
                                    <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                                  </>
                                )}
                                {doc.expiryDate && (
                                  <>
                                    <span className="text-[#D6D9DF]">·</span>
                                    <span>Expires: {new Date(doc.expiryDate).toLocaleDateString()}</span>
                                  </>
                                )}
                                <span className="text-[#D6D9DF]">·</span>
                                <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                              </div>
                              {doc.rejectionReason && (
                                <p className="text-xs text-[#B42318] mt-1">
                                  Rejection: {doc.rejectionReason}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={doc.viewUrl || doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="View Document"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            {/* Use downloadUrl for downloading */}
                            <a
                              href={doc.downloadUrl || doc.fileUrl}
                              download={doc.filename}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Download Document"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleDelete(doc._id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Notes */}
            {driver.notes && (
              <section className="border-t border-[#F0F1F3] pt-6">
                <h3 className="text-sm font-medium text-[#3A414D] mb-2">Notes</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{driver.notes}</p>
              </section>
            )}

            {/* Account Info */}
            <section className="border-t border-[#F0F1F3] pt-6">
              <h3 className="text-sm font-medium text-[#3A414D] mb-4">Account details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <InfoItem
                  label="Member since"
                  value={driver.createdAt ? new Date(driver.createdAt).toLocaleDateString(undefined, {
                    month: 'long',
                    year: 'numeric'
                  }) : 'N/A'}
                />
                <InfoItem
                  label="Plan"
                  value={driver.subscriptionPlan ? `${driver.subscriptionPlan.charAt(0).toUpperCase() + driver.subscriptionPlan.slice(1)} plan` : 'Free'}
                />
                <InfoItem
                  label="Status"
                  value={
                    <span className={`inline-flex items-center gap-1.5 text-sm font-medium 
                      ${driver.subscriptionStatus === 'active' || driver.subscriptionStatus === 'trial'
                        ? 'text-[#0B5C48]' : 'text-[#8A909C]'}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full 
                        ${driver.subscriptionStatus === 'active' || driver.subscriptionStatus === 'trial'
                          ? 'bg-[#0B5C48]' : 'bg-[#D6D9DF]'}`}
                      />
                      {driver.subscriptionStatus || 'Inactive'}
                    </span>
                  }
                />
              </div>
            </section>
          </div>
        </div>
      </form>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#14181F]">Upload Document</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setSelectedDocType('');
                  setExpiryDate('');
                }}
                className="p-1 rounded-lg hover:bg-[#F5F5F3] transition"
              >
                <X className="h-5 w-5 text-[#6B7280]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#3A414D] mb-1.5 block">
                  Document type *
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full rounded-xl border border-[#E8E9ED] px-4 py-2.5 text-sm outline-none 
                           focus:border-[#0B5C48] focus:ring-2 focus:ring-[#0B5C48]/15 transition"
                >
                  <option value="">Select type...</option>
                  <option value="license">Driver's License</option>
                  <option value="insurance">Insurance</option>
                  <option value="background_check">Background Check</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-[#3A414D] mb-1.5 block">
                  File *
                </label>
                <div className="border-2 border-dashed border-[#E8E9ED] rounded-xl p-6 text-center hover:border-[#0B5C48]/50 transition">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div>
                      <FileText className="h-10 w-10 mx-auto text-[#0B5C48] mb-2" />
                      <p className="text-sm font-medium text-[#14181F]">{selectedFile.name}</p>
                      <p className="text-xs text-[#8A909C]">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="mt-2 text-sm text-[#B42318] hover:text-[#8A1A12] transition"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-10 w-10 mx-auto text-[#8A909C] mb-2" />
                      <p className="text-sm text-[#6B7280]">Click to upload or drag and drop</p>
                      <p className="text-xs text-[#9AA0AC] mt-1">PDF, JPG, PNG (Max 5MB)</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 rounded-full bg-[#14181F] px-4 py-2 text-sm font-medium text-white 
                                 transition hover:bg-[#2A2F38]"
                      >
                        Select file
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#3A414D] mb-1.5 block">
                  Expiry date <span className="text-[#8A909C]">(optional)</span>
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full rounded-xl border border-[#E8E9ED] px-4 py-2.5 text-sm outline-none 
                           focus:border-[#0B5C48] focus:ring-2 focus:ring-[#0B5C48]/15 transition"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setSelectedDocType('');
                  setExpiryDate('');
                }}
                className="flex-1 rounded-full border border-[#E8E9ED] py-2.5 text-sm font-medium text-[#6B7280] 
                         transition hover:border-[#14181F] hover:text-[#14181F]"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || !selectedDocType || uploading}
                className="flex-1 rounded-full bg-[#14181F] py-2.5 text-sm font-medium text-white 
                         transition hover:bg-[#2A2F38] flex items-center justify-center gap-2 
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Profile Field Component (editable)
const ProfileField = ({ icon: Icon, label, value, isEditing, onChange, type = 'text' }) => {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#F0F1F3] bg-[#FAFAFA] px-4 py-3 transition hover:border-[#E8E9ED]">
      <Icon className="h-5 w-5 text-[#8A909C] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#9AA0AC]">{label}</p>
        {isEditing ? (
          <input
            type={type}
            value={value}
            onChange={onChange}
            className="w-full bg-transparent text-sm font-medium text-[#14181F] outline-none 
                     focus:ring-2 focus:ring-[#0B5C48]/15 rounded"
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        ) : (
          <p className="text-sm font-medium text-[#14181F] truncate">{value || '—'}</p>
        )}
      </div>
    </div>
  );
};

// Info Item Component (read-only)
const InfoItem = ({ icon: Icon, label, value }) => {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#F0F1F3] bg-[#FAFAFA] px-4 py-3">
      {Icon && <Icon className="h-5 w-5 text-[#8A909C] shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#9AA0AC]">{label}</p>
        <p className="text-sm font-medium text-[#14181F] truncate">{value || '—'}</p>
      </div>
    </div>
  );
};

// Helper function
function getDisplayNameForType(type) {
  const names = {
    license: "Driver's License",
    insurance: "Insurance",
    background_check: "Background Check"
  };
  return names[type] || type;
}

export default Profile;