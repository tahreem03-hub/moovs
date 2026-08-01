// driver-app/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import DriverDashboard from './pages/DriverDashboard';

function App() {
  return (
    <BrowserRouter basename="/driver">
      <Toaster/>
      <Routes>
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DriverDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;