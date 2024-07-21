import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  username: { type: String, required: false },
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  email: { type: String, required: false },
  password: { type: String, required: false },
  dateOfBirth: { type: Date, required: false }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;