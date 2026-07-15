import React, { useState } from 'react'
import ReservationDashboard from '../components/reservations/ReservationDashboard'
import ReservationDetails from '../components/reservations/ReservationDetails'
import ReservationForm from '../components/reservations/ReservationForm';
import { useLocation } from 'react-router-dom';

const Reservations = () => {
  const location = useLocation();
  const isFormOpen = location.pathname === "/reservations/create"


  return (

    <div>

      {/* if it is desktop screen then show both of them side
      in mobile screen only show Reservations dashboard on clicking a
      quote move towards Reservations details */}

      <div className='flex'>

        <div>
          <ReservationDashboard />
          <ReservationForm isFormOpen={isFormOpen} />
        </div>

        <ReservationDetails/>

      </div>


    </div>
  )
}

export default Reservations
