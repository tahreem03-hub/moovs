import React from 'react'
import { useLocation } from 'react-router-dom'

const ContactForm = () => {
    const location=useLocation();
    const formOpen = location.pathname === '/contacts/create'
  return (
    <div className={`${formOpen? "opacity-100 visible": "opacity-0 invisible"}`}>
        <div className='bg-gray-600/60 absolute inset-0'></div>
        
      
    </div>
  )
}

export default ContactForm
