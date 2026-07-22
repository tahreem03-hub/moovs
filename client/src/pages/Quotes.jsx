// src/modules/quotes/pages/Quotes.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import QuotesDashboard from '../components/quotes/QuotesDashboard';
import QuotesDetails from '../components/quotes/QuotesDetails';
import QuoteForm from '../components/quotes/QuoteForm';

const Quotes = () => {
  const location = useLocation();
  const { id } = useParams();
  
  // ✅ Check if we're on create or edit route
  const isCreateRoute = location.pathname === '/quotes/create';
  const isEditRoute = location.pathname.includes('/quotes/edit/');
  const isDetailRoute = location.pathname.includes('/quotes/') && !isCreateRoute && !isEditRoute;
  
  const isFormOpen = isCreateRoute || isEditRoute;
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const dashboardRef = useRef();

  const refreshQuotes = () => {
    setRefreshTrigger(prev => prev + 1);
    if (dashboardRef.current) {
      dashboardRef.current.fetchQuotes();
    }
  };

  return (
    <div>
      <div className='flex'>
        <div>
          <QuotesDashboard 
            ref={dashboardRef} 
            key={refreshTrigger} 
          />
          {/* ✅ Pass isEdit mode and quote ID to form */}
          <QuoteForm 
            isFormOpen={isFormOpen} 
            isEdit={isEditRoute}
            quoteId={isEditRoute ? id : null}
           
          />
        </div>
        {/* ✅ Only show details when viewing a specific quote */}
        {isDetailRoute && <QuotesDetails />}
      </div>
    </div>
  );
};

export default Quotes;