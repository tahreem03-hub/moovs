// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        try {
            const { data } = await axios.get(
                `${import.meta.env.VITE_URL}/user/me`,
                { withCredentials: true }
            );
            setUser(data.user);
            return data.user;
        } catch {
            setUser(null);
            return null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadUser(); }, []);

    const logout = async () => {
        await axios.get(`${import.meta.env.VITE_URL}/user/logout`, { withCredentials: true });
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, loadUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);