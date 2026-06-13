const request = require('supertest');
const httpStatus = require('http-status').default;
const app = require('../app');
const setupTestDB = require('./setupTestDB');
const Car = require('../shared/models/car.model');
const User = require('../shared/models/user.model');
const jwt = require('jsonwebtoken');

setupTestDB();

const createToken = (userId) => {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET || 'thisisasamplesecret', { expiresIn: '1h' });
};

describe('Car Rental Modules', () => {
  let userOne, adminOne, userToken, adminToken;
  let sampleCar;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'thisisasamplesecret';

    userOne = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      password: 'password123',
      role: 'user',
      isPhoneVerified: true,
    });

    adminOne = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '0987654321',
      password: 'password123',
      role: 'admin',
      isPhoneVerified: true,
    });

    userToken = createToken(userOne._id);
    adminToken = createToken(adminOne._id);

    sampleCar = await Car.create({
      name: 'Corolla',
      brand: 'Toyota',
      type: 'Sedan',
      pricePerDay: 50,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      seatingCapacity: 5,
      location: { type: 'Point', coordinates: [-73.935242, 40.730610] },
    });

    await Car.syncIndexes();
  });

  describe('nearby car search using coordinates', () => {
    test('should return nearby car with valid coordinates', async () => {
      const res = await request(app)
        .get('/api/user/cars/nearby?lat=40.730610&lng=-73.935242&maxDistance=5000')
        .expect(httpStatus.OK);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toBe('Corolla');
    });

    test('should not return a car if it is too far away', async () => {
      const res = await request(app)
        .get('/api/user/cars/nearby?lat=34.052235&lng=-118.243683&maxDistance=5000')
        .expect(httpStatus.OK);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe('admin vs user access control', () => {
    test('user should not be able to create a car via admin route', async () => {
      await request(app)
        .post('/api/admin/cars')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Civic', brand: 'Honda', type: 'Sedan', pricePerDay: 60,
          fuelType: 'Petrol', transmission: 'Auto', seatingCapacity: 5,
        })
        .expect(httpStatus.FORBIDDEN);
    });

    test('admin should be able to create a car', async () => {
      await request(app)
        .post('/api/admin/cars')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Civic', brand: 'Honda', type: 'Sedan', pricePerDay: 60,
          fuelType: 'Petrol', transmission: 'Auto', seatingCapacity: 5,
        })
        .expect(httpStatus.CREATED);
    });
  });

  describe('booking overlap prevention', () => {
    test('should prevent booking if dates overlap', async () => {
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          carId: sampleCar._id,
          startDate: '2026-05-10T10:00:00Z',
          endDate: '2026-05-15T10:00:00Z',
        })
        .expect(httpStatus.CREATED);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          carId: sampleCar._id,
          startDate: '2026-05-12T10:00:00Z',
          endDate: '2026-05-18T10:00:00Z',
        })
        .expect(httpStatus.CONFLICT);

      expect(res.body.message).toMatch(/booked/i);
    });
  });

  describe('home feed', () => {
    test('should return home feed without auth', async () => {
      const res = await request(app).get('/api/home/feed').expect(httpStatus.OK);
      expect(res.body).toHaveProperty('specialOffers');
      expect(res.body).toHaveProperty('famousFleet');
    });
  });

  describe('admin dashboard', () => {
    test('admin should access dashboard stats', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('heroStats');
      expect(res.body).toHaveProperty('fleetSegments');
    });
  });
});
