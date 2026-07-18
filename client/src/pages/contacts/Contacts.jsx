import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, User, Mail, Phone, MoreVertical, Edit2, Trash2, Eye } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../../components/contacts/Header';
import ContactForm from '../../components/contacts/ContactForm';
import ContactUpdateForm from '../../components/contacts/ContactUpdateForm';

// Contact Card Component
const ContactCard = ({ contact, onClick, onMenuClick }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'CN';
  };

  return (
    <div className='w-full p-4 flex items-center bg-white mb-2 hover:bg-gray-50 rounded transition border border-gray-400/20'>
      {/* Clickable area for opening contact */}
      <div 
        className='flex-1 flex items-center min-w-0 cursor-pointer'
        onClick={() => onClick(contact._id)}
      >
        {/* Avatar */}
        <div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mr-4'>
          <span className='text-sm font-semibold text-gray-600'>
            {getInitials(contact.firstName, contact.lastName)}
          </span>
        </div>

        {/* Contact Info */}
        <div className='flex-1 min-w-0'>
          <h3 className='text-sm font-semibold text-gray-900'>
            {contact.firstName} {contact.lastName}
          </h3>
          <div className='flex items-center gap-4 mt-0.5'>
            {contact.email && (
              <div className='flex items-center text-xs text-gray-500'>
                <Mail className='w-3 h-3 mr-1 flex-shrink-0' />
                <span className='truncate'>{contact.email}</span>
              </div>
            )}
            {contact.phone?.number && (
              <div className='flex items-center text-xs text-gray-500'>
                <Phone className='w-3 h-3 mr-1 flex-shrink-0' />
                <span>{contact.phone.number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Company Name */}
        {contact.company?.name && (
          <div className='flex-shrink-0 ml-4 text-xs text-gray-400'>
            {contact.company.name}
          </div>
        )}
      </div>

      {/* 3-dot menu */}
      <div className='relative flex-shrink-0 ml-4'>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className='p-2 hover:bg-gray-100 rounded-full transition-colors'
        >
          <MoreVertical className='w-5 h-5 text-gray-400' />
        </button>

        {showMenu && (
          <div className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10'>
            <button
              onClick={() => {
                setShowMenu(false);
                onMenuClick('view', contact._id);
              }}
              className='w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2'
            >
              <Eye className='w-4 h-4 text-gray-500' />
              View Contact
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                onMenuClick('edit', contact._id);
              }}
              className='w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2'
            >
              <Edit2 className='w-4 h-4 text-blue-500' />
              Edit
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                onMenuClick('delete', contact._id);
              }}
              className='w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-red-600'
            >
              <Trash2 className='w-4 h-4' />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Contacts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Check if we're on create or update route
  const isCreateRoute = location.pathname === '/contact/create';
  const isUpdateRoute = location.pathname.includes('/contact/update/');

  // Fetch contacts
  const fetchContacts = async (search = '') => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/contact/list?search=${search}`
      );
      setContacts(response.data.data || []);
      setPagination({
        page: response.data.pagination?.page || 1,
        limit: response.data.pagination?.limit || 10,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 0,
      });
    } catch (error) {
      toast.error('Failed to fetch contacts');
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchContacts(searchInput);
  };

  // Clear search
  const clearSearch = () => {
    setSearchInput('');
    fetchContacts('');
  };

  // Handle contact click - navigate to update
  const handleContactClick = (contactId) => {
    navigate(`/contact/update/${contactId}`);
  };

  // Handle create contact
  const handleCreateContact = () => {
    navigate('/contact/create');
  };

  // Refresh contacts
  const refreshContacts = () => {
    setSearchInput('');
    fetchContacts('');
  };

  // Handle menu actions
  const handleMenuAction = (action, contactId) => {
    if (action === 'edit') {
      navigate(`/contact/update/${contactId}`);
    } else if (action === 'view') {
      navigate(`/contact/update/${contactId}`);
    } else if (action === 'delete') {
      handleDeleteContact(contactId);
    }
  };

  // Delete contact
  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_URL}/contact/delete/${contactId}`
      );
      toast.success(response.data.message || 'Contact deleted successfully!');
      refreshContacts();
    } catch (error) {
      toast.error('Failed to delete contact');
      console.error('Error deleting contact:', error);
    }
  };

  return (
    <div className='h-screen bg-gray-50'>
      <Header />
      
      {/* Main Content */}
      <div className='px-8 py-4'>
        

        {/* Contact List */}
        <div className='bg-sky-50/50 h-[calc(100vh-220px)] w-full px-4 py-2 overflow-y-auto'>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : contacts.length > 0 ? (
            <>
              {contacts.map((contact) => (
                <ContactCard 
                  key={contact._id} 
                  contact={contact} 
                  onClick={handleContactClick}
                  onMenuClick={handleMenuAction}
                />
              ))}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 py-2">
                  <button
                    onClick={() => fetchContacts(searchInput)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => fetchContacts(searchInput)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <User className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium">No contacts found</p>
              <p className="text-sm">Click "Create Contact" to add your first contact</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Form (Slide-in for Create) */}
      <ContactForm onContactCreated={refreshContacts} />
      
      {/* Contact Update Form (Slide-in for Update) */}
      <ContactUpdateForm onContactUpdated={refreshContacts} />
    </div>
  );
};

export default Contacts;