require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./src/shared/models/car.model');
const config = require('./src/config/env');

const carsToSeed = [
  {
    "name": "Tata Nexon",
    "subtitle": "Compact SUV",
    "brand": "Tata",
    "type": "SUV",
    "category": "SUV",
    "pricePerDay": 2200,
    "rating": 4.8,
    "images": [
      "http://127.0.0.1:5000/uploads/images/tata_nexon_front.png",
      "http://127.0.0.1:5000/uploads/images/tata_nexon_side.png",
      "http://127.0.0.1:5000/uploads/images/tata_nexon_rear.png"
    ],
    "locationLabel": "Hitec City, Hyderabad",
    "fuelType": "Petrol",
    "transmission": "Manual",
    "seatingCapacity": 5,
    "specs": {
      "transmission": "Manual",
      "fuel": "Petrol",
      "seats": 5,
      "topSpeed": "180 km/h",
      "acceleration": "11.6s"
    },
    "features": ["Air Condition", "Bluetooth", "Touchscreen Display", "Backup Camera", "USB Charger"],
    "description": "The Tata Nexon offers a perfect blend of style, comfort, and safety. Rated 5-stars for safety, it's an excellent choice for both city driving and weekend getaways around Hyderabad.",
    "isFeatured": true,
    "status": "Available",
    "isAvailable": true
  },
  {
    "name": "Maruti Suzuki Swift",
    "subtitle": "Popular Hatchback",
    "brand": "Maruti",
    "type": "Economy",
    "category": "Economy",
    "pricePerDay": 1500,
    "rating": 4.7,
    "images": [
      "http://127.0.0.1:5000/uploads/images/maruti_swift_front.png",
      "http://127.0.0.1:5000/uploads/images/maruti_swift_side.png",
      "http://127.0.0.1:5000/uploads/images/maruti_swift_rear.png"
    ],
    "locationLabel": "Banjara Hills, Hyderabad",
    "fuelType": "Petrol",
    "transmission": "Manual",
    "seatingCapacity": 5,
    "specs": {
      "transmission": "Manual",
      "fuel": "Petrol",
      "seats": 5,
      "topSpeed": "165 km/h",
      "acceleration": "11.5s"
    },
    "features": ["Air Condition", "Bluetooth", "Compact Size", "Keyless Entry"],
    "description": "The Maruti Swift is the king of Indian roads. Perfect for weaving through Hyderabad traffic, it offers exceptional mileage and easy parking.",
    "isFeatured": false,
    "status": "Available",
    "isAvailable": true
  },
  {
    "name": "Hyundai i20",
    "subtitle": "Premium Hatchback",
    "brand": "Hyundai",
    "type": "Economy",
    "category": "Economy",
    "pricePerDay": 1800,
    "rating": 4.9,
    "images": [
      "http://127.0.0.1:5000/uploads/images/hyundai_i20_front.png",
      "http://127.0.0.1:5000/uploads/images/hyundai_i20_side.png",
      "http://127.0.0.1:5000/uploads/images/hyundai_i20_rear.png"
    ],
    "locationLabel": "Madhapur, Hyderabad",
    "fuelType": "Petrol",
    "transmission": "Automatic",
    "seatingCapacity": 5,
    "specs": {
      "transmission": "Automatic",
      "fuel": "Petrol",
      "seats": 5,
      "topSpeed": "170 km/h",
      "acceleration": "10.8s"
    },
    "features": ["Air Condition", "Bluetooth", "Sunroof", "Touchscreen Display", "Apple CarPlay"],
    "description": "Experience premium comfort with the Hyundai i20. Smooth automatic transmission and modern tech features make it the ideal car for navigating the IT corridors of Madhapur and Gachibowli.",
    "isFeatured": true,
    "status": "Available",
    "isAvailable": true
  },
  {
    "name": "Mahindra Thar",
    "subtitle": "Off-Road Legend",
    "brand": "Mahindra",
    "type": "SUV",
    "category": "SUV",
    "pricePerDay": 3500,
    "rating": 4.8,
    "images": [
      "http://127.0.0.1:5000/uploads/images/mahindra_thar_front.png",
      "http://127.0.0.1:5000/uploads/images/mahindra_thar_side.png",
      "http://127.0.0.1:5000/uploads/images/mahindra_thar_rear.png"
    ],
    "locationLabel": "Gachibowli, Hyderabad",
    "fuelType": "Diesel",
    "transmission": "Manual",
    "seatingCapacity": 4,
    "specs": {
      "transmission": "Manual",
      "fuel": "Diesel",
      "seats": 4,
      "topSpeed": "155 km/h",
      "acceleration": "14.2s"
    },
    "features": ["Air Condition", "Bluetooth", "4x4 Drive", "Rugged Build", "High Ground Clearance"],
    "description": "Turn heads in Hyderabad with the iconic Mahindra Thar. Whether you're cruising on the ORR or planning a rugged road trip out of the city, the Thar delivers unmatched presence and capability.",
    "isFeatured": true,
    "status": "Available",
    "isAvailable": true
  },
  {
    "name": "Kia Seltos",
    "subtitle": "Dynamic SUV",
    "brand": "Kia",
    "type": "SUV",
    "category": "SUV",
    "pricePerDay": 2800,
    "rating": 4.8,
    "images": [
      "http://127.0.0.1:5000/uploads/images/kia_seltos_front.png",
      "http://127.0.0.1:5000/uploads/images/kia_seltos_side.png",
      "http://127.0.0.1:5000/uploads/images/kia_seltos_rear.png"
    ],
    "locationLabel": "Secunderabad",
    "fuelType": "Diesel",
    "transmission": "Automatic",
    "seatingCapacity": 5,
    "specs": {
      "transmission": "Automatic",
      "fuel": "Diesel",
      "seats": 5,
      "topSpeed": "190 km/h",
      "acceleration": "9.7s"
    },
    "features": ["Air Condition", "Bluetooth", "Sunroof", "Ventilated Seats", "Bose Audio System"],
    "description": "The Kia Seltos is a feature-packed SUV offering a luxurious ride. With its punchy diesel automatic powertrain and ventilated seats, you can beat the Hyderabad heat in ultimate comfort.",
    "isFeatured": false,
    "status": "Available",
    "isAvailable": true
  },
  {
    "name": "Toyota Innova Crysta",
    "subtitle": "Premium MPV",
    "brand": "Toyota",
    "type": "SUV",
    "category": "SUV",
    "pricePerDay": 3800,
    "rating": 4.9,
    "images": [
      "http://127.0.0.1:5000/uploads/images/innova_crysta_front.png",
      "http://127.0.0.1:5000/uploads/images/innova_crysta_side.png",
      "http://127.0.0.1:5000/uploads/images/innova_crysta_rear.png"
    ],
    "locationLabel": "Shamshabad, Hyderabad",
    "fuelType": "Diesel",
    "transmission": "Manual",
    "seatingCapacity": 7,
    "specs": {
      "transmission": "Manual",
      "fuel": "Diesel",
      "seats": 7,
      "topSpeed": "175 km/h",
      "acceleration": "12.5s"
    },
    "features": ["Air Condition", "Bluetooth", "Captain Seats", "Rear AC Vents", "Large Trunk"],
    "description": "The ultimate family mover. The Toyota Innova Crysta offers uncompromised space and reliability. Ideal for airport pickups from Shamshabad or outstation trips with the whole family.",
    "isFeatured": true,
    "status": "Available",
    "isAvailable": true
  },
  {
    "name": "Honda City",
    "subtitle": "Executive Sedan",
    "brand": "Honda",
    "type": "Sedan",
    "category": "Sedan",
    "pricePerDay": 2500,
    "rating": 4.8,
    "images": [
      "http://127.0.0.1:5000/uploads/images/honda_city_front.png",
      "http://127.0.0.1:5000/uploads/images/honda_city_side.png",
      "http://127.0.0.1:5000/uploads/images/honda_city_rear.png"
    ],
    "locationLabel": "Jubilee Hills, Hyderabad",
    "fuelType": "Petrol",
    "transmission": "Automatic",
    "seatingCapacity": 5,
    "specs": {
      "transmission": "Automatic",
      "fuel": "Petrol",
      "seats": 5,
      "topSpeed": "190 km/h",
      "acceleration": "10.2s"
    },
    "features": ["Air Condition", "Bluetooth", "Sunroof", "Lane Watch Camera", "Spacious Cabin"],
    "description": "Travel in executive style with the Honda City. The smooth CVT automatic transmission and plush interiors make it a favorite for business travelers moving around Jubilee Hills and the city.",
    "isFeatured": false,
    "status": "Available",
    "isAvailable": true
  }
];

const seedDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');
    
    console.log('Clearing old cars...');
    await Car.deleteMany({});
    
    console.log(`Seeding ${carsToSeed.length} cars...`);
    await Car.insertMany(carsToSeed);
    console.log('Success! Cars added to the database.');
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding DB:', err);
    process.exit(1);
  }
};

seedDB();
