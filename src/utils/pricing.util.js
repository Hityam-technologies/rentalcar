const dateUtil = require('./date.util');

const calculateTotalRentalPrice = (pricePerDay, startDate, endDate) => {
  const days = dateUtil.calculateDays(startDate, endDate);
  return days * pricePerDay;
};

module.exports = {
  calculateTotalRentalPrice,
};
