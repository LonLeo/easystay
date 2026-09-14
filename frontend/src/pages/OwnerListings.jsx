import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    getMyProperties,
    deleteProperty,
    getReceivedEnquiries,
    updateEnquiryStatus,
    replyToEnquiry,
} from '../services/api';

export default function OwnerListings() {
    const [properties, setProperties] = useState([]);
    const [enquiries, setEnquiries] = useState([]);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const dialogRef = useRef(null);
    useEffect(() => {
        if (!selectedEnquiry) return;
        const previous = document.activeElement;
        const dialog = dialogRef.current;
        dialog.showModal();
        return () => { dialog.close(); previous?.focus(); };
    }, [selectedEnquiry]);

    useEffect(() => {
        getMyProperties().then((res) => setProperties(res.data.data)).catch(() => setError('Could not load owner data.'));
        getReceivedEnquiries().then((res) => setEnquiries(res.data.data)).catch(() => setError('Could not load owner data.'));
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this listing?')) return;
        try {
            await deleteProperty(id);
            setProperties((prev) => prev.filter((p) => p.id !== id));
        } catch (err) { setError(err.response?.data?.message || 'Could not delete listing.'); }
    };

    const openReply = (enquiry) => {
        setError('');
        setSelectedEnquiry(enquiry);
        setReplyMessage(enquiry.replyMessage || '');
    };

    const closeReply = () => {
        setSelectedEnquiry(null);
        setReplyMessage('');
        setError('');
    };

    const handleStatus = async (status) => {
        if (!selectedEnquiry) return;
        try {
            const res = await updateEnquiryStatus(selectedEnquiry.id, status);
            setEnquiries((prev) => prev.map((item) => (item.id === selectedEnquiry.id ? res.data.data : item)));
            closeReply();
        } catch (err) {
            setError(err.response?.data?.message || 'Could not update status.');
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!selectedEnquiry) return;
        const text = replyMessage.trim();
        if (!text) return;

        setSaving(true);
        setError('');
        try {
            const res = await replyToEnquiry(selectedEnquiry.id, text);
            setEnquiries((prev) => prev.map((item) => (item.id === selectedEnquiry.id ? res.data.data : item)));
            closeReply();
        } catch (err) {
            setError(err.response?.data?.message || 'Could not send reply.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>My Listings</h1>
                <Link to="/create-listing" className="btn-primary">+ Add New Listing</Link>
            </div>

            {properties.length === 0 ? (
                <div className="empty-state">
                    <p>You haven't created any listings yet.</p>
                </div>
            ) : (
                <div className="listings-table-wrapper">
                    <table className="listings-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>City</th>
                                <th>Rent</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {properties.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.title}</td>
                                    <td>{p.city}</td>
                                    <td>£{p.rent}/mo</td>
                                    <td><span className={`status-badge status-${p.status}`}>{p.status}</span></td>
                                    <td className="action-cell">
                                        <Link to={`/edit-listing/${p.id}`} className="btn-sm">Edit</Link>
                                        <button className="btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {error && !selectedEnquiry && <p role="alert">{error}</p>}
            <section className="enquiries-section">
                <h2>Received Enquiries</h2>
                {enquiries.length === 0 ? (
                    <p>No enquiries yet.</p>
                ) : (
                    <div className="enquiries-list">
                        {enquiries.map((e) => (
                            <button
                                key={e.id}
                                type="button"
                                className="enquiry-item enquiry-clickable"
                                onClick={() => openReply(e)}
                            >
                                <div className="enquiry-topline">
                                    <strong>{e.user?.fullName}</strong>
                                    <span>— {e.property?.title}</span>
                                    <span className={`status-badge status-${e.status}`}>{e.status}</span>
                                </div>

                                <p>{e.message}</p>

                                <p className="enquiry-meta">
                                    {e.senderEmail} · {new Date(e.createdAt).toLocaleDateString('en-GB')}
                                </p>

                                {e.replyMessage && (
                                    <div className="owner-reply-box">
                                        <strong>Your reply</strong>
                                        <p>{e.replyMessage}</p>
                                        {e.repliedAt && (
                                            <small>Replied at {new Date(e.repliedAt).toLocaleString()}</small>
                                        )}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {selectedEnquiry && (
                <dialog ref={dialogRef} className="reply-modal" aria-labelledby="reply-title" onCancel={closeReply}>
                        <h2 id="reply-title">Reply to Enquiry</h2>
                        <button type="button" onClick={closeReply}>Close reply</button>
                        <p><strong>From:</strong> {selectedEnquiry.user?.fullName} ({selectedEnquiry.user?.email})</p>
                        <p><strong>Property:</strong> {selectedEnquiry.property?.title}</p>
                        <p><strong>Message:</strong> {selectedEnquiry.message}</p>

                        <form onSubmit={handleReplySubmit}>
                            <label htmlFor="replyMessage">Your reply</label>
                            <textarea
                                id="replyMessage"
                                rows="6"
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Write your reply here..."
                                required
                            />

                            {error && <p className="error-msg" role="alert">{error}</p>}

                            <div className="reply-actions">
                                <button type="button" className="btn-sm" onClick={() => handleStatus('read')}>Mark Read</button>
                                <button type="button" className="btn-sm btn-success" onClick={() => handleStatus('replied')}>Mark Replied</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Sending...' : 'Send Reply'}
                                </button>
                            </div>
                        </form>
                </dialog>
            )}
        </div>
    );
}