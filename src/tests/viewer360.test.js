const request = require('supertest');
const httpStatus = require('http-status').default;
const app = require('../app');
const setupTestDB = require('./setupTestDB');
const Car = require('../shared/models/car.model');

setupTestDB();

const sampleFrames = Array.from({ length: 24 }, (_, i) => `/uploads/frames/demo_${i}.jpg`);

describe('360 Viewer', () => {
  let carWith360;
  let carWithout360;

  beforeEach(async () => {
    carWith360 = await Car.create({
      name: '360 Test Car',
      brand: 'BMW',
      type: 'SUV',
      pricePerDay: 100,
      spinImages: sampleFrames,
      view360Url: 'http://localhost:5000/viewer360/test',
      location: { type: 'Point', coordinates: [-73.93, 40.73] },
    });

    carWithout360 = await Car.create({
      name: 'No 360 Car',
      brand: 'Honda',
      type: 'Sedan',
      pricePerDay: 50,
      location: { type: 'Point', coordinates: [-73.93, 40.73] },
    });
  });

  test('user API returns spin data when 360 exists', async () => {
    const res = await request(app)
      .get(`/api/user/viewer360/${carWith360._id}`)
      .expect(httpStatus.OK);

    expect(res.body.has360).toBe(true);
    expect(res.body.spinImages).toHaveLength(24);
    expect(res.body.view360Url).toContain('/viewer360/');
  });

  test('legacy API alias works', async () => {
    const res = await request(app)
      .get(`/api/viewer360/${carWith360._id}`)
      .expect(httpStatus.OK);

    expect(res.body.has360).toBe(true);
  });

  test('viewer URL endpoint for WebView', async () => {
    const res = await request(app)
      .get(`/api/user/viewer360/${carWith360._id}/url`)
      .expect(httpStatus.OK);

    expect(res.body.view360Url).toContain('/viewer360/');
    expect(res.body.has360).toBe(true);
  });

  test('car without 360 returns has360 false', async () => {
    const res = await request(app)
      .get(`/api/user/viewer360/${carWithout360._id}`)
      .expect(httpStatus.OK);

    expect(res.body.has360).toBe(false);
    expect(res.body.spinImages).toHaveLength(0);
  });

  test('HTML viewer page loads for car with 360', async () => {
    const res = await request(app)
      .get(`/viewer360/${carWith360._id}`)
      .expect(httpStatus.OK);

    expect(res.text).toContain('spritespin');
    expect(res.text).toContain('360 Test Car');
  });

  test('HTML viewer shows unavailable message when no 360', async () => {
    const res = await request(app)
      .get(`/viewer360/${carWithout360._id}`)
      .expect(httpStatus.NOT_FOUND);

    expect(res.text).toContain('not available');
  });

  test('car detail includes 360 fields', async () => {
    const res = await request(app)
      .get(`/api/cars/${carWith360._id}`)
      .expect(httpStatus.OK);

    expect(res.body.has360).toBe(true);
    expect(res.body.view360Url).toBeTruthy();
    expect(res.body.viewerDataUrl).toContain('/api/user/viewer360/');
  });
});
