import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Building2, Mail, Phone, MapPin } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../../components/contacts/Header';
import CompanyForm from '../../components/contacts/CompanyForm';
import CompanyUpdateForm from '../../components/contacts/CompanyUpdateForm';

// Company Card Component
const CompanyCard = ({ company, onClick }) => {
  return (
    <div
      className='w-full p-4 flex items-center bg-white mb-2 hover:bg-gray-50 
        rounded transition border border-gray-400/20 cursor-pointer'
      onClick={() => onClick(company._id)}
    >
      {/* Company Photo */}
      <div className='w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 mr-4'>
                  {company.photo?.url ? (
            <img
              src={`${import.meta.env.VITE_URL}${company.photo.url}`}
              alt={company.name}
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center bg-blue-50'>
              <Building2 className='w-6 h-6 text-blue-600' />
            </div>
          )}
      </div>

      {/* Company Info */}
      <div className='flex-1 min-w-0'>
        <h3 className='text-sm font-semibold text-gray-900 truncate'>
          {company.name}
        </h3>
        <div className='flex items-center gap-4 mt-0.5'>
          {company.email && (
            <div className='flex items-center text-xs text-gray-500'>
              <Mail className='w-3 h-3 mr-1 flex-shrink-0' />
              <span className='truncate'>{company.email}</span>
            </div>
          )}
          {company.phone && (
            <div className='flex items-center text-xs text-gray-500'>
              <Phone className='w-3 h-3 mr-1 flex-shrink-0' />
              <span>{company.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right side - show address or website */}
      <div className='flex-shrink-0 ml-4'>
        {company.address ? (
          <div className='flex items-center text-xs text-gray-400'>
            <MapPin className='w-3 h-3 mr-1' />
            <span className='truncate max-w-32'>{company.address}</span>
          </div>
        ) : company.website ? (
          <div className='text-xs text-gray-400 truncate max-w-32'>
            {company.website}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const Companies = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  // Check if we're on create or update route
  const isCreateRoute = location.pathname === '/companies/create';
  const isUpdateRoute = location.pathname.includes('/companies/update/');

  // Fetch companies
  const fetchCompanies = async (search = '') => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/company/list?search=${search}`
      );
      setCompanies(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch companies');
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    fetchCompanies(searchInput);
  };

  // Handle clear search
  const clearSearch = () => {
    setSearchInput('');
    fetchCompanies('');
  };

  // Handle company click - navigate to update
  const handleCompanyClick = (companyId) => {
    navigate(`/companies/update/${companyId}`);
  };

  // Handle create company
  const handleCreateCompany = () => {
    navigate('/companies/create');
  };


  // Refresh function -
  const refreshCompanies = () => {
    setSearchInput(''); // Clear search
    fetchCompanies(''); // Fetch all companies
  };


  return (
    <div className='h-screen bg-gray-50'>
      <Header />

      {/* Main Content */}
      <div className='px-8 py-4'>

        {/* Company List */}
        <div className='bg-sky-50/50 h-[calc(100vh-220px)] w-full px-4 py-2 overflow-y-auto'>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : companies.length > 0 ? (
            companies.map((company) => (
              <CompanyCard
                key={company._id}
                company={company}
                onClick={handleCompanyClick}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Building2 className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium">No companies found</p>
              <p className="text-sm">Click "Create Company" to add your first company</p>
            </div>
          )}
        </div>
      </div>

      {/* Company Update Form (Slide-in for Update) */}
      <CompanyForm onCompanyCreated={refreshCompanies} />

      <CompanyUpdateForm onCompanyUpdated={refreshCompanies}/>
    </div>
  );
};

export default Companies;