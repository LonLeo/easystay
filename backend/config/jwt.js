function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32 || secret.startsWith('replace_')) {
        throw new Error('Set JWT_SECRET to a random secret of at least 32 characters.');
    }
    return secret;
}
module.exports = { getJwtSecret };
