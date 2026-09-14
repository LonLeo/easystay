import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout, isAdmin, isOwner } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/'); };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="EasyStay logo">
                        <rect width="32" height="32" rx="8" fill="#01696f" />
                        <path d="M16 6L6 14v12h7v-7h6v7h7V14L16 6z" fill="white" />
                    </svg>
                    <span>EasyStay</span>
                </Link>
            </div>
            <div className="navbar-links">
                <Link to="/listings">Browse</Link>
                {user ? (
                    <>
                        <Link to="/favourites">Favourites</Link>
                        <Link to="/dashboard">Dashboard</Link>
                        {isOwner && <Link to="/my-listings">My Listings</Link>}
                        {isAdmin && <Link to="/admin">Admin</Link>}
                        <button className="btn-logout" onClick={handleLogout}>Logout</button>
                        <span className="nav-user">Hi, {user.fullName.split(' ')[0]}</span>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="btn-nav-login">Login</Link>
                        <Link to="/register" className="btn-nav-register">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}