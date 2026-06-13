const catchAsync = require('../../utils/catchAsync');
const peopleService = require('./people.service');

const getClients = catchAsync(async (req, res) => {
  const clients = await peopleService.getClients();
  res.send({ results: clients.length, data: clients });
});

const getClient = catchAsync(async (req, res) => {
  const client = await peopleService.getClientById(req.params.id);
  res.send(client);
});

const getStaff = catchAsync(async (req, res) => {
  const staff = await peopleService.getStaff();
  res.send({ results: staff.length, data: staff });
});

const getStaffMember = catchAsync(async (req, res) => {
  const staff = await peopleService.getStaffById(req.params.id);
  res.send(staff);
});

const registerPayout = catchAsync(async (req, res) => {
  const staffId = req.params.id || req.body.staffId;
  const staff = await peopleService.registerStaffPayout(staffId, req.body);
  res.send(staff);
});

module.exports = { getClients, getClient, getStaff, getStaffMember, registerPayout };
