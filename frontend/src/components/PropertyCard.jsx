import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { addFavourite, removeFavourite } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PropertyCard({ property, isFavourited = false, onFavouriteToggle }) {
    const { user } = useAuth();
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [saved, setSaved] = useState(isFavourited);
    React.useEffect(() => setSaved(isFavourited), [isFavourited]);

    const handleFavourite = async (e) => {
        e.preventDefault();
        if (!user || busy) return;
        setBusy(true);
        setError('');
        try {
            if (saved) {
                await removeFavourite(property.id);
            } else {
                await addFavourite(property.id);
            }
            setSaved(!saved);
            onFavouriteToggle && onFavouriteToggle(property.id);
        } catch { setError('Could not update favourite. Please try again.'); }
        finally { setBusy(false); }
    };

    return (
        <article className="property-card">
            <div className="property-card-image">
                <img
                    src={property.imageUrl || 'https://picsum.photos/seed/property/400/250'}
                    alt={property.title}
                    loading="lazy"
                    width="400"
                    height="250"
                />
                <span className={`badge badge-${property.propertyType}`}>{property.propertyType}</span>
                {user && (
                    <button
                        className={`fav-btn ${saved ? 'fav-active' : ''}`}
                        onClick={handleFavourite}
                        type="button" disabled={busy} aria-pressed={saved}
                        aria-label={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
                    >
                        ♥
                    </button>
                )}
            </div>
            <div className="property-card-body">
                {error && <p role="alert">{error}</p>}
                <h3 className="property-title"><Link to={`/properties/${property.id}`}>{property.title}</Link></h3>
                <p className="property-city">📍 {property.city}</p>
                <div className="property-meta">
                    <span className="property-rent">£{property.rent}/mo</span>
                    {property.billsIncluded && <span className="tag-bills">Bills incl.</span>}
                    {property.furnished && <span className="tag-furnished">Furnished</span>}
                </div>
                {property.nearbyUniversity && (
                    <p className="property-uni">🎓 Near {property.nearbyUniversity}</p>
                )}
            </div>
        </article>
    );
}