const config = require('../../config/env');
const mongoose = require('mongoose');
const connectDB = require('../../config/db');
const User = require('../models/user.model');
const Car = require('../models/car.model');
const Staff = require('../models/staff.model');
const SpecialOffer = require('../models/specialOffer.model');
const Banner = require('../models/banner.model');

const seed = async () => {
  await connectDB();

  const admin = await User.findOneAndUpdate(
    { email: 'admin@hityam.com' },
    {
      name: 'Hityam Admin',
      email: 'admin@hityam.com',
      phone: '+10000000001',
      password: 'admin12345',
      role: 'admin',
      isPhoneVerified: true,
      kycStatus: 'Verified',
    },
    { upsert: true, new: true }
  );

  const user = await User.findOneAndUpdate(
    { email: 'user@hityam.com' },
    {
      name: 'Demo Renter',
      email: 'user@hityam.com',
      phone: '+10000000002',
      password: 'user12345',
      role: 'user',
      isPhoneVerified: true,
      location: { city: 'New York', country: 'USA', label: 'New York, USA' },
    },
    { upsert: true, new: true }
  );

  const demoSpinFrames = Array.from({ length: 24 }, (_, i) => `https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&spin=${i}`);

  const cars = [
    { name: 'Model 3', subtitle: 'Performance', brand: 'Tesla', type: 'Sedan', category: 'Sedan', pricePerDay: 120, isFeatured: true, rating: 4.9, images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800'], spinImages: demoSpinFrames, view360Url: `${config.baseUrl}/viewer360/`, location: { type: 'Point', coordinates: [-73.935242, 40.730610] }, locationLabel: 'Manhattan Hub', features: ['Self Driving', 'Bluetooth', 'GPS'], specs: { topSpeed: '261 km/h', acceleration: '3.1s', seats: 5 }, plateNumber: 'NY-8834', aiTip: 'Best for city commutes with instant torque.' },
    { name: 'X5', subtitle: 'xDrive40i', brand: 'BMW', type: 'SUV', category: 'SUV', pricePerDay: 150, isFeatured: true, rating: 4.8, images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'], location: { type: 'Point', coordinates: [-73.985428, 40.748817] }, locationLabel: 'Midtown Hub', features: ['Panoramic Roof', 'Heated Seats'], specs: { topSpeed: '245 km/h', acceleration: '5.3s', seats: 7 }, plateNumber: 'NY-5521' },
    { name: 'Civic', subtitle: 'Touring', brand: 'Honda', type: 'Sedan', category: 'Sedan', pricePerDay: 65, rating: 4.6, images: ['https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800'], location: { type: 'Point', coordinates: [-74.006, 40.7128] }, locationLabel: 'Downtown Hub', features: ['Apple CarPlay', 'Lane Assist'], specs: { seats: 5 }, plateNumber: 'NY-2290' },
  ];

  for (const car of cars) {
    await Car.findOneAndUpdate({ name: car.name, brand: car.brand }, car, { upsert: true });
  }

  await Staff.findOneAndUpdate(
    { phone: '+10000000010' },
    { name: 'Alex Rivera', role: 'Fleet Manager', phone: '+10000000010', salary: 5500, overview: 'Manages daily fleet operations' },
    { upsert: true }
  );

  await SpecialOffer.deleteMany({});
  await SpecialOffer.insertMany([
    { title: 'Weekend Special', subtitle: '20% off SUVs', gradient: ['#4F46E5', '#7C3AED'], tag: 'HOT', icon: 'car-sport', accentColor: '#7C3AED', sortOrder: 1 },
    { title: 'First Ride Free', subtitle: 'Insurance included', gradient: ['#059669', '#10B981'], tag: 'NEW', icon: 'shield-checkmark', accentColor: '#10B981', sortOrder: 2 },
  ]);

  await Banner.deleteMany({});
  await Banner.create({ title: 'Fully Insured Rentals', subtitle: 'Drive with peace of mind', ctaLabel: 'Learn More', sortOrder: 1 });

  console.log('Seed complete.');
  console.log('Admin:', admin.email, '/ admin12345');
  console.log('User:', user.email, '/ user12345');
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
