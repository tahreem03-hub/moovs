// src/modules/reservations/pages/Reservations.jsx
import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ReservationDashboard from '../components/reservations/ReservationDashboard';
import ReservationDetails from '../components/reservations/ReservationDetails';
import ReservationForm from '../components/reservations/ReservationForm';
import { Calendar } from 'lucide-react';

const Reservations = () => {
  const location = useLocation();
  const isCreateRoute = location.pathname === '/reservations/create';
  const isEditRoute = location.pathname.includes('/reservations/edit/');
  const isFormOpen = isCreateRoute || isEditRoute;
  const isDetailRoute = location.pathname.includes('/reservations/') && !isCreateRoute && !isEditRoute;

  const dashboardRef = useRef();

  const refreshDashboard = () => {
    if (dashboardRef.current) {
      dashboardRef.current.refresh();
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-80 flex-shrink-0 border-r border-gray-200 overflow-y-auto">
        <ReservationDashboard ref={dashboardRef} />
      </div>

      <div className="flex-1 overflow-hidden">
        {isDetailRoute ? (
          <ReservationDetails />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-screen text-gray-500 bg-gray-50">
            <Calendar className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg">Select a reservation to view details</p>
            <p className="text-sm">Click on any reservation from the list</p>
          </div>
        )}
      </div>

      <ReservationForm
        isFormOpen={isFormOpen}
        isEdit={isEditRoute}
        onSuccess={refreshDashboard}
      />
    </div>
  );
};

export default Reservations;