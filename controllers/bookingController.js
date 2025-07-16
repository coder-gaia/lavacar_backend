const Booking = require("../models/Booking");
const Service = require("../models/Service");

exports.createBooking = async (req, res) => {
  const { clientName, serviceId, dateTime, observation } = req.body;
  try {
    //checks if the service exists and takes the duration
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }
    const desiredStart = new Date(dateTime);
    const desiredEnd = new Date(
      desiredStart.getTime() + service.duration * 60000
    );

    //search for all the pending bookings of the day
    const dayStart = new Date(desiredStart);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(desiredStart);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await Booking.find({
      status: "pending",
      dateTime: { $gte: dayStart, $lte: dayEnd },
    }).populate("service", "duration");

    //checks overlaps
    const overlaps = (aStart, aEnd, bStart, bEnd) =>
      aStart < bEnd && bStart < aEnd;

    const conflict = existing.find((b) => {
      const bStart = b.dateTime.getTime();
      const bEnd = bStart + b.service.duration * 60000;
      return overlaps(
        desiredStart.getTime(),
        desiredEnd.getTime(),
        bStart,
        bEnd
      );
    });

    if (conflict) {
      return res.status(409).json({
        message: "Unavailable schedule. Conflicts with another.",
        conflictingBooking: conflict,
      });
    }

    // if there's no conflict, it books normally
    const booking = await Booking.create({
      clientName,
      service: serviceId,
      dateTime: desiredStart,
      observation,
    });

    return res.status(201).json(booking);
  } catch (error) {
    return res.status(500).json({ message: error.message });
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

//receives date as (YYYY-MM-DD) and serviceID as query params
exports.getAvailableSlots = async (req, res) => {
  const { date, serviceId } = req.query;
  if (!date || !serviceId) {
    return res.status(400).json({ message: "Missing date or serviceId." });
  }

  // search for the duration of the desired service
  const service = await Service.findById(serviceId);
  if (!service) {
    return res.status(404).json({ message: "Service not found." });
  }
  const desiredDuration = service.duration; // em minutos

  //defines the start/end of the da
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);

  //search for today's booking e populate duration
  const bookings = await Booking.find({
    dateTime: { $gte: dayStart, $lte: dayEnd },
  }).populate("service", "duration");

  //mounts the occupied intervals list
  const occupied = bookings.map((b) => {
    const start = b.dateTime.getTime();
    const end = start + b.service.duration * 60000;
    return { start, end };
  });

  //checking overlaping
  const overlaps = (aStart, aEnd, bStart, bEnd) =>
    aStart < bEnd && bStart < aEnd;

  //generates available slots in the working hours
  const slots = [];
  let cursor = new Date(`${date}T08:00:00`);
  const closing = new Date(`${date}T19:00:00`);

  while (cursor.getTime() + desiredDuration * 60000 <= closing.getTime()) {
    const slotStart = cursor.getTime();
    const slotEnd = slotStart + desiredDuration * 60000;

    const isFree = occupied.every(
      ({ start, end }) => !overlaps(slotStart, slotEnd, start, end)
    );
    if (isFree) {
      slots.push(new Date(slotStart).toISOString());
    }
    cursor = new Date(slotStart + desiredDuration * 60000);
  }

  return res.json(slots);
};
