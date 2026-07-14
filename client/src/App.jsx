import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Register from './pages/Register'
import { Toaster } from "react-hot-toast";


import Login from './pages/Login'
import Quotes from './pages/Quotes';
import Layout from './pages/Layout';


const App = () => {
  return (
    <>
      <Toaster />

      <Routes>
        <Route path='/register' element={<Register />} />
        <Route path='/login' element={<Login />} />

        <Route element={<Layout />}>
          <Route path='/quotes' element={<Quotes />} />
        </Route>


      </Routes>

    </>
  )
}

export default App
