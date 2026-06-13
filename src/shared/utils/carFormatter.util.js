const { buildViewerUrls } = require('../services/viewer360.service');

const formatCarListItem = (car) => ({
  id: car._id,
  name: car.name,
  subtitle: car.subtitle || car.brand,
  type: car.type,
  category: car.category || car.type,
  status: car.status,
  rating: car.rating,
  reviews: car.reviewCount,
  reviewCount: car.reviewCount,
  image: car.images?.[0] || '',
  images: car.images,
  price: car.pricePerDay,
  pricePerDay: car.pricePerDay,
  specs: {
    transmission: car.specs?.transmission || car.transmission,
    fuel: car.specs?.fuel || car.fuelType,
    seats: car.specs?.seats || car.seatingCapacity,
    topSpeed: car.specs?.topSpeed || '',
    acceleration: car.specs?.acceleration || '',
    fuelLeft: car.specs?.fuelLeft || '',
    drivenKm: car.specs?.drivenKm || 0,
  },
  location: car.locationLabel || '',
  features: car.features,
  description: car.description,
  plateNumber: car.plateNumber,
  ...buildViewerUrls(car),
  aiTip: car.aiTip,
  aiPrediction: car.aiPrediction,
  brand: car.brand,
  bodyType: car.bodyType,
  isAvailable: car.isAvailable,
});

const formatCarDetail = (car) => ({
  ...formatCarListItem(car),
  spinImages: car.spinImages || [],
});

const formatBookingForUser = (booking) => ({
  id: booking._id,
  bookingId: booking.bookingId,
  status: mapUserBookingStatus(booking.status),
  bookingDate: { start: booking.startDate, end: booking.endDate },
  pickupLocation: booking.pickupLocation,
  dropoffLocation: booking.dropoffLocation,
  car: booking.car ? formatCarDetail(booking.car) : null,
  financials: booking.financials || { total: booking.totalPrice },
  paymentStatus: booking.paymentStatus,
});

const mapUserBookingStatus = (status) => {
  const map = {
    pending: 'Pending',
    approved: 'Pending',
    confirmed: 'Current',
    current: 'Current',
    completed: 'Completed',
    cancelled: 'Cancelled',
    declined: 'Cancelled',
  };
  return map[status] || status;
};

const mapAdminBookingStatus = (status) => {
  const map = {
    pending: 'Pending',
    approved: 'Approved',
    confirmed: 'Approved',
    current: 'Approved',
    completed: 'Completed',
    cancelled: 'Declined',
    declined: 'Declined',
  };
  return map[status] || status;
};

module.exports = {
  formatCarListItem,
  formatCarDetail,
  formatBookingForUser,
  mapUserBookingStatus,
  mapAdminBookingStatus,
};
