/* Tests use React DOM directly; act is required for root.render and Simulate. */
/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Simulate } from 'react-dom/test-utils';
import { ProtectedRoute } from './App';
import FilterPanel from './components/FilterPanel';
import PropertyCard from './components/PropertyCard';
import ReadinessBadge from './components/ReadinessBadge';
import Favourites from './pages/Favourites';
import EditProperty from './pages/EditProperty';
import Dashboard from './pages/Dashboard';
import SearchBar from './components/SearchBar';
import { useAuth } from './context/AuthContext';
import * as api from './services/api';

jest.mock('./context/AuthContext', () => ({ useAuth: jest.fn(), AuthProvider: ({ children }) => children }));
jest.mock('./services/api', () => Object.fromEntries(['getFavourites','removeFavourite','addFavourite','getManagedProperty','getMyEnquiries','getReadinessHistory','updateProfile','runReadinessCheck'].map(name => [name, jest.fn()])));
function SearchLocation() { return <p>{useLocation().search}</p>; }
let container, root;
const property = { id: 10, title: 'Test property', city: 'London', rent: '700', ownerId: 2 };
beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    useAuth.mockReturnValue({ user: { id: 1, role: 'user' }, loading: false });
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); jest.resetAllMocks(); });
const render = async children => act(async () => root.render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</MemoryRouter>));
test('protected URL redirects an anonymous user to login', async () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    await render(<Routes><Route path="/" element={<ProtectedRoute><p>Private content</p></ProtectedRoute>} /><Route path="/login" element={<p>Login required</p>} /></Routes>);
    expect(container.textContent).toContain('Login required'); expect(container.textContent).not.toContain('Private content');
});
test('protected admin URL blocks a renter even on direct routing', async () => {
    await act(async () => root.render(<MemoryRouter initialEntries={['/admin']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes><Route path="/admin" element={<ProtectedRoute roles={['admin']}><p>Private admin</p></ProtectedRoute>} /><Route path="/" element={<p>Home</p>} /></Routes></MemoryRouter>));
    expect(container.textContent).toBe('Home');
});
test('protected route waits for authentication before rendering', async () => {
    useAuth.mockReturnValue({ user: null, loading: true }); await render(<ProtectedRoute><p>Private</p></ProtectedRoute>); expect(container.textContent).toContain('Loading');
});
test('unchecking furnished removes the filter instead of demanding unfurnished', async () => {
    const onChange = jest.fn(); await render(<FilterPanel filters={{ furnished: true }} onChange={onChange} />);
    await act(async () => Simulate.change(container.querySelector('input[type=checkbox]'), { target: { checked: false } }));
    expect(onChange).toHaveBeenCalledWith({ furnished: undefined });
});
test('favourite button is separate from navigation and shows API errors', async () => {
    api.addFavourite.mockRejectedValue(new Error('Network failure')); await render(<PropertyCard property={property} />);
    const button = container.querySelector('button'); expect(button.closest('a')).toBeNull();
    await act(async () => button.click()); expect(container.querySelector('[role=alert]').textContent).toContain('Could not update');
});
test('saved favourite removal issues one DELETE and removes the card', async () => {
    api.getFavourites.mockResolvedValue({ data: { data: [{ id: 1, propertyId: 10, property }] } }); api.removeFavourite.mockResolvedValue({});
    await render(<Favourites />); await act(async () => container.querySelector('button').click());
    expect(api.removeFavourite).toHaveBeenCalledTimes(1); expect(container.textContent).not.toContain('Test property');
});
test('editing loads the protected owner endpoint and labels all editable fields', async () => {
    api.getManagedProperty.mockResolvedValue({ data: { data: { ...property, description: 'Description', address: 'Address', furnished: false, billsIncluded: false, bedroomCount: 1, bathroomCount: 1, propertyType: 'room' } } });
    await act(async () => root.render(<MemoryRouter initialEntries={['/edit-listing/10']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes><Route path="/edit-listing/:id" element={<EditProperty />} /></Routes></MemoryRouter>));
    expect(api.getManagedProperty).toHaveBeenCalledWith('10');
    for (const field of container.querySelectorAll('input,textarea,select')) expect(field.labels.length).toBeGreaterThan(0);
});
test('dashboard retrieves and displays stored readiness reasons and snapshot', async () => {
    api.getMyEnquiries.mockResolvedValue({ data: { data: [] } });
    api.getReadinessHistory.mockResolvedValue({ data: { data: [{ id: 1, propertyId: 10, property, score: 70, result: 'Good Fit', createdAt: '2026-09-08', userMaxBudget: '800', reasons: [{ text: 'Within budget' }] }] } });
    await render(<Dashboard />); expect(api.getReadinessHistory).toHaveBeenCalledTimes(1); expect(container.textContent).toContain('Within budget'); expect(container.textContent).toContain('70/100'); expect(container.textContent).toContain('£800');
});
test('readiness loads account preferences and displays an explicit calculation result', async () => {
    useAuth.mockReturnValue({ user: { id: 1, role: 'user', preferredMaxRent: '800', preferredPropertyType: 'room' } });
    api.runReadinessCheck.mockResolvedValue({ data: { data: { score: 100, result: 'Good Fit', reasons: [{ type: 'positive', text: 'Within budget' }] } } });
    await render(<ReadinessBadge propertyId={10} />); expect(api.runReadinessCheck).not.toHaveBeenCalled();
    await act(async () => container.querySelector('button').click()); expect(container.querySelector('input').value).toBe('800');
    await act(async () => Simulate.submit(container.querySelector('form')));
    expect(api.runReadinessCheck).toHaveBeenCalledWith({ propertyId: 10, maxBudget: '800', preferredType: 'room' }); expect(container.querySelector('[role=status]').textContent).toContain('100/100');
});
test('readiness resets when navigating to another property', async () => {
    api.runReadinessCheck.mockResolvedValue({ data: { data: { score: 70, result: 'Good Fit', reasons: [] } } });
    await render(<ReadinessBadge propertyId={10} />); await act(async () => container.querySelector('button').click()); await act(async () => Simulate.submit(container.querySelector('form')));
    await render(<ReadinessBadge propertyId={11} />); expect(container.textContent).not.toContain('Score: 70');
});
test('search box navigates using the backend full-text search parameter', async () => {
    await render(<Routes><Route path="/" element={<SearchBar defaultCity="University" />} /><Route path="/listings" element={<SearchLocation />} /></Routes>);
    await act(async () => Simulate.submit(container.querySelector('form'))); expect(container.textContent).toBe('?search=University');
});
