const express = require("express");
const { admin, protect } = require("../middlewares/authMiddleware");
const {
  createService,
  deleteService,
  getServices,
  updateService,
} = require("../controllers/serviceController");

const router = express.Router();

//get all the services
router.get("/", getServices);

//admin actions
router.post("/", protect, admin, createService);
router.put("/:id", protect, admin, updateService);
router.delete("/:id", protect, admin, deleteService);

module.exports = router;
