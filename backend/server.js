require('dotenv').config();
const { getJwtSecret } = require('./config/jwt');
const { sequelize } = require('./models');
const app = require('./app');
async function start() {
    getJwtSecret();
    await sequelize.authenticate();
    if (process.env.DB_SYNC === 'true') await sequelize.sync();
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log('EasyStay backend listening on port ' + port));
}
if (require.main === module) start().catch(() => {
    console.error('Startup failed. Check JWT and database configuration.');
    process.exitCode = 1;
});
module.exports = { start };
