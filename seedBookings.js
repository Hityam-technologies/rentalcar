require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./src/shared/models/booking.model');
const Car = require('./src/shared/models/car.model');
const User = require('./src/shared/models/user.model');

const seedBookings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Get a user
    let user = await User.findOne({ role: 'user' });
    if (!user) {
      user = await User.findOne(); // fallback to any user
    }
    if (!user) {
      console.error('No users found in database to attach bookings to. Please register a user first.');
      process.exit(1);
    }
    console.log('Found user:', user.email);

    // Get cars
    const cars = await Car.find().limit(4);
    if (cars.length === 0) {
      console.log('No cars found. Cannot create bookings.');
      process.exit(1);
    }

    // Wipe existing bookings
    await Booking.deleteMany({});

    const bookingsToInsert = [];
    const statuses = ['current', 'pending', 'completed', 'cancelled'];
    const now = new Date();

    for (let i = 0; i < Math.min(cars.length, statuses.length); i++) {
      const car = cars[i];
      const status = statuses[i];

      let startDate, endDate;
      if (status === 'current') {
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
        endDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
      } else if (status === 'pending') {
        startDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
        endDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
      } else if (status === 'completed') {
        startDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
        endDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      } else if (status === 'cancelled') {
        startDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
        endDate = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days from now
      }

      const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const baseRate = car.pricePerDay * durationDays;
      const insurance = Math.round(baseRate * 0.1);
      const tax = Math.round((baseRate + insurance) * 0.08);
      const deposit = 500;
      const total = baseRate + insurance + tax;

      bookingsToInsert.push({
        user: user._id,
        car: car._id,
        startDate,
        endDate,
        pickupLocation: car.locationLabel || 'Hyderabad',
        dropoffLocation: car.locationLabel || 'Hyderabad',
        totalPrice: total,
        financials: {
          baseRate,
          insurance,
          tax,
          deposit,
          total
        },
        status,
        paymentStatus: status === 'completed' || status === 'current' ? 'paid' : 'pending',
      });
    }

    // Insert
    for (const b of bookingsToInsert) {
      const doc = new Booking(b);
      await doc.save(); // using .save() to trigger pre-save hook for bookingId
    }

    console.log(`Successfully seeded ${bookingsToInsert.length} bookings for user ${user.email}`);
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedBookings();
