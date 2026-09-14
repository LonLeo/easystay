import React, { useEffect, useState } from 'react';
import { runReadinessCheck } from '../services/api';
import { useAuth } from '../context/AuthContext';

const resultColors = { 'Good Fit': '#437a22', 'Needs Checking': '#795600', 'Potential Risk': '#a12c7b' };
const resultIcons = { 'Good Fit': '✅', 'Needs Checking': '⚠️', 'Potential Risk': '❌' };

export default function ReadinessBadge({ propertyId }) {
    const { user } = useAuth();
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [maxBudget, setMaxBudget] = useState(user?.preferredMaxRent ?? '');
    const [preferredType, setPreferredType] = useState(user?.preferredPropertyType || 'any');

    useEffect(() => {
        setResult(null);
        setError('');
        setMaxBudget(user?.preferredMaxRent ?? '');
        setPreferredType(user?.preferredPropertyType || 'any');
    }, [propertyId, user?.id, user?.preferredMaxRent, user?.preferredPropertyType]);

    const handleCheck = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await runReadinessCheck({ propertyId, maxBudget: maxBudget === '' ? null : maxBudget, preferredType });
            setResult(res.data.data);
            setShowForm(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not run readiness check.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="readiness-widget">
            <div className="readiness-header">
                <h2>🏠 Rental Readiness Assistant</h2>
                <p>Compare the listing with your budget and preferences. This is advisory guidance based on supplied information.</p>
            </div>

            {error && <p className="error-msg" role="alert">{error}</p>}
            {!result && !showForm && (
                <button className="btn-readiness" onClick={() => setShowForm(true)}>
                    Check My Fit
                </button>
            )}

            {showForm && !result && (
                <form className="readiness-form" onSubmit={handleCheck}>
                    <label htmlFor="maxBudgetRa">Your Monthly Budget (£)</label>
                    <input id="maxBudgetRa" type="number" min="0" placeholder="e.g. 800"
                        value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} />

                    <label htmlFor="prefTypeRa">Preferred Property Type</label>
                    <select id="prefTypeRa" value={preferredType} onChange={(e) => setPreferredType(e.target.value)}>
                        <option value="any">Any</option>
                        <option value="room">Room</option>
                        <option value="studio">Studio</option>
                        <option value="flat">Flat</option>
                        <option value="house">House</option>
                    </select>

                    <div className="readiness-actions">
                        <button type="submit" disabled={loading}>{loading ? 'Checking...' : 'Run Check'}</button>
                        <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                    </div>
                </form>
            )}

            {result && (
                <div role="status" className="readiness-result" style={{ borderColor: resultColors[result.result] }}>
                    <div className="result-header" style={{ color: resultColors[result.result] }}>
                        {resultIcons[result.result]} {result.result} — Score: {result.score}/100
                    </div>
                    <ul className="result-reasons">
                        {result.reasons.map((r, i) => (
                            <li key={i} className={`reason-${r.type}`}>
                                {r.type === 'positive' ? '✓' : r.type === 'negative' ? '✗' : '~'} {r.text}
                            </li>
                        ))}
                    </ul>
                    <button className="btn-recheck" onClick={() => { setResult(null); setShowForm(true); }}>
                        Recheck with Different Preferences
                    </button>
                </div>
            )}
        </div>
    );
}