import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'user' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await registerUser(form);
            login(res.data.token, res.data.user);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h1>Create Your Account</h1>

                <label htmlFor="fullName">Full Name</label>
                <input id="fullName" name="fullName" type="text" required
                    value={form.fullName} onChange={handle} placeholder="Jane Smith" />

                <label htmlFor="email">Email address</label>
                <input id="email" name="email" type="email" required
                    value={form.email} onChange={handle} placeholder="you@example.com" />

                <label htmlFor="password">Password (min 6 characters)</label>
                <input id="password" name="password" type="password" required minLength={6}
                    value={form.password} onChange={handle} placeholder="Create a password" />

                <label htmlFor="role">I am a...</label>
                <select id="role" name="role" value={form.role} onChange={handle}>
                    <option value="user">Student / Renter</option>
                    <option value="owner">Property Owner / Landlord</option>
                </select>

                {error && <p className="error-msg" role="alert">{error}</p>}

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Creating account...' : 'Register'}
                </button>
                <p className="auth-switch">Already have an account? <Link to="/login">Login here</Link></p>
            </form>
        </div>
    );
}