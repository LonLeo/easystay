// =============================================================
//  EasyStay — Sequelize Seeder
//  File: backend/seeders/seed.js
//
//  HOW TO RUN:
//    cd backend
//    node seeders/seed.js
//
//  This script will:
//    1. Sync the DB (creates tables if missing)
//    2. Wipe existing data in correct FK order
//    3. Insert all sample data using bulkCreate
// =============================================================

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Property, Favourite, Enquiry, ReadinessCheck } = require('../models');

// ─── helper ──────────────────────────────────────────────────
const hash = (plain) => bcrypt.hash(plain, 12);

async function seed() {
  if (process.env.ALLOW_DESTRUCTIVE_SEED !== 'true' || !process.env.SEED_PASSWORD || Buffer.byteLength(process.env.SEED_PASSWORD, 'utf8') > 72 || process.env.SEED_PASSWORD.length < 12) {
    throw new Error('Legacy seeder requires explicit ALLOW_DESTRUCTIVE_SEED=true and a private SEED_PASSWORD (12+ characters, at most 72 UTF-8 bytes). It clears all data.');
  }
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();

    console.log('🔄 Syncing tables...');
    await sequelize.sync({ force: false }); // use { force: true } to drop & recreate

    // ── WIPE all tables — disable FK checks so truncate works ──
    console.log('🧹 Clearing existing data...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.query('TRUNCATE TABLE `readiness_checks`');
    await sequelize.query('TRUNCATE TABLE `enquiries`');
    await sequelize.query('TRUNCATE TABLE `favourites`');
    await sequelize.query('TRUNCATE TABLE `properties`');
    await sequelize.query('TRUNCATE TABLE `users`');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // ── 1. USERS ─────────────────────────────────────────────
    console.log('👤 Seeding users...');
    const password = await hash(process.env.SEED_PASSWORD);

    const users = await User.bulkCreate([
      {
        fullName: 'Admin EasyStay',
        email: 'admin@easystay.co.uk',
        passwordHash: password,
        role: 'admin',
        phone: '+44 20 7946 0001',
        bio: 'Platform administrator for EasyStay.',
        preferredMaxRent: null,
        preferredPropertyType: 'any',
        isActive: true,
      },
      {
        fullName: 'James Okafor',
        email: 'james.okafor@gmail.com',
        passwordHash: password,
        role: 'owner',
        phone: '+44 7700 900101',
        bio: 'Landlord with properties in North London. Fast responses guaranteed.',
        preferredMaxRent: null,
        preferredPropertyType: 'any',
        isActive: true,
      },
      {
        fullName: 'Priya Sharma',
        email: 'priya.sharma@gmail.com',
        passwordHash: password,
        role: 'owner',
        phone: '+44 7700 900102',
        bio: 'Property owner in East London. Flexible with contracts.',
        preferredMaxRent: null,
        preferredPropertyType: 'any',
        isActive: true,
      },
      {
        fullName: 'Lucas Ferreira',
        email: 'lucas.ferreira@gmail.com',
        passwordHash: password,
        role: 'owner',
        phone: '+44 7700 900103',
        bio: 'South London landlord. All properties furnished and bills included.',
        preferredMaxRent: null,
        preferredPropertyType: 'any',
        isActive: true,
      },
      {
        fullName: 'Amara Diallo',
        email: 'amara.diallo@gmail.com',
        passwordHash: password,
        role: 'owner',
        phone: '+44 7700 900104',
        bio: 'Student-friendly landlord near QMUL Mile End. Rolling contracts available.',
        preferredMaxRent: null,
        preferredPropertyType: 'any',
        isActive: true,
      },
      {
        fullName: 'Daniel Park',
        email: 'daniel.park@gmail.com',
        passwordHash: password,
        role: 'owner',
        phone: '+44 7700 900105',
        bio: 'Modern flats in Stratford and Paddington. Great for commuters.',
        preferredMaxRent: null,
        preferredPropertyType: 'any',
        isActive: true,
      },
      {
        fullName: 'Rahul Mehta',
        email: 'rahul.mehta@gmail.com',
        passwordHash: password,
        role: 'user',
        phone: '+44 7700 900201',
        bio: 'MSc Computing student at QMUL. Looking for a room near Mile End.',
        preferredMaxRent: 900.00,
        preferredPropertyType: 'room',
        isActive: true,
      },
      {
        fullName: 'Sofia Mensah',
        email: 'sofia.mensah@gmail.com',
        passwordHash: password,
        role: 'user',
        phone: '+44 7700 900202',
        bio: 'International student at UCL. Prefer South or East London.',
        preferredMaxRent: 1200.00,
        preferredPropertyType: 'room',
        isActive: true,
      },
      {
        fullName: 'Aisha Nwosu',
        email: 'aisha.nwosu@gmail.com',
        passwordHash: password,
        role: 'user',
        phone: '+44 7700 900203',
        bio: 'Nurse at Kings College Hospital. Need quiet room with good transport.',
        preferredMaxRent: 1000.00,
        preferredPropertyType: 'room',
        isActive: true,
      },
      {
        fullName: 'Tom Walsh',
        email: 'tom.walsh@gmail.com',
        passwordHash: password,
        role: 'user',
        phone: '+44 7700 900204',
        bio: 'Software developer in Canary Wharf. Need fast broadband and easy commute.',
        preferredMaxRent: 1400.00,
        preferredPropertyType: 'studio',
        isActive: true,
      },
      {
        fullName: 'Mei Lin',
        email: 'mei.lin@gmail.com',
        passwordHash: password,
        role: 'user',
        phone: '+44 7700 900205',
        bio: 'PhD student at Imperial College. Looking for a studio in West London.',
        preferredMaxRent: 1500.00,
        preferredPropertyType: 'studio',
        isActive: true,
      },
      {
        fullName: 'Kofi Asante',
        email: 'kofi.asante@gmail.com',
        passwordHash: password,
        role: 'user',
        phone: '+44 7700 900206',
        bio: 'Business student at Greenwich University. Tight budget, SE London preferred.',
        preferredMaxRent: 750.00,
        preferredPropertyType: 'room',
        isActive: true,
      },
    ], { individualHooks: false }); // individualHooks:false = passwords already hashed above

    // Map names to IDs for readability
    const u = {};
    users.forEach(usr => { u[usr.email] = usr.id; });

    // ── 2. PROPERTIES ─────────────────────────────────────────
    console.log('🏠 Seeding properties...');
    const properties = await Property.bulkCreate([
      {
        ownerId: u['james.okafor@gmail.com'],
        title: 'Cosy Double Room in Camden — Bills Included',
        description: 'Bright well-furnished double room in a friendly 4-bedroom shared house. 5-minute walk to Camden Town underground (Northern Line). All bills and fast broadband included. Ideal for students or young professionals.',
        city: 'London', address: '3 Camden High Street, Camden', postcode: 'NW1 7JE',
        rent: 950.00, deposit: 1000.00, propertyType: 'room',
        furnished: true, billsIncluded: true, contractLengthMonths: null,
        bedroomCount: 4, bathroomCount: 2,
        imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
        imageUrls: ['images/camden1.jpg', 'images/camden2.jpg'],
        availableFrom: '2025-03-01', nearbyUniversity: 'University College London',
        status: 'approved', viewCount: 124,
      },
      {
        ownerId: u['priya.sharma@gmail.com'],
        title: 'Modern Single Room — Hackney Wick Near Olympic Park',
        description: 'Stylish single room in a converted warehouse apartment. Floor-to-ceiling windows. 10-minute walk to Hackney Wick Overground. Close to Queen Elizabeth Olympic Park. WiFi included.',
        city: 'London', address: '52 Hackney Road, Hackney', postcode: 'E2 7NX',
        rent: 780.00, deposit: 800.00, propertyType: 'room',
        furnished: true, billsIncluded: true, contractLengthMonths: 6,
        bedroomCount: 3, bathroomCount: 1,
        imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        imageUrls: ['images/hackney1.jpg', 'images/hackney2.jpg'],
        availableFrom: '2025-03-01', nearbyUniversity: 'Queen Mary University of London',
        status: 'approved', viewCount: 98,
      },
      {
        ownerId: u['lucas.ferreira@gmail.com'],
        title: 'Large En-suite Room in Brixton — 2 Min to Victoria Line',
        description: 'Beautiful en-suite double room in a refurbished Victorian terrace. 2 minutes to Brixton underground. Vibrant area with great markets and restaurants. Monthly rolling contract. All bills included.',
        city: 'London', address: '11 Coldharbour Lane, Brixton', postcode: 'SW9 8LN',
        rent: 1100.00, deposit: 1100.00, propertyType: 'room',
        furnished: true, billsIncluded: true, contractLengthMonths: null,
        bedroomCount: 3, bathroomCount: 2,
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
        imageUrls: ['images/brixton1.jpg', 'images/brixton2.jpg'],
        availableFrom: '2025-03-01', nearbyUniversity: 'Kings College London',
        status: 'approved', viewCount: 187,
      },
      {
        ownerId: u['amara.diallo@gmail.com'],
        title: 'Quiet Double Room in Tooting — Near St Georges Hospital',
        description: 'Clean quiet double room in a well-maintained house share. Perfect for NHS workers or students at St Georges. 5-minute walk to Tooting Bec underground. Council tax and WiFi included.',
        city: 'London', address: '19 Tooting High Street, Tooting', postcode: 'SW17 0SN',
        rent: 870.00, deposit: 900.00, propertyType: 'room',
        furnished: true, billsIncluded: true, contractLengthMonths: 6,
        bedroomCount: 4, bathroomCount: 1,
        imageUrl: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800',
        imageUrls: ['images/tooting1.jpg', 'images/tooting2.jpg'],
        availableFrom: '2025-03-15', nearbyUniversity: 'St Georges University of London',
        status: 'approved', viewCount: 76,
      },
      {
        ownerId: u['daniel.park@gmail.com'],
        title: 'Self-Contained Studio Flat — Edgware Road',
        description: 'Fully self-contained studio with kitchenette and private bathroom. Ideal for a working professional. 3-minute walk to Edgware Road underground. High-speed broadband and all bills included.',
        city: 'London', address: '7 Edgware Road, Paddington', postcode: 'W2 2JE',
        rent: 1450.00, deposit: 1500.00, propertyType: 'studio',
        furnished: true, billsIncluded: true, contractLengthMonths: null,
        bedroomCount: 1, bathroomCount: 1,
        imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        imageUrls: ['images/edgware1.jpg', 'images/edgware2.jpg'],
        availableFrom: '2025-02-28', nearbyUniversity: null,
        status: 'approved', viewCount: 215,
      },
      {
        ownerId: u['james.okafor@gmail.com'],
        title: 'Affordable Shared Room in Peckham — Bills Included',
        description: 'Budget-friendly shared room in a clean safe house. Close to Peckham Rye Overground. Supermarkets and cafes nearby. Suitable for students or new arrivals. All bills included.',
        city: 'London', address: '88 Peckham Rye, Peckham', postcode: 'SE15 4JR',
        rent: 550.00, deposit: 550.00, propertyType: 'room',
        furnished: false, billsIncluded: true, contractLengthMonths: null,
        bedroomCount: 4, bathroomCount: 1,
        imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
        imageUrls: ['images/peckham1.jpg'],
        availableFrom: '2025-03-01', nearbyUniversity: 'Goldsmiths University of London',
        status: 'approved', viewCount: 62,
      },
      {
        ownerId: u['priya.sharma@gmail.com'],
        title: 'Trendy Double Room in Shoreditch — 1 Gig Broadband',
        description: 'Stylish double room in a modern Shoreditch flat. Perfect for creatives and tech professionals. Walking distance to Old Street Silicon Roundabout. 1 Gigabit fibre broadband included. Flexible contract.',
        city: 'London', address: '14 Brick Lane, Shoreditch', postcode: 'E1 6RF',
        rent: 1250.00, deposit: 1300.00, propertyType: 'room',
        furnished: true, billsIncluded: true, contractLengthMonths: null,
        bedroomCount: 3, bathroomCount: 2,
        imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        imageUrls: ['images/shoreditch1.jpg', 'images/shoreditch2.jpg'],
        availableFrom: '2025-03-01', nearbyUniversity: 'Queen Mary University of London',
        status: 'approved', viewCount: 143,
      },
      {
        ownerId: u['amara.diallo@gmail.com'],
        title: 'Student Room in Mile End — 10 Min Walk to QMUL',
        description: 'Warm student house share. 10-minute walk to Queen Mary University of London. 4 friendly international housemates. All bills included. Monthly rolling contract. Great atmosphere.',
        city: 'London', address: '25 Mile End Road, Stepney', postcode: 'E1 4TP',
        rent: 820.00, deposit: 820.00, propertyType: 'room',
        furnished: true, billsIncluded: true, contractLengthMonths: null,
        bedroomCount: 5, bathroomCount: 2,
        imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800',
        imageUrls: ['images/mileend1.jpg', 'images/mileend2.jpg'],
        availableFrom: '2025-03-01', nearbyUniversity: 'Queen Mary University of London',
        status: 'approved', viewCount: 109,
      },
      {
        ownerId: u['daniel.park@gmail.com'],
        title: 'Spacious Double Room in Stratford — Near Westfield',
        description: 'Spacious double room in a modern flat. 5-minute walk to Stratford station and Westfield Shopping Centre. Excellent transport: Elizabeth Line, Central Line and DLR. WiFi and council tax included.',
        city: 'London', address: '66 Stratford High Street, Stratford', postcode: 'E15 1PE',
        rent: 900.00, deposit: 950.00, propertyType: 'room',
        furnished: true, billsIncluded: true, contractLengthMonths: 6,
        bedroomCount: 3, bathroomCount: 1,
        imageUrl: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
        imageUrls: ['images/stratford1.jpg', 'images/stratford2.jpg'],
        availableFrom: '2025-03-01', nearbyUniversity: 'University of East London',
        status: 'approved', viewCount: 88,
      },
      {
        ownerId: u['lucas.ferreira@gmail.com'],
        title: 'Affordable Single Room in Lewisham',
        description: 'Affordable single room in a tidy 3-bedroom house. 7-minute walk to Lewisham DLR and Southeastern rail. Close to Lewisham Shopping Centre. Professional housemates. Bills negotiable.',
        city: 'London', address: '34 Lewisham High Street, Lewisham', postcode: 'SE13 6EE',
        rent: 700.00, deposit: 700.00, propertyType: 'room',
        furnished: false, billsIncluded: false, contractLengthMonths: 12,
        bedroomCount: 3, bathroomCount: 1,
        imageUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
        imageUrls: ['images/lewisham1.jpg'],
        availableFrom: '2025-03-15', nearbyUniversity: 'University of Greenwich',
        status: 'approved', viewCount: 54,
      },
      {
        ownerId: u['lucas.ferreira@gmail.com'],
        title: 'Modern 1-Bed Flat in Greenwich — River Views',
        description: 'Stunning 1-bedroom flat with partial Thames views. Open-plan kitchen and living area. 5 minutes to Greenwich DLR. Close to the O2 Arena and Greenwich Park. Ideal for a professional or couple.',
        city: 'London', address: '12 Greenwich High Road, Greenwich', postcode: 'SE10 8LH',
        rent: 1650.00, deposit: 1700.00, propertyType: 'flat',
        furnished: true, billsIncluded: false, contractLengthMonths: 12,
        bedroomCount: 1, bathroomCount: 1,
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        imageUrls: ['images/greenwich1.jpg', 'images/greenwich2.jpg'],
        availableFrom: '2025-04-01', nearbyUniversity: 'University of Greenwich',
        status: 'approved', viewCount: 201,
      },
      {
        ownerId: u['james.okafor@gmail.com'],
        title: 'En-suite Room in Islington — Angel Tube 3 Min Walk',
        description: 'Bright en-suite room in a Georgian townhouse. 3 minutes to Angel underground (Northern Line). Surrounded by great restaurants on Upper Street. All bills included. Sociable professional household.',
        city: 'London', address: '7 Upper Street, Islington', postcode: 'N1 0PQ',
        rent: 1200.00, deposit: 1200.00, propertyType: 'room',
        furnished: true, billsIncluded: true, contractLengthMonths: null,
        bedroomCount: 4, bathroomCount: 3,
        imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
        imageUrls: ['images/islington1.jpg', 'images/islington2.jpg'],
        availableFrom: '2025-03-01', nearbyUniversity: 'City University London',
        status: 'pending', viewCount: 12,
      },
    ]);

    const p = {};
    properties.forEach(prop => { p[prop.title.substring(0, 20)] = prop.id; });
    const pIds = properties.map(pr => pr.id);

    // ── 3. FAVOURITES ─────────────────────────────────────────
    console.log('❤️  Seeding favourites...');
    await Favourite.bulkCreate([
      { userId: u['rahul.mehta@gmail.com'],   propertyId: pIds[7]  },
      { userId: u['rahul.mehta@gmail.com'],   propertyId: pIds[0]  },
      { userId: u['rahul.mehta@gmail.com'],   propertyId: pIds[8]  },
      { userId: u['sofia.mensah@gmail.com'],  propertyId: pIds[2]  },
      { userId: u['sofia.mensah@gmail.com'],  propertyId: pIds[6]  },
      { userId: u['sofia.mensah@gmail.com'],  propertyId: pIds[10] },
      { userId: u['aisha.nwosu@gmail.com'],   propertyId: pIds[2]  },
      { userId: u['aisha.nwosu@gmail.com'],   propertyId: pIds[3]  },
      { userId: u['tom.walsh@gmail.com'],     propertyId: pIds[4]  },
      { userId: u['tom.walsh@gmail.com'],     propertyId: pIds[6]  },
      { userId: u['tom.walsh@gmail.com'],     propertyId: pIds[8]  },
      { userId: u['mei.lin@gmail.com'],       propertyId: pIds[4]  },
      { userId: u['mei.lin@gmail.com'],       propertyId: pIds[10] },
      { userId: u['kofi.asante@gmail.com'],   propertyId: pIds[5]  },
      { userId: u['kofi.asante@gmail.com'],   propertyId: pIds[9]  },
    ], { ignoreDuplicates: true });

    // ── 4. ENQUIRIES ──────────────────────────────────────────
    console.log('📩 Seeding enquiries...');
    await Enquiry.bulkCreate([
      {
        userId: u['rahul.mehta@gmail.com'], propertyId: pIds[7],
        message: 'Hi Amara, I am a first-year MSc student at QMUL and your Mile End listing looks perfect. Is the room available from 1st March? I am clean, quiet and respectful of shared spaces.',
        senderName: 'Rahul Mehta', senderEmail: 'rahul.mehta@gmail.com',
        status: 'replied', moveInDate: '2025-03-01',
      },
      {
        userId: u['rahul.mehta@gmail.com'], propertyId: pIds[8],
        message: 'Hello Daniel, I work in Canary Wharf. What is the DLR commute like from Stratford? Is there parking available nearby as I own a car?',
        senderName: 'Rahul Mehta', senderEmail: 'rahul.mehta@gmail.com',
        status: 'read', moveInDate: '2025-03-01',
      },
      {
        userId: u['sofia.mensah@gmail.com'], propertyId: pIds[2],
        message: 'Hi Lucas, I am very interested in the Brixton en-suite. Is it available from 1st March? I am an international student and a flexible monthly contract would be ideal.',
        senderName: 'Sofia Mensah', senderEmail: 'sofia.mensah@gmail.com',
        status: 'replied', moveInDate: '2025-03-01',
      },
      {
        userId: u['sofia.mensah@gmail.com'], propertyId: pIds[6],
        message: 'Hello Priya, I saw your Shoreditch listing. I am a creative professional and the Brick Lane location sounds amazing. Is the room still free?',
        senderName: 'Sofia Mensah', senderEmail: 'sofia.mensah@gmail.com',
        status: 'read', moveInDate: '2025-03-01',
      },
      {
        userId: u['aisha.nwosu@gmail.com'], propertyId: pIds[2],
        message: 'Hi Lucas, I am a nurse at Kings College Hospital. Your Brixton en-suite location is perfect for my commute. Could I arrange a viewing this week?',
        senderName: 'Aisha Nwosu', senderEmail: 'aisha.nwosu@gmail.com',
        status: 'replied', moveInDate: '2025-03-15',
      },
      {
        userId: u['aisha.nwosu@gmail.com'], propertyId: pIds[3],
        message: 'Hello Amara, the Tooting room looks ideal — I work at St Georges Hospital just down the road. Are there any other NHS workers in the house? When can I view?',
        senderName: 'Aisha Nwosu', senderEmail: 'aisha.nwosu@gmail.com',
        status: 'unread', moveInDate: '2025-03-15',
      },
      {
        userId: u['tom.walsh@gmail.com'], propertyId: pIds[4],
        message: 'Hi Daniel, I am a software developer who works from home. Your Edgware Road studio is exactly what I need for privacy and fast internet. Can I book a viewing this weekend?',
        senderName: 'Tom Walsh', senderEmail: 'tom.walsh@gmail.com',
        status: 'replied', moveInDate: '2025-02-28',
      },
      {
        userId: u['tom.walsh@gmail.com'], propertyId: pIds[6],
        message: 'Hi Priya, the Shoreditch flat looks great. I am a developer so the gigabit broadband is very appealing. Are the other housemates in tech as well?',
        senderName: 'Tom Walsh', senderEmail: 'tom.walsh@gmail.com',
        status: 'read', moveInDate: '2025-03-01',
      },
      {
        userId: u['mei.lin@gmail.com'], propertyId: pIds[4],
        message: 'Hello Daniel, I am a PhD student at Imperial College. Your Edgware Road studio is very close to Paddington which is perfect for me. What floor is the studio on?',
        senderName: 'Mei Lin', senderEmail: 'mei.lin@gmail.com',
        status: 'read', moveInDate: '2025-03-01',
      },
      {
        userId: u['mei.lin@gmail.com'], propertyId: pIds[10],
        message: 'Hi Lucas, the Greenwich flat looks stunning with the river views! Is it available from 1st April? I am a very quiet and tidy PhD student. Would love to arrange a viewing.',
        senderName: 'Mei Lin', senderEmail: 'mei.lin@gmail.com',
        status: 'unread', moveInDate: '2025-04-01',
      },
      {
        userId: u['kofi.asante@gmail.com'], propertyId: pIds[5],
        message: 'Hi James, the Peckham shared room looks great for my budget. I am a student at Greenwich University. Are all bills really included? When is it available?',
        senderName: 'Kofi Asante', senderEmail: 'kofi.asante@gmail.com',
        status: 'replied', moveInDate: '2025-03-01',
      },
      {
        userId: u['kofi.asante@gmail.com'], propertyId: pIds[9],
        message: 'Hello Lucas, the Lewisham single room looks very affordable. I study at Greenwich University which is just one stop on the DLR. Could I come for a viewing this week?',
        senderName: 'Kofi Asante', senderEmail: 'kofi.asante@gmail.com',
        status: 'read', moveInDate: '2025-03-15',
      },
    ]);

    // ── 5. READINESS CHECKS ───────────────────────────────────
    console.log('✅ Seeding readiness checks...');
    await ReadinessCheck.bulkCreate([
      { userId: u['rahul.mehta@gmail.com'],  propertyId: pIds[7],  result: 'Good Fit',      score: 92, reasons: ['Rent is within your budget', 'Near Queen Mary University of London', 'All bills included', 'Flexible rolling contract'], userMaxBudget: 900.00,  userPreferredType: 'room'   },
      { userId: u['rahul.mehta@gmail.com'],  propertyId: pIds[8],  result: 'Good Fit',      score: 85, reasons: ['Rent is within your budget', 'Excellent DLR links to Canary Wharf', 'Modern furnished room', 'Bills included'],            userMaxBudget: 900.00,  userPreferredType: 'room'   },
      { userId: u['sofia.mensah@gmail.com'], propertyId: pIds[2],  result: 'Good Fit',      score: 88, reasons: ['Rent within budget', 'En-suite room offers privacy', '2 min to Victoria Line', 'Bills fully included'],                     userMaxBudget: 1200.00, userPreferredType: 'room'   },
      { userId: u['sofia.mensah@gmail.com'], propertyId: pIds[6],  result: 'Good Fit',      score: 79, reasons: ['Rent within budget', 'Trendy location for creatives', '1 Gig broadband', 'Bills included'],                                 userMaxBudget: 1200.00, userPreferredType: 'room'   },
      { userId: u['aisha.nwosu@gmail.com'],  propertyId: pIds[2],  result: 'Good Fit',      score: 90, reasons: ['Rent within budget', 'En-suite ideal for professional', 'Close to Kings College Hospital', 'All bills included'],            userMaxBudget: 1000.00, userPreferredType: 'room'   },
      { userId: u['aisha.nwosu@gmail.com'],  propertyId: pIds[3],  result: 'Good Fit',      score: 95, reasons: ['Rent within budget', '5 minutes from St Georges Hospital', 'Very quiet neighbourhood', 'Bills and council tax included'],     userMaxBudget: 1000.00, userPreferredType: 'room'   },
      { userId: u['tom.walsh@gmail.com'],    propertyId: pIds[4],  result: 'Good Fit',      score: 87, reasons: ['Rent within budget', 'Studio matches your preference', 'Private space for remote work', 'High-speed broadband included'],     userMaxBudget: 1400.00, userPreferredType: 'studio' },
      { userId: u['tom.walsh@gmail.com'],    propertyId: pIds[6],  result: 'Needs Checking',score: 65, reasons: ['Shared house not a studio', 'Good broadband for remote work', 'Rent slightly above your limit'],                              userMaxBudget: 1400.00, userPreferredType: 'studio' },
      { userId: u['mei.lin@gmail.com'],      propertyId: pIds[4],  result: 'Good Fit',      score: 83, reasons: ['Rent within budget', 'Studio matches preference', 'Close to Paddington for Imperial commute', 'All bills included'],          userMaxBudget: 1500.00, userPreferredType: 'studio' },
      { userId: u['mei.lin@gmail.com'],      propertyId: pIds[10], result: 'Needs Checking',score: 58, reasons: ['Rent exceeds your stated budget', '12-month contract required', 'No nearby university listed'],                               userMaxBudget: 1500.00, userPreferredType: 'studio' },
      { userId: u['kofi.asante@gmail.com'],  propertyId: pIds[5],  result: 'Good Fit',      score: 96, reasons: ['Rent well within budget', 'All bills fully included', 'Close to Peckham Rye station', 'Student-friendly household'],          userMaxBudget: 750.00,  userPreferredType: 'room'   },
      { userId: u['kofi.asante@gmail.com'],  propertyId: pIds[9],  result: 'Good Fit',      score: 91, reasons: ['Rent within budget', 'One stop to Greenwich University on DLR', 'Professional housemates', 'Good transport connections'],      userMaxBudget: 750.00,  userPreferredType: 'room'   },
    ]);

    console.log('\n✅ SEEDING COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  users            : 12');
    console.log('  properties       : 12 (11 approved, 1 pending)');
    console.log('  favourites       : 15');
    console.log('  enquiries        : 12');
    console.log('  readiness_checks : 12');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

// Export for use in server.js auto-seed
// Can also be run directly: node seeders/seed.js
if (require.main === module) {
  // Called directly via: node seeders/seed.js
  seed();
} else {
  // Imported by server.js — export the function
  module.exports = seed;
}

