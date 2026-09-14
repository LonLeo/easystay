import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Listings from './pages/Listings';
import PropertyDetails from './pages/PropertyDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Favourites from './pages/Favourites';
import OwnerListings from './pages/OwnerListings';
import CreateProperty from './pages/CreateProperty';
import EditProperty from './pages/EditProperty';
import AdminPanel from './pages/AdminPanel';

export const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-screen">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
    return children;
};

const AppRoutes = () => (
    <>
        <Navbar />
        <main>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/listings" element={<Listings />} />
                <Route path="/properties/:id" element={<PropertyDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/favourites" element={<ProtectedRoute><Favourites /></ProtectedRoute>} />
                <Route path="/my-listings" element={<ProtectedRoute roles={['owner', 'admin']}><OwnerListings /></ProtectedRoute>} />
                <Route path="/create-listing" element={<ProtectedRoute roles={['owner', 'admin']}><CreateProperty /></ProtectedRoute>} />
                <Route path="/edit-listing/:id" element={<ProtectedRoute roles={['owner', 'admin']}><EditProperty /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />
            </Routes>
        </main>
        <Footer />
    </>
);

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
}