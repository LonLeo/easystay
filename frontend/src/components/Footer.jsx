import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-brand">
                    <strong>EasyStay</strong>
                    <p>Helping international students and new residents find their home in the UK.</p>
                </div>
                <nav className="footer-links" aria-label="Footer navigation">
                    <Link to="/listings">Browse Properties</Link>
                    <Link to="/register">Register</Link>
                    <Link to="/login">Login</Link>
                </nav>
            </div>
            <p className="footer-copy">© {new Date().getFullYear()} EasyStay</p>
        </footer>
    );
}