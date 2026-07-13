import React, { useState } from 'react'
import { CalendarRange, CarFrontIcon, CreditCard, Crown, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios'
import { toast } from "react-hot-toast";
const Register = () => {

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [company, setCompany] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = {
            Fname: firstName,
            Lname: lastName,
            email: email,
            CompanyName: company,
            password: password
        };

        try {
            const response = await axios.post('http://localhost:8000/user/register', data);
            if (response && response.data) {
                toast.success(response.data.message);
                setLastName("");
                setFirstName("");
                setCompany("");
                setEmail("");
                setPassword("");
            } else {
                toast.error("Unexpected response from server.")
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || "something went wrong!";
            toast.error(errorMessage);
        }
    }

    return (
        <div className='bg-sky-200/50 flex flex-col md:flex-row'>


            {/* left side */}
            <div className='relative bg-gray-900 rounded-3xl p-10 m-8 overflow-hidden max-w-175'>

                <div className='bg-orange-300/30 rounded-full absolute -bottom-10 -left-10 h-50 w-50'></div>

                <div className='bg-blue-300/30 rounded-full absolute -top-20 -right-20 h-80 w-80'></div>


                {/* why flex worked when written in div instead of icon */}
                <div className='rounded-2xl border border-gray-500/80 bg-gray-700 h-17 w-17 flex items-center justify-center mb-7'>
                    <CarFrontIcon className='w-6 h-6 text-white ' />
                </div>

                <h1 className='rounded-2xl border border-gray-500/80 bg-gray-700 text-white text-md font-medium mb-7 pl-3 h-8 w-75 flex items-center'>CREATE YOUR MOOVS WORKSPACE</h1>

                <p className=' text-white text-4xl font-bold mb-7'> Start organizing bookings and client service in one clean flow.</p>

                <p className=' text-white/70 text-md mb-7'>
                    Set up your team access and begin managing reservations, dispatch, and customer communication with confidence.
                </p>
                {/* that space y is affecting desktop screen also why? */}
                <div className='flex flex-col max-md:space-y-3 md:flex-row md:justify-between'>
                    <div className='bg-gray-600/50 rounded-2xl border border-gray-500/80 flex flex-col p-4 min-w-40'>
                        <h1 className='text-white font-extrabold text-lg '>24/7</h1>
                        <p className='text-white/70 text-sm'>booking visibility</p>
                    </div>

                    <div className='bg-gray-600/50 rounded-2xl border border-gray-500/80 flex flex-col p-4 min-w-40'>
                        <h1 className='text-white font-extrabold text-lg '>1 place</h1>
                        <p className='text-white/70 text-sm'>for teams and trips</p>
                    </div>

                    <div className='bg-gray-600/50 rounded-2xl border border-gray-500/80 flex flex-col p-4 min-w-40'>
                        <h1 className='text-white font-extrabold text-lg '>Fast</h1>
                        <p className='text-white/70 text-sm'>dispatch coordination</p>
                    </div>
                </div>


            </div>

            {/* right side form */}
            {/* when i remove py it did no =t get centenred with flex rpoperties what's making its width when width is not even defined */}
            <div className='bg-white rounded-3xl flex flex-col justify-center m-8 md:my-8 md:mx-0 py-5 px-20 w-auto h-auto'>

                <div>
                    <h1 className='my-2 text-blue-600 text-sm font-bold'>Register</h1>
                    <h1 className='my-2 text-4xl font-bold '>Sign in</h1>
                    <h1 className='my-2 text-gray-500'>Use your work email and password to continue.</h1>
                </div>

                {/* yha likhna h handle submit? */}
                <form
                    onSubmit={handleSubmit}
                    className='flex justify-start flex-col'>

                    <div className='flex space-x-2'>
                        <div className='mt-2 flex flex-col'>
                            <label htmlFor="firstName" className='text-sm font-bold mb-2'>First Name</label>
                            <input
                                className='border border-gray-300 rounded-2xl pl-3 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors outline-none'
                                type="text"
                                placeholder='Tahreem'
                                name='firstName' id='firstName'
                                value={firstName}
                                required
                                onChange={(e) => setFirstName(e.target.value)} />
                        </div>
                        <div className='mt-2 flex flex-col'>
                            <label htmlFor="lastName" className='text-sm font-bold mb-2'>Last Name</label>
                            <input
                                className='border border-gray-300 rounded-2xl pl-3 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors outline-none'
                                type="text"
                                placeholder='Noor'
                                name='lastName' id='lastName'
                                value={lastName}
                                required
                                onChange={(e) => setLastName(e.target.value)} />
                        </div>
                    </div>

                    <div className='mt-2 flex flex-col'>
                        <label htmlFor="email" className='text-sm font-bold mb-2'>Work email</label>
                        <input
                            className='border border-gray-300 rounded-2xl pl-3 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors outline-none'
                            type="email"
                            placeholder='team@company.com'
                            name='email' id='email'
                            value={email}
                            required
                            onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    <div className='mt-2 flex flex-col'>
                        <label htmlFor="company" className='text-sm font-bold mb-2'>Company Name</label>
                        <input
                            className='border border-gray-300 rounded-2xl pl-3 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors outline-none'
                            type="text"
                            placeholder='Supreme Lemo'
                            name='company' id='company'
                            value={company}
                            required
                            onChange={(e) => setCompany(e.target.value)} />
                    </div>


                    <div className='flex space-x-2'>
                        <div className='mt-2 flex flex-col'>
                            <label htmlFor="password" className='text-sm font-bold mb-2'>Password</label>
                            <input
                                className='border border-gray-300 rounded-2xl pl-3 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors outline-none'
                                type="password"
                                placeholder='Create password'
                                name='password' id='password'
                                value={password}
                                required
                                onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <div className='mt-2 flex flex-col'>
                            <label htmlFor="confirmPassword" className='text-sm font-bold mb-2'>Confirm Password</label>
                            <input
                                className='border border-gray-300 rounded-2xl pl-3 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors outline-none'
                                type="password"
                                placeholder='Confirm password'
                                name='confirmPassword' id='confirmPassword'
                                value={confirmPassword}
                                required
                                onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>
                    </div>
                    <div className='my-3 flex justify-between'>
                        <div>
                            <input
                                className='border border-gray-300 rounded-2xl w-5 py-3 '
                                type="checkbox"
                                name='remember-me' id='remember-me'
                                value={password}
                                required
                                onChange={(e) => setPassword(e.target.value)} />

                            <label htmlFor="remember-me" className='text-sm text-gray-500 mb-2 pl-2'>I aggree to terms and privacy policy.</label>

                        </div>
                    </div>

                    <div className='mt-2 flex flex-col'>
                        <button
                            className='h-12 rounded-2xl bg-blue-600 text-white text-md font-bold'>Create Account</button>
                    </div>

                    <div className='mt-2 flex flex-col'>
                        <h1 className='text-gray-600'>Already have and account? <span className='text-blue-600 font-bold' onClick={() => navigate('/login')}>Sign in here</span></h1>
                    </div>


                </form>

            </div >
        </div >
    )
}

export default Register
