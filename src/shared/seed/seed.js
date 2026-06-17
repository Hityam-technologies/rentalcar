const config = require('../../config/env');
const mongoose = require('mongoose');
const connectDB = require('../../config/db');
const User = require('../models/user.model');
const Car = require('../models/car.model');
const Staff = require('../models/staff.model');
const SpecialOffer = require('../models/specialOffer.model');
const Banner = require('../models/banner.model');
const Booking = require('../models/booking.model');

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

  const cars = [];

  for (const car of cars) {
    await Car.findOneAndUpdate({ name: car.name, brand: car.brand }, car, { upsert: true });
  }

  const allCars = await Car.find();
  if (allCars.length >= 3) {
    const pastStart = new Date();
    pastStart.setDate(pastStart.getDate() - 10);
    const pastEnd = new Date();
    pastEnd.setDate(pastEnd.getDate() - 5);

    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - 1);
    const currentEnd = new Date();
    currentEnd.setDate(currentEnd.getDate() + 3);

    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 5);
    const futureEnd = new Date();
    futureEnd.setDate(futureEnd.getDate() + 10);

    const cancelledStart = new Date();
    cancelledStart.setDate(cancelledStart.getDate() + 15);
    const cancelledEnd = new Date();
    cancelledEnd.setDate(cancelledEnd.getDate() + 20);

    await Booking.deleteMany({});
    
    // Create multiple detailed bookings
    const bookingsToCreate = [
      {
        user: user._id,
        car: allCars[0]._id,
        host: admin._id,
        startDate: pastStart,
        endDate: pastEnd,
        pickupLocation: allCars[0].locationLabel || 'City Center Hub',
        dropoffLocation: allCars[0].locationLabel || 'City Center Hub',
        totalPrice: (allCars[0].pricePerDay * 5) + 2000 + 1000,
        financials: {
          baseRate: allCars[0].pricePerDay * 5,
          insurance: 2000,
          tax: 1000,
          deposit: 5000,
          total: (allCars[0].pricePerDay * 5) + 2000 + 1000
        },
        status: 'completed',
        paymentStatus: 'paid'
      },
      {
        user: user._id,
        car: allCars[1]._id,
        host: admin._id,
        startDate: currentStart,
        endDate: currentEnd,
        pickupLocation: allCars[1].locationLabel || 'Airport Hub',
        dropoffLocation: allCars[1].locationLabel || 'Airport Hub',
        totalPrice: (allCars[1].pricePerDay * 4) + 1500 + 800,
        financials: {
          baseRate: allCars[1].pricePerDay * 4,
          insurance: 1500,
          tax: 800,
          deposit: 5000,
          total: (allCars[1].pricePerDay * 4) + 1500 + 800
        },
        status: 'current',
        paymentStatus: 'paid'
      },
      {
        user: user._id,
        car: allCars[2]._id,
        host: admin._id,
        startDate: futureStart,
        endDate: futureEnd,
        pickupLocation: allCars[2].locationLabel || 'Downtown Hub',
        dropoffLocation: allCars[2].locationLabel || 'Downtown Hub',
        totalPrice: (allCars[2].pricePerDay * 5) + 2200 + 1100,
        financials: {
          baseRate: allCars[2].pricePerDay * 5,
          insurance: 2200,
          tax: 1100,
          deposit: 5000,
          total: (allCars[2].pricePerDay * 5) + 2200 + 1100
        },
        status: 'confirmed',
        paymentStatus: 'paid'
      },
      {
        user: user._id,
        car: allCars[0]._id, // same car, different dates
        host: admin._id,
        startDate: cancelledStart,
        endDate: cancelledEnd,
        pickupLocation: allCars[0].locationLabel || 'City Center Hub',
        dropoffLocation: 'Airport Hub', // different dropoff
        totalPrice: (allCars[0].pricePerDay * 5) + 2000 + 1000,
        financials: {
          baseRate: allCars[0].pricePerDay * 5,
          insurance: 2000,
          tax: 1000,
          deposit: 5000,
          total: (allCars[0].pricePerDay * 5) + 2000 + 1000
        },
        status: 'cancelled',
        paymentStatus: 'refunded'
      }
    ];

    await Booking.create(bookingsToCreate);
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
