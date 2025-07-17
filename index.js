const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const bookingRoutes = require("./routes/booking");
const serviceRoutes = require("./routes/service");
const authRoutes = require("./routes/auth");
const WorkingHours = require("./models/WorkingHours");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const allowedOrigins = [
  "http://localhost:5173",
  "https://lavacar-fast-c88becugm-codergaias-projects.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

async function ensureDefaultWorkingHours() {
  const count = await WorkingHours.countDocuments({ type: "weekly" });
  if (count === 0) {
    const weeklyDefaults = [
      { type: "weekly", day: "0", startHour: 0, endHour: 0 },
      { type: "weekly", day: "1", startHour: 9, endHour: 18 },
      { type: "weekly", day: "2", startHour: 9, endHour: 18 },
      { type: "weekly", day: "3", startHour: 9, endHour: 18 },
      { type: "weekly", day: "4", startHour: 9, endHour: 18 },
      { type: "weekly", day: "5", startHour: 9, endHour: 18 },
      { type: "weekly", day: "6", startHour: 9, endHour: 15 },
    ];
    await WorkingHours.insertMany(weeklyDefaults);
    console.log("✅ Horários semanais padrão criados.");
  }
}

async function startServer() {
  try {
    await connectDB();

    await ensureDefaultWorkingHours();

    app.use("/api/booking", bookingRoutes);
    app.use("/api/services", serviceRoutes);
    app.use("/api/auth", authRoutes);

    app.get("/", (req, res) => {
      res.send("API is running..");
    });

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Falha ao iniciar o servidor:", err);
    process.exit(1);
  }
}

startServer();
