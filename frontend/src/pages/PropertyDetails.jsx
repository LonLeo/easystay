import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProperty, createEnquiry, addFavourite, removeFavourite, getFavourites } from '../services/api';
import ReadinessBadge from '../components/ReadinessBadge';
import { useAuth } from '../context/AuthContext';

export default function PropertyDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enquiryMsg, setEnquiryMsg] = useState('');
    const [moveInDate, setMoveInDate] = useState('');
    const [enquirySent, setEnquirySent] = useState(false);
    const [enquiryError, setEnquiryError] = useState('');
    const [isFavourited, setIsFavourited] = useState(false);
    const [favLoading, setFavLoading] = useState(false);

    useEffect(() => {
        getProperty(id)
            .then((res) => setProperty(res.data.data))
            .catch(() => navigate('/listings'))
            .finally(() => setLoading(false));
    }, [id, navigate]);

    useEffect(() => {
        if (!user || !property) return;
        getFavourites()
            .then((res) => {
                const favIds = new Set(res.data.data.map((f) => f.propertyId));
                setIsFavourited(favIds.has(property.id));
            })
            .catch(() => { });
    }, [user, property]);

    const handleFavourite = async () => {
        if (!user) return navigate('/login');
        setFavLoading(true);
        try {
            if (isFavourited) {
                await removeFavourite(property.id);
                setIsFavourited(false);
            } else {
                await addFavourite(property.id);
                setIsFavourited(true);
            }
        } catch (err) {
            setEnquiryError(err.response?.data?.message || 'Could not update favourites.');
        } finally {
            setFavLoading(false);
        }
    };

    const handleEnquiry = async (e) => {
        e.preventDefault();
        if (!user) return navigate('/login');
        setEnquiryError('');
        try {
            await createEnquiry({ propertyId: property.id, message: enquiryMsg, moveInDate });
            setEnquirySent(true);
            setEnquiryMsg('');
        } catch (err) {
            setEnquiryError(err.response?.data?.message || 'Could not send enquiry.');
        }
    };

    if (loading) return <div className="loading-screen">Loading property...</div>;
    if (!property) return null;

    return (
        <div className="property-details-page">
            <div className="property-details-main">
                <img
                    src={property.imageUrl || 'https://picsum.photos/seed/house/800/450'}
                    alt={property.title}
                    className="property-hero-img"
                    width="800"
                    height="450"
                    loading="lazy"
                />
                <div className="property-info">
                    <h1>{property.title}</h1>
                    <p className="detail-location">📍 {property.address}, {property.city} {property.postcode || ''}</p>

                    <div className="detail-tags">
                        <span className="tag">{property.propertyType}</span>
                        {property.furnished && <span className="tag">Furnished</span>}
                        {property.billsIncluded && <span className="tag tag-green">Bills Included</span>}
                    </div>

                    <div className="detail-price-row">
                        <span className="detail-rent">£{property.rent}/month</span>
                        {property.deposit != null && <span className="detail-deposit">Deposit: £{property.deposit}</span>}
                    </div>

                    <div className="detail-actions">
                        <button
                            type="button"
                            className={`fav-heart-btn ${isFavourited ? 'fav-heart-btn-active' : ''}`}
                            onClick={handleFavourite}
                            disabled={favLoading}
                            aria-label={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
                        >
                            {favLoading ? '...' : '♥'}
                        </button>  
                        {/* <Link to="/favourites" className="btn-secondary">
                            View Favourites
                        </Link> */}
                    </div>

                    {property.contractLengthMonths && (
                        <p>📄 Contract: {property.contractLengthMonths} months</p>
                    )}
                    {property.nearbyUniversity && <p>🎓 Near {property.nearbyUniversity}</p>}
                    {property.availableFrom && <p>📅 Available from: {property.availableFrom}</p>}

                    <h2>About This Property</h2>
                    <p className="detail-description">{property.description}</p>

                    <h2>Landlord</h2>
                    <p>{property.owner?.fullName}</p>
                    {property.owner?.phone && <p>📞 {property.owner.phone}</p>}
                </div>
            </div>

            <div className="property-details-sidebar">
                <ReadinessBadge key={property.id} propertyId={property.id} />

                <div className="enquiry-form-box">
                    <h2>Send an Enquiry</h2>
                    {enquirySent ? (
                        <p className="success-msg">✅ Your enquiry has been sent successfully!</p>
                    ) : (
                        <form onSubmit={handleEnquiry}>
                            <label htmlFor="moveInDate">Preferred move-in date</label>
                            <input id="moveInDate" type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />

                            <label htmlFor="enquiryMsg">Your message</label>
                            <textarea
                                id="enquiryMsg"
                                rows="5"
                                required
                                minLength={10}
                                placeholder="Hi, I'm interested in this property and would like to..."
                                value={enquiryMsg}
                                onChange={(e) => setEnquiryMsg(e.target.value)}
                            />

                            {enquiryError && <p className="error-msg" role="alert">{enquiryError}</p>}
                            <button type="submit" className="btn-primary">
                                {user ? 'Send Enquiry' : 'Login to Enquire'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}