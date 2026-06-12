const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Calculate difference in time
  const differenceInTime = end.getTime() - start.getTime();
  
  // Calculate difference in days
  // If the booking is same day, minimum 1 day should be charged
  const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
  
  return differenceInDays > 0 ? differenceInDays : 1;
};

module.exports = {
  calculateDays,
};
