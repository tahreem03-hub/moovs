import React from 'react'
import QuotesDashboard from '../components/QuotesDashboard'
import QuotesDetails from '../components/QuotesDetails'

const Quotes = () => {
  return (
    <div className='w-[calc(100% - 786px)]'>

      {/* if it is desktop screen then show both of them side
      in mobile screen only show quotes dashboard on clicking a
      quote move towards quotes details */}

      <QuotesDashboard/>
      <QuotesDetails/>
      
    </div>
  )
}

export default Quotes
