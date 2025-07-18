const Booking = require("../models/Booking");
const Service = require("../models/Service");
const WorkingHours = require("../models/WorkingHours");
const CustomSlot = require("../models/CustomSlot");

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

exports.createBooking = async (req, res) => {
  const { clientName, serviceId, dateTime, observation } = req.body;
  try {
    const service = await Service.findById(serviceId);
    if (!service)
      return res.status(404).json({ message: "Service not found." });

    const desiredStart = new Date(dateTime);
    const desiredEnd = new Date(
      desiredStart.getTime() + service.duration * 60000
    );

    const dayStart = new Date(desiredStart);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(desiredStart);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await Booking.find({
      status: "pending",
      dateTime: { $gte: dayStart, $lte: dayEnd },
    }).populate("service", "duration");

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
    .sort({ dateTime: 1 })
    .populate("service", "name price duration");

  res.json(bookings);
};

exports.getAllBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.all !== "true") filter.status = "pending";

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
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    booking.status = "completed";
    await booking.save();
    res.json({ message: "Booking marked as completed.", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAvailableSlots = async (req, res) => {
  const { date, serviceId } = req.query;
  if (!date || !serviceId) {
    return res.status(400).json({ message: "Missing date or serviceId." });
  }

  const [year, month, day] = date.split("-").map(Number);

  const dayKey = `${String(year).padStart(4, "0")}-${String(month).padStart(
    2,
    "0"
  )}-${String(day).padStart(2, "0")}`;
  const weekday = new Date(year, month - 1, day).getDay().toString();

  // Busca CustomSlot (exceções de horário com lista de slots exatos)
  const custom = await CustomSlot.findOne({ date: dayKey });
  if (custom) {
    const slots = custom.slots.map((slot) => {
      const [h, m] = slot.split(":").map(Number);
      // cria no timezone local do servidor
      const slotDate = new Date(year, month - 1, day, h, m, 0, 0);
      return slotDate.toISOString();
    });
    return res.json(slots);
  }

  // Busca serviço
  const service = await Service.findById(serviceId);
  if (!service) {
    return res.status(404).json({ message: "Service not found." });
  }
  const desiredDuration = service.duration; // em minutos

  //  Busca exceção em WorkingHours ou padrão semanal
  let hours = await WorkingHours.findOne({ type: "exception", day: dayKey });
  if (!hours) {
    hours = await WorkingHours.findOne({ type: "weekly", day: weekday });
  }
  // se dia fechado ou inválido, retorna vazio
  if (!hours || hours.startHour >= hours.endHour) {
    return res.json([]);
  }

  // Define início e fim do expediente no timezone local
  const startMs = new Date(
    year,
    month - 1,
    day,
    hours.startHour,
    0,
    0,
    0
  ).getTime();
  const endMs = new Date(
    year,
    month - 1,
    day,
    hours.endHour,
    0,
    0,
    0
  ).getTime();

  //  Busca bookings existentes no intervalo
  const bookings = await Booking.find({
    dateTime: {
      $gte: new Date(startMs),
      $lte: new Date(endMs),
    },
    status: "pending",
  }).populate("service", "duration");

  // Mapeia intervalos ocupados
  const occupied = bookings.map((b) => {
    const bStart = b.dateTime.getTime();
    const bEnd = bStart + b.service.duration * 60000;
    return { start: bStart, end: bEnd };
  });

  // Gera slots livres
  const slots = [];
  let pointer = startMs;
  while (pointer + desiredDuration * 60000 <= endMs) {
    const slotStart = pointer;
    const slotEnd = slotStart + desiredDuration * 60000;

    const free = occupied.every(
      (o) => slotStart >= o.end || slotEnd <= o.start
    );
    if (free) {
      const dt = new Date(slotStart);
      slots.push(dt.toISOString());
    }
    pointer += desiredDuration * 60000;
  }

  return res.json(slots);
};
