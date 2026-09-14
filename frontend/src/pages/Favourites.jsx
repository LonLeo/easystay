import React, { useEffect, useState } from 'react';
import { getFavourites } from '../services/api';
import PropertyCard from '../components/PropertyCard';

export default function Favourites() {
    const [favourites, setFavourites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        getFavourites()
            .then((res) => setFavourites(res.data.data))
            .catch(() => setError('Could not load favourites. Please try again.'))
            .finally(() => setLoading(false));
    }, []);

    const handleRemove = (propertyId) => {
        setFavourites((prev) => prev.filter((f) => f.propertyId !== propertyId));
    };

    if (loading) return <div className="loading-screen">Loading favourites...</div>;

    return (
        <div className="page-container">
            <h1>My Favourite Properties</h1>
            {error && <p role="alert">{error}</p>}
            {favourites.length === 0 ? (
                <div className="empty-state">
                    <p>You haven't saved any properties yet.</p>
                </div>
            ) : (
                <div className="properties-grid">
                    {favourites.map((f) => (
                        <div key={f.id} className="fav-card-wrapper">
                            <PropertyCard property={f.property} isFavourited={true} onFavouriteToggle={handleRemove} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}