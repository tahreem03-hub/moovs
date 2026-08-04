// customer-frontend/src/pages/Register.jsx

import { useEffect } from "react";
import { useState } from "react";

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        operatorId: ''  // ← From URL
    });

    useEffect(() => {
        // Get operatorId from URL
        const params = new URLSearchParams(window.location.search);
        const operatorId = params.get('operatorId');
        
        if (!operatorId) {
            // No operatorId means invalid registration link
            alert('Invalid registration link. Please use the link provided by your operator.');
            window.location.href = '/login';
            return;
        }
        
        setFormData(prev => ({ ...prev, operatorId }));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const response = await api.post('/auth/register', formData);
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                window.location.href = '/dashboard';
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="register-page">
            <h2>Create Your Account</h2>
            <p>Register with {formData.operatorId ? 'your operator' : ''}</p>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                />
                <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                />
                <input
                    type="tel"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                />
                <button type="submit">Register</button>
            </form>
        </div>
    );
};

export default Register;