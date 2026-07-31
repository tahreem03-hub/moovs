import React, { useEffect, useState } from 'react'
import { CalendarRange, CreditCard, Crown, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'
import axios from 'axios'
import { useAuth } from "../context/AuthContext";

const Login = () => {
    const { loadUser } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();
    // disable the login button while logging in
    const [loading, setLoading] = useState(false);


    const redirectUser = (role) => {
        switch (role) {
            case "admin":
                navigate("/admin");
                break;
            case "user":
                navigate("/quotes");
                break;
            case "driver":
                const driverAppUrl = import.meta.env.VITE_DRIVER_APP_URL || 'http://localhost:5174';
               window.location.href = `${driverAppUrl}/driver/dashboard`;
            default:
                navigate("/login");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true)
        try {
            const user = {
                email,
                password,
            };

            const response = await axios.post(
                `${import.meta.env.VITE_URL}/user/login`,
                user,
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success(response.data.message);
                setEmail("");
                setPassword("");
                const me = await loadUser();

                if (me) {
                    redirectUser(me.role);
                }
            }

        } catch (error) {
            // If regular login fails, try driver login
            if (error.response?.status === 401 || error.response?.status === 404) {
                try {
                    const driverResponse = await axios.post(
                        `${import.meta.env.VITE_URL}/driver/login`,
                        { email, password },
                        { withCredentials: true } // This should set cookies
                    );

                    if (driverResponse.data.success) {
                        toast.success(driverResponse.data.message);
                        setEmail("");
                        setPassword("");

                        // Load user using the existing cookie-based auth
                        const me = await loadUser();

                        if (me?.role === "driver") {
                            redirectUser("driver");  
                        } else {
                            toast.error("Driver login failed. Please try again.");
                        }
                    }
                } catch (driverError) {
                    toast.error(driverError.response?.data?.message || "Invalid credentials");
                }
            } else {
                toast.error(error.response?.data?.message || error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkUser = async () => {
            const me = await loadUser();

            if (me) {
                redirectUser(me.role);
            }
        };

        checkUser();
    }, [navigate]);

    return (
        <div className='bg-sky-200/50 flex flex-col md:flex-row'>

            {/* left side */}
            <div className='relative bg-gray-900 rounded-3xl p-10 m-8 overflow-hidden max-w-175'>

                <div className='bg-orange-300/30 rounded-full absolute -bottom-10 -left-10 h-50 w-50'></div>

                <div className='bg-blue-300/30 rounded-full absolute -top-20 -right-20 h-80 w-80'></div>

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
                                type="checkbox"
                                id="remember-me"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />

                            <label htmlFor="remember-me" className='text-sm text-gray-500 mb-2 pl-2'>Remeber Me</label>

                        </div>
                        <button
                            type="button"
                            className="font-bold text-blue-600"
                            onClick={() => navigate("/forgot-password")}
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <div className='mt-2 flex flex-col'>
                        <button disabled={loading}
                            className='h-12 rounded-2xl bg-blue-600 text-white text-md font-bold'>
                            {loading ? "Logging in..." : "Login to dashboard"}
                        </button>
                    </div>

                    <div className='mt-2 flex flex-col'>
                        <h1 className='text-gray-600'>New Here? <button
                            type='button'
                            className='text-blue-600 font-bold'
                            onClick={() => navigate('/register')}>
                            Create an account
                        </button>
                        </h1>
                    </div>

                </form>

            </div >
        </div >
    )
}

export default Login