// src/pages/CRM.jsx
import React, { useState, useEffect } from 'react';
import { Users, Phone, Mail, Calendar, MessageSquare, User, Plus } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CRM = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_URL}/crm/insights`, { withCredentials: true });
      setCustomers(res.data.data?.recentContacts || []);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const selectCustomer = async (id) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_URL}/crm/customer/${id}`, { withCredentials: true });
      setSelectedCustomer(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch customer details');
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    try {
      await axios.post(
        `${import.meta.env.VITE_URL}/crm/customer/${selectedCustomer.contact._id}/note`,
        { text: note },
        { withCredentials: true }
      );
      toast.success('Note added');
      setNote('');
      selectCustomer(selectedCustomer.contact._id);
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="flex h-screen">
      {/* Left - Customer List */}
      <div className="w-80 border-r bg-white overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="font-bold text-gray-900">Customers</h2>
          <p className="text-sm text-gray-500">{customers.length} contacts</p>
        </div>
        {customers.map(c => (
          <div
            key={c._id}
            onClick={() => selectCustomer(c._id)}
            className="p-3 border-b hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {c.firstName?.[0]}{c.lastName?.[0]}
              </div>
              <div>
                <p className="font-medium text-sm">{c.firstName} {c.lastName}</p>
                <p className="text-xs text-gray-500">{c.email}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Right - Customer Details */}
      <div className="flex-1 bg-gray-50 overflow-y-auto p-6">
        {selectedCustomer ? (
          <>
            <div className="bg-white rounded-lg border p-6 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{selectedCustomer.contact.firstName} {selectedCustomer.contact.lastName}</h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {selectedCustomer.contact.email}</span>
                    <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {selectedCustomer.contact.phone}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Joined {new Date(selectedCustomer.contact.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Trips</p>
                  <p className="text-2xl font-bold">{selectedCustomer.reservations?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Trips */}
            <div className="bg-white rounded-lg border p-6 mb-4">
              <h3 className="font-semibold mb-3">Recent Trips</h3>
              {selectedCustomer.reservations?.length === 0 ? (
                <p className="text-sm text-gray-500">No trips yet</p>
              ) : (
                selectedCustomer.reservations?.slice(0, 5).map(r => (
                  <div key={r._id} className="border-b py-2 flex justify-between">
                    <div>
                      <p className="font-medium">{r.reservationNumber}</p>
                      <p className="text-sm text-gray-500">{r.vehicle?.name} • {new Date(r.pickupDateTime).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      r.status === 'completed' ? 'bg-green-100 text-green-700' :
                      r.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{r.status}</span>
                  </div>
                ))
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold mb-3">Notes</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 border rounded px-3 py-2 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addNote()}
                />
                <button onClick={addNote} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                  Add
                </button>
              </div>
              {selectedCustomer.contact.notes?.map((n, i) => (
                <div key={i} className="border-b py-2 text-sm">
                  <p>{n.text}</p>
                  <p className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p>Select a customer to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CRM;