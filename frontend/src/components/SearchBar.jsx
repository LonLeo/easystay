import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar({ defaultCity = '' }) {
    const [city, setCity] = useState(defaultCity);
    const navigate = useNavigate();
    useEffect(() => setCity(defaultCity), [defaultCity]);

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`/listings?search=${encodeURIComponent(city)}`);
    };

    return (
        <form className="search-bar" onSubmit={handleSearch} role="search">
            <input
                type="text"
                placeholder="Search by city, university, or area..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="Search location"
            />
            <button type="submit">Search</button>
        </form>
    );
}