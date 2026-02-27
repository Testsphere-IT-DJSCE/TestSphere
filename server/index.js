const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const connectDb = require('./db/connection');

const subjectRoutes = require('./Routes/subject.routes');
const attendanceRoutes = require('./Routes/attendance.routes');
const teacherRoutes = require('./Routes/teacher.routes');
const hodRoutes = require('./Routes/hod.routes');
const adminRoutes = require('./Routes/admin.routes');
const studentRoutes = require('./Routes/student.routes');
const timetableRoutes = require('./Routes/timetable.routes');
const uploadRoutes = require('./Routes/upload.routes');
const subjectUploadRoutes = require('./Routes/subjectUpload.routes');
const deleteRoutes = require('./Routes/delete.routes');

const app = express();

app.use(cors({
  origin: [
    'https://fsdfrontend-tau.vercel.app',
    'http://localhost:5173',
    'https://test-sphere-frontend.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ DB connection middleware — BEFORE all routes
app.use(async (req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (err) {
    console.error("DB connection failed:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Routes
app.use('/api', subjectRoutes);
app.use('/api', attendanceRoutes);
app.use('/teachers', teacherRoutes);
app.use('/hod', hodRoutes);
app.use('/admin', adminRoutes);
app.use('/students', studentRoutes);
app.use('/api', timetableRoutes);
app.use('/upload', uploadRoutes);
app.use('/api', subjectUploadRoutes);
app.use('/delete', deleteRoutes);

app.get('/', (req, res) => {
  res.send('API is running');
});

app.get('/debug', (req, res) => {
  res.json({ 
    mongoUri: process.env.MONGO_URI ? "loaded" : "missing",
    port: process.env.PORT 
  });
});

module.exports = app;