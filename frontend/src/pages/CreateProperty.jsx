import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProperty } from '../services/api';

const initialForm = {
    title: '', description: '', city: '', address: '', postcode: '',
    rent: '', deposit: '', propertyType: 'room', furnished: false,
    billsIncluded: false, contractLengthMonths: '', bedroomCount: 1,
    bathroomCount: 1, imageUrl: '', availableFrom: '', nearbyUniversity: '',
};

export default function CreateProperty() {
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handle = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await createProperty(form);
            navigate('/my-listings');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create listing.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <h1>Create New Listing</h1>
            <form className="property-form" onSubmit={handleSubmit}>

                <label htmlFor="title">Title *</label>
                <input id="title" name="title" required value={form.title} onChange={handle} placeholder="e.g. Cosy Studio near UCL" />

                <label htmlFor="description">Description *</label>
                <textarea id="description" name="description" rows="5" required value={form.description} onChange={handle} />

                <div className="form-row">
                    <div>
                        <label htmlFor="city">City *</label>
                        <input id="city" name="city" required value={form.city} onChange={handle} placeholder="e.g. London" />
                    </div>
                    <div>
                        <label htmlFor="postcode">Postcode</label>
                        <input id="postcode" name="postcode" value={form.postcode} onChange={handle} placeholder="e.g. E1 6AN" />
                    </div>
                </div>

                <label htmlFor="address">Address *</label>
                <input id="address" name="address" required value={form.address} onChange={handle} />

                <div className="form-row">
                    <div>
                        <label htmlFor="rent">Monthly Rent (£) *</label>
                        <input id="rent" name="rent" type="number" min="0" required value={form.rent} onChange={handle} />
                    </div>
                    <div>
                        <label htmlFor="deposit">Deposit (£)</label>
                        <input id="deposit" name="deposit" type="number" min="0" value={form.deposit} onChange={handle} />
                    </div>
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
                    <div>
                        <label htmlFor="contractLengthMonths">Contract Length (months)</label>
                        <input id="contractLengthMonths" name="contractLengthMonths" type="number" min="1" value={form.contractLengthMonths} onChange={handle} placeholder="Leave blank if unknown" />
                    </div>
                </div>

                <div className="form-row">
                    <div>
                        <label htmlFor="bedroomCount">Bedrooms</label>
                        <input id="bedroomCount" name="bedroomCount" type="number" min="1" value={form.bedroomCount} onChange={handle} />
                    </div>
                    <div>
                        <label htmlFor="bathroomCount">Bathrooms</label>
                        <input id="bathroomCount" name="bathroomCount" type="number" min="1" value={form.bathroomCount} onChange={handle} />
                    </div>
                </div>

                <div className="form-checkboxes">
                    <label className="checkbox-label">
                        <input type="checkbox" name="furnished" checked={form.furnished} onChange={handle} />
                        Furnished
                    </label>
                    <label className="checkbox-label">
                        <input type="checkbox" name="billsIncluded" checked={form.billsIncluded} onChange={handle} />
                        Bills Included
                    </label>
                </div>

                <label htmlFor="imageUrl">Image URL</label>
                <input id="imageUrl" name="imageUrl" type="url" value={form.imageUrl} onChange={handle} placeholder="https://..." />

                <label htmlFor="availableFrom">Available From</label>
                <input id="availableFrom" name="availableFrom" type="date" value={form.availableFrom} onChange={handle} />

                <label htmlFor="nearbyUniversity">Nearby University / College</label>
                <input id="nearbyUniversity" name="nearbyUniversity" value={form.nearbyUniversity} onChange={handle} placeholder="e.g. University of Manchester" />

                {error && <p className="error-msg" role="alert">{error}</p>}
                <p className="form-note">ℹ️ Your listing will be reviewed by an admin before becoming visible.</p>

                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Listing'}
                    </button>
                </div>
            </form>
        </div>
    );
}