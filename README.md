# EasyStay

MSc prototype with React 18 / React Router / Axios in `frontend`, and Express 5 / Sequelize 6 in `backend`. The database uses the MySQL dialect and supports MySQL or MariaDB. Roles are `user` (renter), `owner` and `admin`.

## Setup

Use Node.js 24 and npm. In each package run `npm ci`. Copy each `.env.example` to `.env` only when configuring a new installation; preserve an existing local configuration. Set database credentials and a private, randomly generated JWT secret of at least 32 characters. Never commit `.env` files.

For an existing database, leave `DB_SYNC=false` (default). Start with `npm start` in `backend`, then `npm start` in `frontend`. The development frontend proxies `/api` to port 5000. For a fresh installation, follow the seeding steps below; the seeder creates the missing tables before adding sample data. Normal startup never uses `alter:true` or seeds records. There are no versioned migrations.

The `backend/seeders/seed.js` script is used to prepare a fresh local database. It creates any missing tables, clears existing application data, and inserts the sample users and properties. To prevent accidental data loss, it only runs when `ALLOW_DESTRUCTIVE_SEED=true` and a private `SEED_PASSWORD` is configured. Run it only against the new database created for this project. The script includes an administrator account because administrators cannot register through the public registration page.

## How to run

1. Install Node.js 24 and MySQL or MariaDB, then start the database server.
2. Create an empty database named `easystay_db` (or choose another name and use it for `DB_NAME`):

   ```sql
   CREATE DATABASE easystay_db;
   ```

3. From the project root, install the dependencies:

   ```powershell
   cd backend
   npm ci
   Copy-Item .env.example .env

   cd ..\frontend
   npm ci
   Copy-Item .env.example .env
   ```

   On macOS or Linux, replace `Copy-Item` with `cp` and `..\frontend` with `../frontend`.

4. Edit `backend/.env`. Set `DB_USER`, `DB_PASSWORD`, and any non-default database connection values. Replace `JWT_SECRET` with a random secret containing at least 32 characters. To allow the initial seed, also set:

   ```dotenv
   DB_SYNC=false
   ALLOW_DESTRUCTIVE_SEED=true
   SEED_PASSWORD=choose_a_private_demo_password
   ```

   `SEED_PASSWORD` must contain at least 12 characters (and at most 72 UTF-8 bytes). It becomes the login password for every sample account.

5. From `backend`, run the seed script. It creates the tables and populates the new database with sample users, properties, favourites, enquiries, and readiness checks:

   ```powershell
   node seeders/seed.js
   ```

   The seeder clears all application tables before inserting its sample data, so only run it against the newly created database. After it succeeds, change `ALLOW_DESTRUCTIVE_SEED` back to `false` in `backend/.env`.

6. Start the backend in one terminal:

   ```powershell
   cd backend
   npm start
   ```

7. Start the frontend in a second terminal:

   ```powershell
   cd frontend
   npm start
   ```

8. Open <http://localhost:3000> in a browser. The API runs at <http://localhost:5000>, and the development frontend forwards `/api` requests to it. You can sign in with any email defined in `backend/seeders/seed.js` (for example, `admin@easystay.co.uk`) and the `SEED_PASSWORD` you chose.

If PowerShell blocks `npm.ps1`, use `npm.cmd ci` and `npm.cmd start` instead. If either `.env` already exists, do not overwrite it.

## Verification

From `backend`:

```text
npm test
npm run verify:readonly
```

Backend tests use Node's built-in runner, real Express HTTP handling/JWT/bcrypt/Sequelize definitions, and mocked database methods. They do not write to MySQL. `verify:readonly` connects to the configured database, checks referential integrity and performs read-only API queries plus an anonymous readiness calculation. It does not call property-detail GET because that endpoint increments the view counter.

From `frontend`:

```text
npm test -- --runInBand
npm run lint
npm run build
```

Frontend tests use the existing react-scripts Jest/jsdom runtime with mocked API calls. They are component/route checks, not a real-browser or complete MySQL-backed user-journey test. In PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`. The build needs a web server with SPA routing and `/api` forwarding to the backend; it is not served by the backend automatically.

## Readiness rules

Weights: budget 25, bills 20, deposit 15, furnished 15, contract 10, completeness 10, type preference 5. Good Fit is 70-100, Needs Checking 45-69, Potential Risk 0-44. No budget receives 12, unspecified type receives 5. Missing contract receives 0 and a warning, an explicitly stated zero deposit receives 15. Standard 7-12 month contracts receive 7. The report gives the full breakdown and changed edge cases.
