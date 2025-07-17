require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const seedAdmin = async () => {
  console.log("Conectando com URI:", process.env.MONGODB_URI);
  await connectDB();

  const exists = await User.findOne({ email: "admin@lavacar.com" });

  if (exists) {
    console.log("Admin já existe.");
    process.exit();
  }

  await User.create({
    email: "admin@lavacar.com",
    password: "suaSenhaForte",
    role: "admin",
  });
  console.log("Admin criado");
  process.exit();
};

seedAdmin();
