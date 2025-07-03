const express = require("express");
const { protect, admin } = require("../middlewares/authMiddleware");
const {
  completeBooking,
  createBooking,
  getTodayBookings,
  getAllBookings,
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/", createBooking);
router.get("/", protect, admin, getAllBookings);
router.get("/today", protect, admin, getTodayBookings);
router.patch("/:id/complete", protect, admin, completeBooking);

module.exports = router;
