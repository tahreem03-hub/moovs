import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, User, Mail, Shield, CheckCircle, XCircle } from 'lucide-react';
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

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'dispatcher',
    permissions: [],
    isActive: true
  });

  const permissionOptions = [
    { value: 'view_reservations', label: 'View Reservations' },
    { value: 'create_reservations', label: 'Create Reservations' },
    { value: 'edit_reservations', label: 'Edit Reservations' },
    { value: 'delete_reservations', label: 'Delete Reservations' },
    { value: 'manage_drivers', label: 'Manage Drivers' },
    { value: 'manage_vehicles', label: 'Manage Vehicles' },
    { value: 'manage_settings', label: 'Manage Settings' },
    { value: 'manage_members', label: 'Manage Members' },
    { value: 'view_reports', label: 'View Reports' }
  ];

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/member/list`
      );
      setMembers(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch members');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePermissionToggle = (permission) => {
    setFormData(prev => {
      const permissions = prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission];
      return { ...prev, permissions };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('First name, last name and email are required');
      return;
    }

    try {
      let response;
      if (editingMember) {
        response = await axios.put(
          `${import.meta.env.VITE_URL}/member/update/${editingMember._id}`,
          formData
        );
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_URL}/member/create`,
          formData
        );
      }
      
      toast.success(response.data.message);
      setShowForm(false);
      setEditingMember(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'dispatcher',
        permissions: [],
        isActive: true
      });
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save member');
      console.error('Submit error:', error);
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      email: member.email || '',
      role: member.role || 'dispatcher',
      permissions: member.permissions || [],
      isActive: member.isActive !== undefined ? member.isActive : true
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_URL}/member/delete/${id}`
      );
      toast.success(response.data.message);
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete member');
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      dispatcher: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return `px-2 py-1 rounded text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-800'}`;
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage team members and their permissions
          </p>
        </div>
        <button
          onClick={() => {
            setEditingMember(null);
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              role: 'dispatcher',
              permissions: [],
              isActive: true
            });
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : members.length > 0 ? (
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-600">
                      {getInitials(member.firstName, member.lastName)}
                    </span>
                  </div>

                  {/* Member Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">
                        {member.firstName} {member.lastName}
                      </h3>
                      <span className={getRoleBadge(member.role)}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                      {member.isActive ? (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-0.5 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </span>
                      {member.lastLogin && (
                        <span className="flex items-center gap-1 text-xs">
                          Last login: {formatDate(member.lastLogin)}
                        </span>
                      )}
                    </div>
                    {member.permissions && member.permissions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {member.permissions.slice(0, 3).map((perm) => (
                          <span key={perm} className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                            {perm.replace('_', ' ')}
                          </span>
                        ))}
                        {member.permissions.length > 3 && (
                          <span className="text-xs text-gray-400">+{member.permissions.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(member)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member._id)}
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
          <p className="text-lg">No team members added yet</p>
          <p className="text-sm">Click "Add Member" to invite your first team member</p>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-gray-600/60 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {editingMember ? 'Edit Member' : 'Add Member'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingMember(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

              <div>
                <FieldLabel>Email Address</FieldLabel>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="member@example.com"
                  required
                />
              </div>

              <div>
                <FieldLabel>Role</FieldLabel>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`${inputCls} bg-white`}
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="viewer">Viewer</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Admin: Full access • Manager: Manage operations • Dispatcher: Handle trips • Viewer: Read-only
                </p>
              </div>

              <div>
                <FieldLabel>Permissions</FieldLabel>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg">
                  {permissionOptions.map((perm) => (
                    <label key={perm.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.value)}
                        onChange={() => handlePermissionToggle(perm.value)}
                        className="w-4 h-4"
                      />
                      {perm.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Active Member</span>
                </label>
                <p className="text-xs text-gray-400 mt-1">
                  Inactive members cannot log in or access the system
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingMember(null);
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
                  {editingMember ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;