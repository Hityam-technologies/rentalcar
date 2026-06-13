const request = require('supertest');
const httpStatus = require('http-status').default;
const app = require('../app');
const setupTestDB = require('./setupTestDB');
const User = require('../shared/models/user.model');
const OTP = require('../shared/models/otp.model');

setupTestDB();

jest.setTimeout(30000);

describe('Auth routes', () => {
  const newUser = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
    password: 'password123',
  };

  describe('POST /api/auth/register', () => {
    test('should return 201 and register user if data is valid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body.message).toBe('User registered successfully. Please verify your phone with OTP.');
      
      const user = await User.findOne({ email: newUser.email });
      expect(user).toBeDefined();
      expect(user.isPhoneVerified).toBe(false);

      const otp = await OTP.findOne({ phone: newUser.phone, type: 'registration' });
      expect(otp).toBeDefined();
    });

    test('should return 400 if email is already taken', async () => {
      await User.create(newUser);
      await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /api/auth/verify-registration', () => {
    test('should verify registration and return tokens', async () => {
      await request(app).post('/api/auth/register').send(newUser);
      
      // In a real scenario we'd get the OTP from the service or mock it.
      // Since we know the OTP is hashed in DB, we'll manually set one for testing.
      const bcrypt = require('bcryptjs');
      const hashedOtp = await bcrypt.hash('123456', 8);
      await OTP.findOneAndUpdate(
        { phone: newUser.phone, type: 'registration' },
        { otp: hashedOtp, expiresAt: new Date(Date.now() + 60000) }
      );

      const res = await request(app)
        .post('/api/auth/verify-registration')
        .send({ phone: newUser.phone, otp: '123456' })
        .expect(httpStatus.OK);

      expect(res.body.tokens).toBeDefined();
      expect(res.body.user.isPhoneVerified).toBe(true);
    });

    test('should return 400 if OTP is incorrect', async () => {
        await request(app).post('/api/auth/register').send(newUser);
        await request(app)
          .post('/api/auth/verify-registration')
          .send({ phone: newUser.phone, otp: '000000' })
          .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('Forgot password', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(newUser);
      const bcrypt = require('bcryptjs');
      const hashedOtp = await bcrypt.hash('123456', 8);
      await OTP.findOneAndUpdate(
        { phone: newUser.phone, type: 'registration' },
        { otp: hashedOtp, expiresAt: new Date(Date.now() + 60000) }
      );
      await request(app)
        .post('/api/auth/verify-registration')
        .send({ phone: newUser.phone, otp: '123456' });
    });

    test('should send forgot password OTP for existing phone', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password/send-otp')
        .send({ phone: newUser.phone })
        .expect(httpStatus.OK);

      expect(res.body.message).toMatch(/OTP has been sent/i);
      const otp = await OTP.findOne({ phone: newUser.phone, type: 'password_reset' });
      expect(otp).toBeDefined();
    });

    test('should return same message for unknown phone (no enumeration)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ phone: '+19999999999' })
        .expect(httpStatus.OK);

      expect(res.body.message).toMatch(/OTP has been sent/i);
      const otp = await OTP.findOne({ phone: '+19999999999', type: 'password_reset' });
      expect(otp).toBeNull();
    });

    test('should reset password with valid OTP and allow login', async () => {
      await request(app)
        .post('/api/auth/forgot-password/send-otp')
        .send({ phone: newUser.phone });

      const bcrypt = require('bcryptjs');
      const hashedOtp = await bcrypt.hash('654321', 8);
      await OTP.findOneAndUpdate(
        { phone: newUser.phone, type: 'password_reset' },
        { otp: hashedOtp, expiresAt: new Date(Date.now() + 60000) }
      );

      const res = await request(app)
        .post('/api/auth/forgot-password/reset')
        .send({ phone: newUser.phone, otp: '654321', newPassword: 'newpassword99' })
        .expect(httpStatus.OK);

      expect(res.body.message).toBe('Password reset successfully');
      expect(res.body.tokens).toBeDefined();

      await request(app)
        .post('/api/auth/login')
        .send({ email: newUser.email, password: 'newpassword99' })
        .expect(httpStatus.OK);

      await request(app)
        .post('/api/auth/login')
        .send({ email: newUser.email, password: 'password123' })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should reject reset with invalid OTP', async () => {
      await request(app)
        .post('/api/auth/forgot-password/send-otp')
        .send({ phone: newUser.phone });

      await request(app)
        .post('/api/auth/reset-password')
        .send({ phone: newUser.phone, otp: '000000', newPassword: 'newpassword99' })
        .expect(httpStatus.BAD_REQUEST);
    });
  });
});
