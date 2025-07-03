const Booking = require("../models/Booking");
const Service = require("../models/Service");

exports.createBooking = async (req, res) => {
  const { clientName, serviceId, dateTime, observation } = req.body;
  try {
    //veryfing if the service actually exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    const booking = await Booking.create({
      clientName,
      service: serviceId,
      dateTime,
      observation,
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTodayBookings = async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const bookings = await Booking.find({
    dateTime: { $gte: start, $lte: end },
    status: "pending",
  })
    .sort({ datetime: 1 })
    .populate("service", "name price duration");

  res.json(bookings);
};

exports.getAllBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.all !== "true") {
      filter.status = "pending";
    }

    const bookings = await Booking.find(filter)
      .sort({ dateTime: 1 })
      .populate("service", "name price duration");

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }
    booking.status = "completed";
    await booking.save();
    res.json({ message: "Booking marked as completed.", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
