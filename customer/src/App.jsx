import React from 'react';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import { Toaster } from 'react-hot-toast';
import {Route, Routes} from 'react-router-dom'

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard';
import Trips from './pages/Trips';
import TripDetail from './pages/TripDetail';
import BookRide from './pages/BookRide';
import Payments from './pages/Payments';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Cashback from './pages/Cashback';
import Profile from './pages/Profile';

function App() {
    return (
        <>
                <Toaster position="top-right" />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Layout>
                                <Dashboard />
                            </Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <Layout>
                                <Dashboard />
                            </Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/trips" element={
                        <ProtectedRoute>
                            <Layout>
                                <Trips />
                            </Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/trips/:id" element={
                        <ProtectedRoute>
                            <Layout>
                                <TripDetail />
                            </Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/book-ride" element={
                        <ProtectedRoute>
                            <Layout>
                                <BookRide />
                            </Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/payments" element={
                        <ProtectedRoute>
                            <Layout>
                                <Payments />
                            </Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/invoices" element={
                        <ProtectedRoute>
                            <Layout>
                                <Invoices />
                            </Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/invoices/:id" element={
                        <ProtectedRoute>
                            <Layout>
                                <InvoiceDetail />
                            </Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/cashback" element={
                        <ProtectedRoute>
                            <Layout>
                                <Cashback />
                            </Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <Layout>
                                <Profile />
                            </Layout>
                        </ProtectedRoute>
                    } />
                </Routes>
            </>
    );
}

export default App;