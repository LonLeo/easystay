import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import { getProperties } from '../services/api';

export default function Home() {
    const [featured, setFeatured] = useState([]);

    useEffect(() => {
        getProperties({ limit: 6 })
            .then((res) => setFeatured(res.data.data))
            .catch(() => { });
    }, []);

    return (
        <div className="home-page">
            <section className="hero">
                <div className="hero-content">
                    <h1>Find Your Place in the UK</h1>
                    <p>Simple, transparent rental search designed for international students and new residents.</p>
                    <SearchBar />
                </div>
            </section>

            <section className="features-section">
                <h2>Why EasyStay?</h2>
                <div className="features-grid">
                    <div className="feature-item">
                        <span className="feature-icon">🔍</span>
                        <h3>Easy Search</h3>
                        <p>Filter by city, rent, type, and more to find listings that fit your needs quickly.</p>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">🏠</span>
                        <h3>Rental Readiness Assistant</h3>
                        <p>Our unique tool checks if a property is a good fit for your budget and preferences before you enquire.</p>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">💬</span>
                        <h3>Direct Enquiries</h3>
                        <p>Message landlords directly through our platform — no hidden fees, no confusion.</p>
                    </div>
                </div>
            </section>

            <section className="featured-section">
                <div className="section-header">
                    <h2>Latest Listings</h2>
                    <Link to="/listings">View all →</Link>
                </div>
                <div className="properties-grid">
                    {featured.map((p) => <PropertyCard key={p.id} property={p} />)}
                </div>
            </section>
        </div>
    );
}