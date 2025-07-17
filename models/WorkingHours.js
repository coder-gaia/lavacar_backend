const mongoose = require("mongoose");

const WorkingHoursSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["weekly", "exception"],
    required: true,
  },
  day: { type: String, required: true },
  startHour: { type: Number, required: true },
  endHour: { type: Number, required: true },
});

module.exports = mongoose.model("WorkingHours", WorkingHoursSchema);
