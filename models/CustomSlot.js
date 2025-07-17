const mongoose = require("mongoose");

const customSlotSchema = new mongoose.Schema({
  date: { type: String, required: true },
  slots: { type: [String], required: true },
});

module.exports = mongoose.model("CustomSlot", customSlotSchema);
