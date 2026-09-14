import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
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
            const res = await loginUser(form);
            login(res.data.token, res.data.user);
            navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h1>Login to EasyStay</h1>

                <label htmlFor="email">Email address</label>
                <input id="email" name="email" type="email" required autoComplete="email"
                    value={form.email} onChange={handle} placeholder="you@example.com" />

                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" required autoComplete="current-password"
                    value={form.password} onChange={handle} placeholder="Your password" />

                {error && <p className="error-msg" role="alert">{error}</p>}

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                <p className="auth-switch">Don't have an account? <Link to="/register">Register here</Link></p>
            </form>
        </div>
    );
}