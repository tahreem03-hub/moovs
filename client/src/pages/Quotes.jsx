import React, { useState } from 'react'
import QuotesDashboard from '../components/quotes/QuotesDashboard'
import QuotesDetails from '../components/quotes/QuotesDetails'
import QuoteForm from '../components/quotes/QuoteForm';
import { useLocation } from 'react-router-dom';

const Quotes = () => {
  const location = useLocation();
  const isFormOpen = location.pathname === "/quotes/create"


  return (

    <div>

      {/* if it is desktop screen then show both of them side
      in mobile screen only show quotes dashboard on clicking a
      quote move towards quotes details */}

      <div className='flex'>

        <div>
          <QuotesDashboard />
          <QuoteForm isFormOpen={isFormOpen} />
        </div>
        <QuotesDetails />

      </div>


    </div>
  )
}

export default Quotes
