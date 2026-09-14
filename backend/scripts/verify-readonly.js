// Reads the configured database and runs non-mutating API requests only.
// No sync, seeding, registration, view-count increments or authenticated checks.
process.env.NODE_ENV = 'test';
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const { sequelize, Property, ReadinessCheck } = require('../models');
const app = require('../app');

async function verify() {
    const results = [];
    const [version] = await sequelize.query('SELECT VERSION() AS version');
    results.push({ check: 'Database engine', value: version[0].version });
    for (const [table, fk, parent] of [
        ['properties', 'ownerId', 'users'], ['favourites', 'userId', 'users'],
        ['favourites', 'propertyId', 'properties'], ['enquiries', 'userId', 'users'],
        ['enquiries', 'propertyId', 'properties'], ['readiness_checks', 'userId', 'users'],
        ['readiness_checks', 'propertyId', 'properties'],
    ]) {
        // Identifiers are fixed literals above, never user input.
        const [rows] = await sequelize.query(`SELECT COUNT(*) AS count FROM ${table} c LEFT JOIN ${parent} p ON p.id=c.${fk} WHERE c.${fk} IS NOT NULL AND p.id IS NULL`);
        assert.equal(Number(rows[0].count), 0, `Orphans: ${table}.${fk}`);
        results.push({ check: `Orphans ${table}.${fk}`, count: Number(rows[0].count) });
    }
    const [duplicates] = await sequelize.query('SELECT COUNT(*) AS count FROM (SELECT userId,propertyId FROM favourites GROUP BY userId,propertyId HAVING COUNT(*)>1) d');
    assert.equal(Number(duplicates[0].count), 0);
    results.push({ check: 'Duplicate favourite pairs', count: 0 });
    const checks = await ReadinessCheck.findAll({ limit: 100 });
    assert.ok(checks.every(check => Array.isArray(check.toJSON().reasons)));
    results.push({ check: 'Existing readiness JSON serialization', rowsRead: checks.length, allArrays: true });
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    try {
        for (const query of ['', '?search=&city=&maxRent=', '?minRent=0&maxRent=2000&propertyType=room&furnished=true&billsIncluded=true', '?search=nonexistent_audit_query_19283']) {
            const res = await fetch(base + '/properties' + query);
            const data = await res.json();
            assert.equal(res.status, 200);
            assert.ok(data.data.every(property => property.status === 'approved'));
            results.push({ check: 'GET /properties' + query, status: res.status, count: data.data.length });
        }
        for (const path of ['/favourites', '/enquiries/my', '/readiness/history', '/admin/stats', '/properties/my']) {
            const res = await fetch(base + path);
            assert.equal(res.status, 401);
            results.push({ check: 'Anonymous ' + path, status: res.status });
        }
        const property = await Property.findOne({ where: { status: 'approved' } });
        if (property) {
            const res = await fetch(base + '/readiness/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId: property.id, maxBudget: 1000 }) });
            const data = await res.json(); assert.equal(res.status, 200); assert.ok(data.data.score >= 0 && data.data.score <= 100);
            results.push({ check: 'Anonymous readiness; no insert', status: res.status, score: data.data.score });
        } else results.push({ check: 'Anonymous readiness', status: 'SKIPPED: no approved listing' });
    } finally { await new Promise(resolve => server.close(resolve)); }
    console.log(JSON.stringify(results, null, 2));
}
verify().catch(err => { console.error('Read-only verification failed:', err.name); process.exitCode = 1; }).finally(() => sequelize.close());
