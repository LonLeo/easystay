import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getManagedProperty, updateProperty } from '../services/api';

export default function EditProperty() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getManagedProperty(id).then((res) => {
            const p = res.data.data;
            setForm({
                title: p.title, description: p.description, city: p.city,
                address: p.address, postcode: p.postcode || '', rent: p.rent,
                deposit: p.deposit ?? '', propertyType: p.propertyType,
                furnished: p.furnished, billsIncluded: p.billsIncluded,
                contractLengthMonths: p.contractLengthMonths || '',
                bedroomCount: p.bedroomCount, bathroomCount: p.bathroomCount,
                imageUrl: p.imageUrl || '', availableFrom: p.availableFrom || '',
                nearbyUniversity: p.nearbyUniversity || '',
            });
        }).catch(() => navigate('/my-listings'));
    }, [id, navigate]);

    const handle = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateProperty(id, form);
            navigate('/my-listings');
        } catch (err) {
            setError(err.response?.data?.message || 'Update failed.');
        } finally {
            setLoading(false);
        }
    };

    if (!form) return <div className="loading-screen">Loading...</div>;

    return (
        <div className="page-container">
            <h1>Edit Listing</h1>
            <form className="property-form" onSubmit={handleSubmit}>
                <label htmlFor="title">Title *</label>
                <input id="title" name="title" required value={form.title} onChange={handle} />

                <label htmlFor="description">Description *</label>
                <textarea id="description" name="description" rows="5" required value={form.description} onChange={handle} />

                <div className="form-row">
                    <div><label htmlFor="city">City *</label>
                <input id="city" name="city" required value={form.city} onChange={handle} /></div>
                    <div><label htmlFor="postcode">Postcode</label>
                <input id="postcode" name="postcode" value={form.postcode} onChange={handle} /></div>
                </div>

                <label htmlFor="address">Address *</label>
                <input id="address" name="address" required value={form.address} onChange={handle} />

                <div className="form-row">
                    <div><label htmlFor="rent">Rent (£/mo) *</label>
                <input id="rent" name="rent" type="number" min="0" required value={form.rent} onChange={handle} /></div>
                    <div><label htmlFor="deposit">Deposit (£)</label>
                <input id="deposit" name="deposit" type="number" min="0" value={form.deposit} onChange={handle} /></div>
                </div>

                <div className="form-row">
                    <div>
                        <label htmlFor="propertyType">Property Type</label>
                <select id="propertyType" name="propertyType" value={form.propertyType} onChange={handle}>
                            <option value="room">Room</option>
                            <option value="studio">Studio</option>
                            <option value="flat">Flat</option>
                            <option value="house">House</option>
                        </select>
                    </div>
                    <div><label htmlFor="contractLengthMonths">Contract (months)</label>
                <input id="contractLengthMonths" name="contractLengthMonths" type="number" min="1" value={form.contractLengthMonths} onChange={handle} /></div>
                </div>

                <div className="form-checkboxes">
                    <label className="checkbox-label">
                        <input type="checkbox" name="furnished" checked={form.furnished} onChange={handle} /> Furnished
                    </label>
                    <label className="checkbox-label">
                        <input type="checkbox" name="billsIncluded" checked={form.billsIncluded} onChange={handle} /> Bills Included
                    </label>
                </div>

                <label htmlFor="imageUrl">Image URL</label>
                <input id="imageUrl" name="imageUrl" type="url" value={form.imageUrl} onChange={handle} />

                <label htmlFor="nearbyUniversity">Nearby University</label>
                <input id="nearbyUniversity" name="nearbyUniversity" value={form.nearbyUniversity} onChange={handle} />

                {error && <p className="error-msg" role="alert">{error}</p>}
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
}