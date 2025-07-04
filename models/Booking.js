const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  dateTime: {
    type: Date,
    required: true,
  },
  observation: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
