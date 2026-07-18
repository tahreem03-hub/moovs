import React, { useEffect } from 'react'
import { Routes, Route, useNavigate} from 'react-router-dom'
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


const App = () => {

  const navigate= useNavigate();

  useEffect(()=>navigate('/quotes'),[])


  return (
    <>
      <Toaster />

      <Routes>
        <Route path='/register' element={<Register />} />
        <Route path='/login' element={<Login />} />
{/* is there anyother way for create form */}
        <Route element={<Layout />}>
          <Route path='/quotes' element={<Quotes />} />
          <Route path="/quotes/create" element={<Quotes />} />

          <Route path='/reservations' element={<Reservations/>}/>
          <Route path='/dispatch' element={<Dispatch/>}/>
          <Route path='/driver-tracking' element={<DriverTracking/>}/>

          <Route path='/vehicles' element={<Vehicles/>}/>
          <Route path='/vehicles/create' element={<Vehicles/>}/>


          <Route path='/contacts' element={<Contacts/>}/>
          <Route path='/contacts/create' element={<Contacts/>}/>
          <Route path='/contact/update/:id' element={<Contacts/>}/>


          <Route path='/companies' element={<Companies/>}/>
          <Route path='/companies/create' element={<Companies/>}/>
          <Route path='/companies/update/:id' element={<Companies />} />
          
          <Route path='/affiliates' element={<Affiliates/>}/>
          <Route path='/affiliates/create' element={<Affiliates/>}/>

          <Route path='/invoices' element={<Invoices/>}/>
          <Route path='/payables' element={<Payables/>}/>
          <Route path='/crm' element={<CRM/>}/>



        </Route>


      </Routes>

    </>
  )
}

export default App
