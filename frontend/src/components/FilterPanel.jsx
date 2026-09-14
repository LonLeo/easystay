import React from 'react';

export default function FilterPanel({ filters, onChange }) {
    const handle = (key, value) => onChange({ ...filters, [key]: value });

    return (
        <aside className="filter-panel" aria-label="Filter properties">
            <h2>Filters</h2>

            <label htmlFor="maxRent">Max Rent (£/mo)</label>
            <input id="maxRent" type="number" min="0" placeholder="e.g. 900"
                value={filters.maxRent || ''} onChange={(e) => handle('maxRent', e.target.value)} />

            <label htmlFor="propertyType">Property Type</label>
            <select id="propertyType" value={filters.propertyType || ''} onChange={(e) => handle('propertyType', e.target.value)}>
                <option value="">Any</option>
                <option value="room">Room</option>
                <option value="studio">Studio</option>
                <option value="flat">Flat</option>
                <option value="house">House</option>
            </select>

            <label className="checkbox-label">
                <input type="checkbox" checked={!!filters.furnished} onChange={(e) => handle('furnished', e.target.checked ? true : undefined)} />
                Furnished only
            </label>

            <label className="checkbox-label">
                <input type="checkbox" checked={!!filters.billsIncluded} onChange={(e) => handle('billsIncluded', e.target.checked ? true : undefined)} />
                Bills included
            </label>

            <button className="btn-clear-filters" onClick={() => onChange({})}>Clear Filters</button>
        </aside>
    );
}