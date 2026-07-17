import React from 'react'
import Header from '../../components/contacts/Header'
import ContactForm from '../../components/contacts/ContactForm'


const Contacts = () => {
    return (
        <div className='h-screen bg-gray-50'>
            <Header/>
            <ContactForm/>
        </div>
    )
}

export default Contacts