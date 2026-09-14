const { test, before, after, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = require('node:crypto').randomBytes(48).toString('hex');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { UniqueConstraintError } = require('sequelize');
const models = require('../models');
const { User, Property, Favourite, Enquiry, ReadinessCheck } = models;
const app = require('../app');
const { calculateReadiness, classifyScore } = require('../controllers/readinessController');
let server, base;
const renter = { id: 1, role: 'user', isActive: true, fullName: 'Test Renter', email: 'renter@example.test', preferredMaxRent: '800', preferredPropertyType: 'room', toSafeObject() { return { id: this.id, role: this.role }; } };
const owner = { ...renter, id: 2, role: 'owner' };
const admin = { ...renter, id: 3, role: 'admin' };
const listing = { id: 10, ownerId: 2, status: 'approved', rent: '700', deposit: '0', billsIncluded: true, furnished: true, contractLengthMonths: 6, description: 'A detailed description', address: 'Test street', city: 'Test city', imageUrl: 'https://example.test/image.jpg', propertyType: 'room', increment: async () => {} };
before(async () => { server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r)); base = `http://127.0.0.1:${server.address().port}/api`; });
after(async () => { await new Promise(r => server.close(r)); await models.sequelize.close(); });
afterEach(() => mock.restoreAll());
function auth(user = renter) { mock.method(User, 'findByPk', async () => user); return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' }); }
async function request(path, { method = 'GET', body, token } = {}) {
    const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: res.status, data: await res.json() };
}
test('bcrypt model hooks hash passwords and safe objects exclude hashes', async () => {
    const user = User.build({ fullName: 'Test Renter', email: 'renter@example.test', passwordHash: 'test-password' });
    await user.validate(); await User.runHooks('beforeCreate', user);
    assert.notEqual(user.passwordHash, 'test-password'); assert.equal(bcrypt.getRounds(user.passwordHash), 12);
    assert.equal(await user.validatePassword('test-password'), true); assert.equal(await user.validatePassword('wrong'), false);
    assert.equal(Object.hasOwn(user.toSafeObject(), 'passwordHash'), false);
    user.passwordHash = 'another-password'; await User.runHooks('beforeUpdate', user);
    assert.equal(await user.validatePassword('another-password'), true);
});
test('registration validates email and password without creating a user', async () => {
    const create = mock.method(User, 'create', async () => { throw Error('must not create'); });
    for (const body of [{ fullName: 'Valid Name', email: 'bad', password: '123456' }, { fullName: 'Valid Name', email: 'a@example.test', password: {} }, { fullName: ' ', email: 'a@example.test', password: '123456' }]) assert.equal((await request('/auth/register', { method: 'POST', body })).status, 400);
    assert.equal(create.mock.callCount(), 0);
});
test('registration never accepts a public admin role and JWT contains only identity and times', async () => {
    mock.method(User, 'findOne', async () => null);
    const create = mock.method(User, 'create', async data => ({ ...renter, ...data }));
    const res = await request('/auth/register', { method: 'POST', body: { fullName: 'Valid Name', email: 'a@example.test', password: 'test-password', role: 'admin' } });
    assert.equal(res.status, 201); assert.equal(create.mock.calls[0].arguments[0].role, 'user');
    assert.deepEqual(Object.keys(jwt.verify(res.data.token, process.env.JWT_SECRET)).sort(), ['exp', 'iat', 'id']);
});
test('registration handles existing email and database uniqueness race as 409', async () => {
    mock.method(User, 'findOne', async () => renter);
    const options = { method: 'POST', body: { fullName: 'Valid Name', email: 'a@example.test', password: 'test-password' } };
    assert.equal((await request('/auth/register', options)).status, 409);
    mock.restoreAll(); mock.method(User, 'findOne', async () => null); mock.method(User, 'create', async () => { throw new UniqueConstraintError({}); });
    assert.equal((await request('/auth/register', options)).status, 409);
});
test('login uses actual bcrypt comparison; invalid credentials and inactive accounts rejected', async () => {
    const user = User.build({ ...renter, passwordHash: await bcrypt.hash('test-password', 4) });
    mock.method(User, 'findOne', async () => user);
    const attempt = password => request('/auth/login', { method: 'POST', body: { email: renter.email, password } });
    assert.equal((await attempt('wrong')).status, 401); assert.equal((await attempt('test-password')).status, 200);
    user.isActive = false; assert.equal((await attempt('test-password')).status, 403);
});
test('JWT rejects missing, malformed and expired tokens', async () => {
    assert.equal((await request('/auth/me')).status, 401);
    assert.equal((await request('/auth/me', { token: 'invalid' })).status, 401);
    const expired = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: -1 });
    assert.equal((await request('/auth/me', { token: expired })).status, 401);
});
test('optional readiness authentication rejects invalid and inactive tokens', async () => {
    assert.equal((await request('/readiness/check', { method: 'POST', token: 'bad', body: { propertyId: 10 } })).status, 401);
    const token = auth({ ...renter, isActive: false });
    assert.equal((await request('/readiness/check', { method: 'POST', token, body: { propertyId: 10 } })).status, 401);
});
test('all admin endpoints reject renters and owners', async () => {
    for (const user of [renter, owner]) { const token = auth(user);
        for (const [method, path] of [['GET','/admin/stats'], ['GET','/admin/users'], ['GET','/admin/properties/pending'], ['PUT','/admin/users/1/toggle'], ['PUT','/admin/properties/10/review']]) assert.equal((await request(path, { method, token, body: method === 'PUT' ? { status: 'approved' } : undefined })).status, 403);
        mock.restoreAll();
    }
});
test('renter cannot create, edit or delete listings', async () => {
    const token = auth();
    for (const [method,path] of [['POST','/properties'],['PUT','/properties/10'],['DELETE','/properties/10']]) assert.equal((await request(path, { method, token, body: {} })).status, 403);
});
test('owner cannot edit/delete/read managed listing of another owner', async () => {
    const token = auth({ ...owner, id: 4 }); mock.method(Property, 'findByPk', async () => listing);
    for (const [method,path] of [['GET','/properties/my/10'],['PUT','/properties/10'],['DELETE','/properties/10']]) assert.equal((await request(path, { method, token, body: method === 'PUT' ? {} : undefined })).status, 403);
});
test('owner creation binds JWT identity, forces pending and normalizes optional blanks', async () => {
    const token = auth(owner); const create = mock.method(Property, 'create', async data => data);
    const body = { title: 'Valid title', description: 'Description', city: 'London', address: 'Test address', rent: '0', deposit: '', contractLengthMonths: '', availableFrom: '', ownerId: 999, status: 'approved' };
    const res = await request('/properties', { method: 'POST', token, body }); assert.equal(res.status, 201);
    const data = create.mock.calls[0].arguments[0]; assert.equal(data.ownerId, owner.id); assert.equal(data.status, 'pending'); assert.equal(data.deposit, null); assert.equal(data.availableFrom, null);
});
test('owner updates whitelist fields and reset moderation; pending editing works', async () => {
    const token = auth(owner); let updated;
    mock.method(Property, 'findByPk', async () => ({ ...listing, status: 'pending', update: async data => { updated = data; } }));
    assert.equal((await request('/properties/my/10', { token })).status, 200);
    const res = await request('/properties/10', { method: 'PUT', token, body: { title: 'New title', ownerId: 999, id: 999, viewCount: 999, status: 'approved' } });
    assert.equal(res.status, 200); assert.deepEqual(updated, { title: 'New title', status: 'pending' });
});
test('public detail and readiness never expose pending/rejected/archived listings', async () => {
    for (const status of ['pending', 'rejected', 'archived']) {
        mock.method(Property, 'findByPk', async () => ({ ...listing, status }));
        assert.equal((await request('/properties/10')).status, 404);
        assert.equal((await request('/readiness/check', { method: 'POST', body: { propertyId: 10 } })).status, 404);
        mock.restoreAll();
    }
});
test('combined search filters keep approval restriction and correct pagination', async () => {
    const find = mock.method(Property, 'findAndCountAll', async () => ({ count: 0, rows: [] }));
    const res = await request('/properties?city=London&search=university&minRent=0&maxRent=900&propertyType=room&furnished=true&billsIncluded=false&page=2&limit=6');
    assert.equal(res.status, 200); const options = find.mock.calls[0].arguments[0];
    assert.equal(options.where.status, 'approved'); assert.equal(options.where.furnished, true); assert.equal(options.where.billsIncluded, false); assert.equal(options.offset, 6); assert.equal(options.limit, 6); assert.deepEqual(res.data.data, []);
    assert.equal(options.where.rent[require('sequelize').Op.gte], 0);
    assert.equal(options.where[require('sequelize').Op.or].length, 6);
});
test('blank queries use defaults; invalid numbers, ranges and booleans rejected', async () => {
    mock.method(Property, 'findAndCountAll', async () => ({ count: 0, rows: [] }));
    assert.equal((await request('/properties?search=&city=&maxRent=&furnished=')).status, 200);
    for (const query of ['maxRent=abc','maxRent=12oops','minRent=-1','minRent=20&maxRent=10','page=0','limit=1000','page=1.5','furnished=maybe','propertyType=castle','search=one&search=two']) assert.equal((await request('/properties?'+query)).status, 400, query);
});
test('favourites require auth, reject duplicates and use the authenticated user', async () => {
    assert.equal((await request('/favourites')).status, 401); const token = auth(); mock.method(Property, 'findByPk', async () => listing);
    let created = true; const find = mock.method(Favourite, 'findOrCreate', async () => [{ id: 1 }, created]);
    const options = { method: 'POST', token, body: { propertyId: 10, userId: 999 } };
    assert.equal((await request('/favourites', options)).status, 201); created = false; assert.equal((await request('/favourites', options)).status, 409);
    assert.deepEqual(find.mock.calls[0].arguments[0].where, { userId: 1, propertyId: 10 });
    assert.ok(Favourite.options.indexes.some(i => i.unique && i.fields.join(',') === 'userId,propertyId'));
});
test('different users get separate favourite keys; removal cannot target another user', async () => {
    const token = auth({ ...renter, id: 4 }); mock.method(Property, 'findByPk', async () => listing);
    const find = mock.method(Favourite, 'findOrCreate', async () => [{ id: 2 }, true]);
    assert.equal((await request('/favourites', { method: 'POST', token, body: { propertyId: 10 } })).status, 201);
    assert.equal(find.mock.calls[0].arguments[0].where.userId, 4);
    const remove = mock.method(Favourite, 'destroy', async () => 0);
    assert.equal((await request('/favourites/10', { method: 'DELETE', token })).status, 404);
    assert.deepEqual(remove.mock.calls[0].arguments[0].where, { userId: 4, propertyId: 10 });
});
test('saved properties query filters approval status', async () => {
    const token = auth(); const find = mock.method(Favourite, 'findAll', async () => []);
    assert.equal((await request('/favourites', { token })).status, 200);
    assert.deepEqual(find.mock.calls[0].arguments[0].include[0].where, { status: 'approved' });
});
test('enquiry validates text/date, binds authenticated sender and persists unread', async () => {
    const token = auth(); mock.method(Property, 'findByPk', async () => listing); const create = mock.method(Enquiry, 'create', async x => x);
    for (const message of ['   ', {}, 'short']) assert.equal((await request('/enquiries', { method: 'POST', token, body: { propertyId: 10, message } })).status, 400);
    assert.equal((await request('/enquiries', { method: 'POST', token, body: { propertyId: 10, message: 'Interested in this property', moveInDate: '2026-02-30' } })).status, 400);
    const res = await request('/enquiries', { method: 'POST', token, body: { propertyId: 10, message: '  Interested in this property  ', userId: 999 } }); assert.equal(res.status, 201);
    const data = create.mock.calls[0].arguments[0]; assert.equal(data.userId, 1); assert.equal(data.senderEmail, renter.email); assert.equal(data.status, 'unread'); assert.equal(data.message, 'Interested in this property');
});
test('owner enquiry reads are scoped to owned properties', async () => {
    const token = auth(owner); const props = mock.method(Property, 'findAll', async () => [{ id: 10 }]); const enquiries = mock.method(Enquiry, 'findAll', async () => []);
    assert.equal((await request('/enquiries/received', { token })).status, 200);
    assert.deepEqual(props.mock.calls[0].arguments[0].where, { ownerId: 2 }); assert.deepEqual(enquiries.mock.calls[0].arguments[0].where, { propertyId: [10] });
});
test('enquiry status/reply forbid other owners and validate status', async () => {
    let updated; const enquiry = { property: listing, update: async d => { updated = d; } };
    let token = auth({ ...owner, id: 4 }); mock.method(Enquiry, 'findByPk', async () => enquiry);
    assert.equal((await request('/enquiries/1/reply', { method: 'PUT', token, body: { replyMessage: 'A reply' } })).status, 403);
    assert.equal((await request('/enquiries/1/status', { method: 'PUT', token, body: { status: 'read' } })).status, 403);
    mock.restoreAll(); token = auth(owner); mock.method(Enquiry, 'findByPk', async () => enquiry);
    assert.equal((await request('/enquiries/1/status', { method: 'PUT', token, body: { status: 'accepted' } })).status, 400);
    assert.equal((await request('/enquiries/1/reply', { method: 'PUT', token, body: { replyMessage: 'A valid reply' } })).status, 200); assert.equal(updated.status, 'replied'); assert.ok(updated.repliedAt instanceof Date);
});
test('profile changes only authenticated user fields; empty budget normalized', async () => {
    let updated; const token = auth({ ...renter, update: async d => { updated = d; } });
    const res = await request('/auth/profile', { method: 'PUT', token, body: { fullName: 'Updated Name', preferredMaxRent: '', preferredPropertyType: 'any', role: 'admin', id: 99 } });
    assert.equal(res.status, 200); assert.equal(updated.preferredMaxRent, null); assert.equal(updated.role, undefined); assert.equal(updated.id, undefined);
    assert.equal((await request('/auth/password', { method: 'PUT', token, body: {} })).status, 400);
});
test('readiness persists authenticated identity and effective profile snapshot before response', async () => {
    const token = auth(); mock.method(Property, 'findByPk', async () => listing); let stored;
    mock.method(ReadinessCheck, 'create', async d => { stored = d; });
    const res = await request('/readiness/check', { method: 'POST', token, body: { propertyId: 10, userId: 999 } });
    assert.equal(res.status, 200); assert.equal(stored.userId, 1); assert.equal(stored.propertyId, 10); assert.equal(stored.userMaxBudget, '800'); assert.equal(stored.userPreferredType, 'room'); assert.equal(stored.score, res.data.data.score); assert.deepEqual(stored.reasons, res.data.data.reasons);
});
test('readiness allows anonymous calculation without writes and validates preferences', async () => {
    mock.method(Property, 'findByPk', async () => listing); const create = mock.method(ReadinessCheck, 'create', async () => {});
    assert.equal((await request('/readiness/check', { method: 'POST', body: { propertyId: 10 } })).status, 200); assert.equal(create.mock.callCount(), 0);
    for (const maxBudget of [-1, 'abc', '12oops', {}]) assert.equal((await request('/readiness/check', { method: 'POST', body: { propertyId: 10, maxBudget } })).status, 400);
});
test('readiness persistence failure returns failure without leaking database errors', async () => {
    const token = auth(); mock.method(Property, 'findByPk', async () => listing); mock.method(ReadinessCheck, 'create', async () => { throw Error('private database details'); });
    const res = await request('/readiness/check', { method: 'POST', token, body: { propertyId: 10 } }); assert.equal(res.status, 500); assert.equal(JSON.stringify(res.data).includes('private database'), false);
});
test('history requires authentication and ignores another requested user ID', async () => {
    assert.equal((await request('/readiness/history')).status, 401); const token = auth(); const find = mock.method(ReadinessCheck, 'findAll', async () => []);
    assert.equal((await request('/readiness/history?userId=999', { token })).status, 200); assert.deepEqual(find.mock.calls[0].arguments[0].where, { userId: 1 });
});
test('admin approves/rejects and refuses unsupported states', async () => {
    const token = auth(admin); let updated; mock.method(Property, 'findByPk', async () => ({ ...listing, update: async d => { updated = d; } }));
    for (const status of ['approved','rejected']) { assert.equal((await request('/admin/properties/10/review', { method: 'PUT', token, body: { status } })).status, 200); assert.equal(updated.status, status); }
    assert.equal((await request('/admin/properties/10/review', { method: 'PUT', token, body: { status: 'archived' } })).status, 400);
});
test('model foreign keys and cascade policies match the declared schema', () => {
    for (const model of [Favourite, Enquiry, ReadinessCheck]) assert.equal(model.rawAttributes.propertyId.references.model, 'properties');
    assert.equal(Property.rawAttributes.ownerId.references.model, 'users'); assert.equal(Favourite.rawAttributes.userId.onDelete, 'CASCADE'); assert.equal(ReadinessCheck.rawAttributes.userId.onDelete, 'SET NULL');
});
for (const [score, category] of [[0,'Potential Risk'],[44,'Potential Risk'],[45,'Needs Checking'],[69,'Needs Checking'],[70,'Good Fit'],[100,'Good Fit']]) test(`readiness classification boundary ${score}`, () => assert.equal(classifyScore(score), category));
test('readiness rejects out-of-range classification values', () => { for (const score of [-1,101,NaN,Infinity]) assert.throws(() => classifyScore(score), RangeError); });
test('readiness maximum and all seven explanations', () => { const result = calculateReadiness(listing, { maxBudget: 800 }); assert.equal(result.score, 100); assert.equal(result.reasons.length, 7); });
test('readiness missing/zero/unknown input edge cases produce accurate reasons', () => {
    const score = (p, prefs = { maxBudget: 800 }) => calculateReadiness({ ...listing, ...p }, prefs);
    assert.equal(score({}, {}).score, 87); assert.equal(score({ rent: null }).score, 75);
    assert.equal(score({ billsIncluded: null }).score, 80); assert.match(score({ billsIncluded: null }).reasons[1].text, /unspecified/);
    for (const deposit of [null, undefined, '']) assert.equal(score({ deposit }).score, 85); assert.equal(score({ deposit: 0 }).score, 100);
    assert.equal(score({ furnished: null }).score, 85); assert.match(score({ furnished: null }).reasons[3].text, /unspecified/);
    assert.equal(score({ contractLengthMonths: null }).score, 90); assert.match(score({ contractLengthMonths: null }).reasons[4].text, /not specified/);
    assert.equal(score({ description: '', address: '', city: '', imageUrl: '', nearbyUniversity: '' }).score, 90);
    assert.equal(score({}, { maxBudget: 0 }).score, 75); assert.doesNotMatch(JSON.stringify(score({}, { maxBudget: 0 })), /NaN|Infinity/);
});
test('enumerated readiness combinations always stay within 0..100 and classify consistently', () => {
    let count = 0; const scores = new Set();
    for (const maxBudget of [undefined, 0, 800]) for (const rent of [null,0,700,900]) for (const billsIncluded of [null,false,true]) for (const deposit of [null,0,500]) for (const furnished of [null,false,true]) for (const contractLengthMonths of [null,6,12,18]) for (const preferredType of ['any','house']) {
        const r = calculateReadiness({ ...listing, rent, billsIncluded, deposit, furnished, contractLengthMonths }, { maxBudget, preferredType });
        assert.ok(Number.isInteger(r.score) && r.score >= 0 && r.score <= 100); assert.equal(r.result, classifyScore(r.score)); assert.equal(r.reasons.length, 7); scores.add(r.score); count++;
    }
    assert.equal(count, 2592); for (const boundary of [44,45,69,70,100]) assert.ok(scores.has(boundary), 'Engine produced boundary ' + boundary);
});

