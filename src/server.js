import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: 'http://localhost:4200', // Adjust this to match your Angular app's URL
  optionsSuccessStatus: 200,
};

// Middleware
app.use(bodyParser.json());
app.use(cors(corsOptions));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/pawpal-network')
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error(err);
  });

// Models
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
});

const User = mongoose.model('User', UserSchema);

// Routes
app.post('/api/register', async (req, res) => {
  const { username, firstName, lastName, email, password, dateOfBirth } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    username,
    firstName,
    lastName,
    email,
    password: hashedPassword,
    dateOfBirth,
  });

  try {
    await newUser.save();
    res.status(201).send({ message: 'User registered' });
  } catch (err) {
    if (err.code === 11000) {
      // Handle duplicate key error (username or email already exists)
      res.status(400).send('Username or email already exists');
    } else {
      res.status(500).send('Error registering user');
    }
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user) {
    return res.status(404).send('User not found');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).send('Invalid credentials');
  }

  const token = jwt.sign(
    { id: user._id },
    'secretKey',
    { expiresIn: '1h' },
  );
  res.json({ token });
});

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).send('Error fetching profile');
  }
});

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).send('Access denied');
  }

  try {
    const decoded = jwt.verify(token, 'secretKey');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).send('Invalid token');
  }
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
