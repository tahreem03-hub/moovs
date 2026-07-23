import React, { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Register from './pages/Register'
import { Toaster } from "react-hot-toast";


import Login from './pages/Login'
import Quotes from './pages/Quotes';
import Layout from './pages/Layout';
import Reservations from './pages/Reservations';
import Dispatch from './pages/Dispatch';
import DriverTracking from './pages/DriverTracking';
import Vehicles from './pages/Vehicles';
import Contacts from './pages/contacts/Contacts';
import Invoices from './pages/Invoices';
import Payables from './pages/Payables';
import CRM from './pages/CRM';
import Companies from './pages/contacts/Companies';
import Affiliates from './pages/contacts/Affiliates';
import Settings from './pages/Settings';


import General from './components/settings/Genaral';
import CustomerPortal from './components/settings/customerPortal/CustomerPortal';
import Cancellation from './components/settings/Cancellation';
import Insurance from './components/settings/Insurance';
import Terms from './components/settings/Terms';
import Drivers from './components/settings/Drivers';
import Members from './components/settings/Members';
import ZonePricing from './components/settings/ZonePricing';
import TripRules from './components/settings/TripRules';
import Website from './components/settings/Website';
import MoovsMarket from './components/settings/MoovsMarket';
import Billing from './components/settings/Billing';
import Academy from './components/settings/Academy';
import TripRuleForm from './components/settings/TripRuleForm';


import ProtectedRoute from './shared/ProtectedRoute';
import AdminLayout from './modules/admin/layout/AdminLayout';
import { AdminDashboard, Operators, OperatorDetail } from './modules/admin';
import Plans from './modules/admin/pages/Plans';
import Subscriptions from './modules/admin/pages/Subscriptions';




const App = () => {

  return (
    <>
      <Toaster />

      <Routes>
        <Route path='/register' element={<Register />} />
        <Route path='/login' element={<Login />} />
        {/* is there anyother way for create form */}
        <Route element={<ProtectedRoute requiredRole="user" />}>
          <Route element={<Layout />}>
            <Route path='/quotes' element={<Quotes />} />
            <Route path="/quotes/create" element={<Quotes />} />

            <Route path='/reservations' element={<Reservations />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/reservations/create" element={<Reservations />} />



            <Route path='/dispatch' element={<Dispatch />} />
            <Route path='/driver-tracking' element={<DriverTracking />} />

            <Route path='/vehicles' element={<Vehicles />} />
            <Route path='/vehicles/create' element={<Vehicles />} />
            <Route path='/vehicles/update/:id' element={<Vehicles />} />



            <Route path='/contacts' element={<Contacts />} />
            <Route path='/contacts/create' element={<Contacts />} />
            <Route path='/contact/update/:id' element={<Contacts />} />


            <Route path='/companies' element={<Companies />} />
            <Route path='/companies/create' element={<Companies />} />
            <Route path='/companies/update/:id' element={<Companies />} />

            <Route path='/affiliates' element={<Affiliates />} />
            <Route path='/affiliates/create' element={<Affiliates />} />

            <Route path='/invoices' element={<Invoices />} />
            <Route path='/payables' element={<Payables />} />
            <Route path='/crm' element={<CRM />} />


            <Route path="/quotes/edit/:id" element={<Quotes />} />
            <Route path="/quotes/:id" element={<Quotes />} />

            <Route path="/reservations/edit/:id" element={<Reservations />} />
            <Route path="/reservations/:id" element={<Reservations />} />



          </Route>


          <Route path="/settings" element={<Settings />}>
            <Route index element={<General />} />  {/* /settings */}
            <Route path="general" element={<General />} />  {/* /settings/general */}


            <Route path="/settings/customer-portal" element={<CustomerPortal />} />
            <Route path="/settings/customer-portal" element={<CustomerPortal />}>
              <Route index element={<CustomerPortal />} />
            </Route>
            <Route path="cancellation" element={<Cancellation />} />
            <Route path="insurance" element={<Insurance />} />
            <Route path="terms" element={<Terms />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="members" element={<Members />} />
            <Route path="zone-pricing" element={<ZonePricing />} />

            <Route path="trip-rules" element={<TripRules />} />
            <Route path="trip-rules/create" element={<TripRuleForm />} />
            <Route path="trip-rules/edit/:id" element={<TripRuleForm />} />

            <Route path="website" element={<Website />} />
            <Route path="moovs-market" element={<MoovsMarket />} />
            <Route path="billing" element={<Billing />} />
            <Route path="academy" element={<Academy />} />
          </Route>

        </Route>


        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/operators" element={<Operators />} />
            <Route path="/admin/plans" element={<Plans />} />
            <Route path="/admin/operators/create" element={<Operators />} />
            <Route path='/admin/subscriptions' element={<Subscriptions />} />
            <Route path="/admin/operators/:id" element={<OperatorDetail />} />
            <Route path="/admin/operators/:id/edit" element={<Operators />} />
          </Route>
        </Route>

      </Routes>

    </>
  )
}

export default App
