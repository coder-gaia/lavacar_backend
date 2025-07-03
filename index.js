const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const bookingRoutes = require("./routes/booking");
const serviceRoutes = require("./routes/service");
const authRoutes = require("./routes/auth");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//conecting to the database
connectDB();

app.use("/api/booking", bookingRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API is running..");
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
