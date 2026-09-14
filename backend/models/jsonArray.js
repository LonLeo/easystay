// MariaDB reports JSON columns as LONGTEXT when using the MySQL dialect.
// Accept native arrays and serialized arrays from legacy records.
module.exports = function jsonArray(value) {
    for (let depth = 0; depth < 2 && typeof value === 'string'; depth++) {
        try { value = JSON.parse(value); } catch { return []; }
    }
    return Array.isArray(value) ? value : [];
};
