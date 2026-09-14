import React, { useEffect, useState } from 'react';
import { getAdminStats, getPendingProperties, reviewProperty, getAllUsers, toggleUserStatus } from '../services/api';

export default function AdminPanel() {
    const [stats, setStats] = useState(null);
    const [pending, setPending] = useState([]);
    const [users, setUsers] = useState([]);
    const [tab, setTab] = useState('overview');
    const [error, setError] = useState('');

    useEffect(() => {
        getAdminStats().then((r) => setStats(r.data.data)).catch(() => setError('Could not load admin data.'));
        getPendingProperties().then((r) => setPending(r.data.data)).catch(() => setError('Could not load admin data.'));
        getAllUsers().then((r) => setUsers(r.data.data)).catch(() => setError('Could not load admin data.'));
    }, []);

    const handleReview = async (id, status) => {
        setError('');
        try {
        await reviewProperty(id, status);
        setPending((prev) => prev.filter((p) => p.id !== id));
        getAdminStats().then((r) => setStats(r.data.data)).catch(() => setError('Could not load admin data.'));
        } catch (err) { setError(err.response?.data?.message || 'Review failed.'); }
    };

    const handleToggleUser = async (id) => {
        setError('');
        try {
        const res = await toggleUserStatus(id);
        setUsers((prev) => prev.map((u) => u.id === id ? res.data.data : u));
        } catch (err) { setError(err.response?.data?.message || 'Update failed.'); }
    };

    return (
        <div className="admin-page">
            <h1>Admin Panel</h1>
            {error && <p role="alert">{error}</p>}

            <nav className="admin-tabs" aria-label="Admin sections">
                {['overview', 'listings', 'users'].map((t) => (
                    <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </nav>

            {tab === 'overview' && stats && (
                <div className="stats-grid">
                    {[
                        { label: 'Total Users', value: stats.totalUsers },
                        { label: 'All Properties', value: stats.totalProperties },
                        { label: 'Approved', value: stats.approvedProperties },
                        { label: 'Pending Review', value: stats.pendingProperties },
                        { label: 'Total Enquiries', value: stats.totalEnquiries },
                    ].map((s) => (
                        <div key={s.label} className="stat-card">
                            <div className="stat-value">{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'listings' && (
                <div>
                    <h2>Pending Listings ({pending.length})</h2>
                    {pending.length === 0 ? (
                        <div className="empty-state"><p>No listings pending review.</p></div>
                    ) : pending.map((p) => (
                        <div key={p.id} className="admin-listing-item">
                            <div className="admin-listing-info">
                                <strong>{p.title}</strong>
                                <span>{p.city} — £{p.rent}/mo — {p.propertyType}</span>
                                <span className="admin-owner">Owner: {p.owner?.fullName} ({p.owner?.email})</span>
                                <p>{p.description?.substring(0, 120)}...</p>
                            </div>
                            <div className="admin-listing-actions">
                                <button className="btn-approve" onClick={() => handleReview(p.id, 'approved')}>✅ Approve</button>
                                <button className="btn-reject" onClick={() => handleReview(p.id, 'rejected')}>❌ Reject</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'users' && (
                <div>
                    <h2>All Users ({users.length})</h2>
                    <div className="listings-table-wrapper"><table className="users-table">
                        <thead>
                            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>{u.fullName}</td>
                                    <td>{u.email}</td>
                                    <td><span className="role-badge">{u.role}</span></td>
                                    <td><span className={`status-badge ${u.isActive ? 'status-approved' : 'status-rejected'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                                    <td>
                                        {u.role !== 'admin' && (
                                            <button className="btn-sm" onClick={() => handleToggleUser(u.id)}>
                                                {u.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table></div>
                </div>
            )}
        </div>
    );
}