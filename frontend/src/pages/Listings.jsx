import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import FilterPanel from '../components/FilterPanel';
import SearchBar from '../components/SearchBar';
import { getProperties, getFavourites } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Listings() {
    const [properties, setProperties] = useState([]);
    const [pagination, setPagination] = useState({});
    const [filters, setFilters] = useState({});
    const [loading, setLoading] = useState(true);
    const [favouriteIds, setFavouriteIds] = useState(new Set());
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    const cityParam = searchParams.get('city') || '';
    const searchParam = searchParams.get('search') || '';
    const [error, setError] = useState('');

    const fetchProperties = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');
        try {
            const params = { ...filters, city: cityParam || filters.city, search: searchParam, page, limit: 12 };
            const res = await getProperties(params);
            setProperties(res.data.data);
            setPagination(res.data.pagination);
        } catch { setError('Could not load properties. Please try again.'); }
        setLoading(false);
    }, [filters, cityParam, searchParam]);

    useEffect(() => { fetchProperties(); }, [fetchProperties]);

    useEffect(() => {
        if (user) {
            getFavourites().then((res) => {
                setFavouriteIds(new Set(res.data.data.map((f) => f.propertyId)));
            }).catch(() => { });
        }
    }, [user]);

    const handleFavToggle = (id) => {
        setFavouriteIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <div className="listings-page">
            <div className="listings-search">
                <SearchBar defaultCity={searchParam || cityParam} />
            </div>
            <div className="listings-layout">
                <FilterPanel filters={filters} onChange={setFilters} />
                <div className="listings-main">
                    <h1>Browse Properties</h1>
                    {error && <p className="error-msg" role="alert">{error}</p>}
                    {loading ? (
                        <div className="skeleton-grid">
                            {[...Array(6)].map((_, i) => <div key={i} className="skeleton skeleton-card" />)}
                        </div>
                    ) : properties.length === 0 ? (
                        <div className="empty-state">
                            <p>🏠 No properties found. Try adjusting your filters.</p>
                        </div>
                    ) : (
                        <>
                            <p className="results-count">{pagination.total} properties found</p>
                            <div className="properties-grid">
                                {properties.map((p) => (
                                    <PropertyCard
                                        key={p.id}
                                        property={p}
                                        isFavourited={favouriteIds.has(p.id)}
                                        onFavouriteToggle={handleFavToggle}
                                    />
                                ))}
                            </div>
                            {pagination.pages > 1 && (
                                <div className="pagination">
                                    {[...Array(pagination.pages)].map((_, i) => (
                                        <button key={i} onClick={() => fetchProperties(i + 1)}>{i + 1}</button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}