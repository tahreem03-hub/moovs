import React, { useState } from 'react'
import { CalendarRange, CreditCard, Crown, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom';
const Login = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate()

    const handleSubmit = () => {
        e.preventDefault();
        console.log(password, email)
    }
    return (
        <div className='bg-sky-200/50 flex flex-col md:flex-row'>


            {/* left side */}
            <div className='relative bg-gray-900 rounded-3xl p-10 m-8 overflow-hidden max-w-175'>

                <div className='bg-orange-300/30 rounded-full absolute -bottom-10 -left-10 h-50 w-50'></div>

                <div className='bg-blue-300/30 rounded-full absolute -top-20 -right-20 h-80 w-80'></div>


                {/* why flex worked when written in div instead of icon */}
                <div className='rounded-2xl border border-gray-500/80 bg-gray-700 h-17 w-17 flex items-center justify-center mb-7'>
                    <Crown className='w-6 h-6 text-white ' />
                </div>

                <h1 className='rounded-2xl border border-gray-500/80 bg-gray-700 text-white text-md font-medium mb-7 pl-3 h-8 w-75 flex items-center'> Supreme Limo and Car Service</h1>

                <p className=' text-white text-4xl font-bold mb-7'> Welcome back to your operations hub.</p>

                <p className=' text-white/70 text-md mb-7'>
                    Sign in to manage dispatch, reservations, vehicles, invoices, and client activity from one place.
                </p>

                <div className='bg-gray-600/50  mb-2 rounded-2xl border border-gray-500/80 flex p-4 '>
                    <ShieldCheck className='w-6 h-6 text-white/70 ' />
                    <p className='text-white/70 ml-3 font-medium'>Track rides, drivers, and customer updates in real time.</p>
                </div>

                <div className='bg-gray-600/50  mb-2 rounded-2xl border border-gray-500/80 flex p-4'>
                    <CalendarRange className='w-6 h-6 text-white/70 ' />
                    <p className='text-white/70 ml-3 font-medium'>Keep daily schedules, reservations, and quotes aligned.</p>
                </div>

                <div className='bg-gray-600/50  mb-2 rounded-2xl border border-gray-500/80 flex p-4'>
                    <CreditCard className='w-6 h-6 text-white/70 ' />
                    <p className='text-white/70 ml-3 font-medium'>Stay on top of invoices and follow-ups without switching tools.</p>
                </div>


            </div>

            {/* right side form */}
            {/* when i remove py it did no =t get centenred with flex rpoperties what's making its width when width is not even defined */}
            <div className='bg-white rounded-3xl flex flex-col justify-center m-8 md:my-8 md:mx-0 py-5 px-20 w-auto h-auto'>

                <div>
                    <h1 className='my-2 text-blue-600 text-sm font-bold'>LOGIN</h1>
                    <h1 className='my-2 text-4xl font-bold '>Sign in</h1>
                    <h1 className='my-2 text-gray-500'>Use your work email and password to continue.</h1>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className='flex justify-start flex-col'>

                    <div className='mt-2 flex flex-col'>
                        <label htmlFor="email" className='text-sm font-bold mb-2'>Email address</label>
                        <input
                            className='border border-gray-300 rounded-2xl pl-3 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors outline-none'
                            type="email"
                            placeholder='name@company.com'
                            name='email' id='email'
                            value={email}
                            required
                            onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    <div className='mt-2 flex flex-col'>
                        <label htmlFor="password" className='text-sm font-bold mb-2'>Password</label>
                        <input
                            className='border border-gray-300 rounded-2xl pl-3 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors outline-none'
                            type="password"
                            placeholder='Enter your password'
                            name='password' id='password'
                            value={password}
                            required
                            onChange={(e) => setPassword(e.target.value)} />
                    </div>

                    <div className='my-3 flex justify-between'>
                        <div>
                            <input
                                className='border border-gray-300 rounded-2xl w-5 py-3 '
                                type="checkbox"
                                name='remember-me' id='remember-me'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)} />

                            <label htmlFor="remember-me" className='text-sm text-gray-500 mb-2 pl-2'>Remeber Me</label>

                        </div>
                        <span className='font-bold text-blue-600'
                        onClick={() => navigate('/forgot-password')}>Forgot Password?</span>
                    </div>

                    <div className='mt-2 flex flex-col'>
                        <button 
                        className='h-12 rounded-2xl bg-blue-600 text-white text-md font-bold'
                        onClick={handleSubmit}>Login to dashboard</button>
                    </div>

                    <div className='mt-2 flex flex-col'>
                        <h1 className='text-gray-600'>New Here? <span className='text-blue-600 font-bold' onClick={()=>navigate('/register')}>Create an account</span></h1>
                    </div>


                </form>

            </div >
        </div >
    )
}

export default Login