test('JWT configuration refuses missing or predictable fallback secrets', () => {
    const { getJwtSecret } = require('../config/jwt');
    const original = process.env.JWT_SECRET;
    try { for (const value of ['', 'secret', 'replace_with_a_random_secret_of_at_least_32_characters']) { process.env.JWT_SECRET = value; assert.throws(getJwtSecret); } }
    finally { process.env.JWT_SECRET = original; }
});
test('admin statistics return only the five actual counters', async () => {
    const token = auth(admin); mock.method(User, 'count', async () => 4); mock.method(Property, 'count', async options => options?.where?.status === 'approved' ? 2 : options?.where?.status === 'pending' ? 1 : 3); mock.method(Enquiry, 'count', async () => 5);
    const res = await request('/admin/stats', { token }); assert.equal(res.status, 200);
    assert.deepEqual(res.data.data, { totalUsers: 4, totalProperties: 3, approvedProperties: 2, pendingProperties: 1, totalEnquiries: 5 });
});
test('account status updates cannot deactivate administrators', async () => {
    const token = auth(admin);
    assert.equal((await request('/admin/users/3/toggle', { method: 'PUT', token, body: {} })).status, 403);
});
test('malformed JSON receives 400 without an internal exception', async () => {
    const response = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
    assert.equal(response.status, 400); assert.equal((await response.json()).message, 'Invalid JSON body.');
});

test('MariaDB JSON reasons and image lists deserialize for frontend consumers', () => {
    const reasons = [{ type: 'neutral', text: 'Example reason' }];
    for (const input of [reasons, JSON.stringify(reasons), JSON.stringify(JSON.stringify(reasons))]) {
        const check = ReadinessCheck.build({ reasons: input }); assert.deepEqual(check.reasons, reasons); assert.deepEqual(check.toJSON().reasons, reasons);
    }
    const property = Property.build({ imageUrls: JSON.stringify(['https://example.test/photo.jpg']) });
    assert.deepEqual(property.imageUrls, ['https://example.test/photo.jpg']);
    assert.deepEqual(ReadinessCheck.build({ reasons: null }).reasons, []);
});
