import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [contact, setContact] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await api.get('/profile');
            if (response.data.success) {
                setUser(response.data.data.user);
                setContact(response.data.data.contact);
                setIsAuthenticated(true);
            }
        } catch (error) {
            setUser(null);
            setContact(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            
            if (response.data.success) {
                // Token is set in cookie by backend
                // User data comes in response
                setUser(response.data.user);
                setContact(response.data.user?.contact || null);
                setIsAuthenticated(true);
                return response.data;
            }
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    };

    const register = async (data) => {
        try {
            const response = await api.post('/auth/register', data);
            if (response.data.success) {
                setUser(response.data.user);
                setContact(response.data.user?.contact || null);
                setIsAuthenticated(true);
                return response.data;
            }
        } catch (error) {
            console.error('❌ Register error:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    };

    const logout = async () => {
        try {
            await api.get('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        }
        setUser(null);
        setContact(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{
            user,
            contact,
            loading,
            login,
            register,
            logout,
            isAuthenticated
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};