const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}
console.log('Successfully loaded .env file.');
console.log(`MONGO_URI is: ${process.env.MONGO_URI ? 'SET' : 'NOT SET'}`);

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = require('./socket').init(server);
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Import routes
const authRoutes = require('./routes/auth.routes');
const departmentRoutes = require('./routes/department.routes');
const doctorRoutes = require('./routes/doctor.routes');
const patientRoutes = require('./routes/patient.routes');
const wardRoutes = require('./routes/ward.routes');
const bedRoutes = require('./routes/bed.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const drugRoutes = require('./routes/drug.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const billRoutes = require('./routes/bill.routes');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/wards', wardRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/drugs', drugRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/bills', billRoutes);

// All other GET requests not handled before will return the frontend application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Database connection
const PORT = process.env.PORT || 5003;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log('MongoDB connected');
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });
