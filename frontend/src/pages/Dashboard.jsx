import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyEnquiries, updateProfile, getReadinessHistory } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { user, login } = useAuth();
    const [enquiries, setEnquiries] = useState([]);
    const [form, setForm] = useState({ fullName: user?.fullName || '', phone: user?.phone || '', bio: user?.bio || '', preferredMaxRent: user?.preferredMaxRent || '', preferredPropertyType: user?.preferredPropertyType || 'any' });
    const [saved, setSaved] = useState(false);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        getMyEnquiries().then((res) => setEnquiries(res.data.data)).catch(() => setError('Could not load enquiries.'));
        getReadinessHistory().then((res) => setHistory(res.data.data)).catch(() => setError('Could not load readiness history.'));
    }, []);

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setError('');
        setSaved(false);
        try {
            const res = await updateProfile(form);
            login(localStorage.getItem('easystay_token'), res.data.user);
            setSaved(true);
        } catch (err) { setError(err.response?.data?.message || 'Could not save profile.'); }
    };

    return (
        <div className="dashboard-page">
            <h1>My Dashboard</h1>
            <Link to="/favourites">View saved favourites</Link>
            {error && <p className="error-msg" role="alert">{error}</p>}
            <section className="dashboard-section">
                <h2>Readiness History</h2>
                {history.length === 0 && <p>No saved readiness checks yet.</p>}
                {history.map(check => <article key={check.id} className="enquiry-item">
                    <h3>{check.property ? <Link to={`/properties/${check.propertyId}`}>{check.property.title}</Link> : 'Listing unavailable'}</h3>
                    <p>{check.result} - {check.score}/100 - {new Date(check.createdAt).toLocaleString()}</p>
                    <p>Budget: {check.userMaxBudget == null ? 'Not specified' : '£' + check.userMaxBudget}; type: {check.userPreferredType || 'Any'}</p>
                    <ul>{(check.reasons || []).map((reason, index) => <li key={index}>{reason.text}</li>)}</ul>
                </article>)}
            </section>

            <section className="dashboard-section">
                <h2>My Profile</h2>
                <form className="profile-form" onSubmit={handleProfileSave}>
                    <label htmlFor="fullName">Full Name</label>
                    <input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />

                    <label htmlFor="phone">Phone</label>
                    <input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Optional" />

                    <label htmlFor="bio">About Me</label>
                    <textarea id="bio" rows="3" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="A short bio helps landlords know you better" />

                    <label htmlFor="maxRentPref">Preferred Max Rent (£/mo)</label>
                    <input id="maxRentPref" type="number" min="0" value={form.preferredMaxRent} onChange={(e) => setForm({ ...form, preferredMaxRent: e.target.value })} placeholder="Used by Rental Readiness Assistant" />

                    <label htmlFor="prefType">Preferred Property Type</label>
                    <select id="prefType" value={form.preferredPropertyType} onChange={(e) => setForm({ ...form, preferredPropertyType: e.target.value })}>
                        <option value="any">Any</option>
                        <option value="room">Room</option>
                        <option value="studio">Studio</option>
                        <option value="flat">Flat</option>
                        <option value="house">House</option>
                    </select>

                    <button type="submit" className="btn-primary">Save Profile</button>
                    {saved && <p className="success-msg" role="status">✅ Profile saved!</p>}
                </form>
            </section>

            <section className="dashboard-section">
                <h2>My Enquiries</h2>
                {enquiries.length === 0 ? (
                    <div className="empty-state">
                        <p>You haven't sent any enquiries yet.</p>
                        <Link to="/listings" className="btn-primary">Browse Properties</Link>
                    </div>
                ) : (
                    <div className="enquiries-list">
                        {enquiries.map((e) => (
                            <div key={e.id} className="enquiry-item">
                                <div>
                                    <strong>{e.property?.title}</strong>
                                    <span className={`status-badge status-${e.status}`}>{e.status}</span>
                                </div>

                                <p>{e.message}</p>

                                {e.replyMessage && (
                                    <div className="tenant-reply-box">
                                        <strong>Owner reply</strong>
                                        <p>{e.replyMessage}</p>
                                        {e.repliedAt && (
                                            <small>Replied at {new Date(e.repliedAt).toLocaleString()}</small>
                                        )}
                                    </div>
                                )}

                                <p className="enquiry-date">
                                    {new Date(e.createdAt).toLocaleDateString('en-GB')}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}