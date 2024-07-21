import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

// CORS options
const corsOptions = {
  origin: 'http://localhost:4200',
  optionsSuccessStatus: 200,
};

// Middleware
app.use(bodyParser.json());
app.use(cors(corsOptions));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/pawpal-network', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Models

// Models
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: false },
  imageUrl: { type: String }, // URL of the image
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);
const Post = mongoose.model('Post', PostSchema);

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Routes
app.post('/register', async (req, res) => {
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
      res.status(400).send('Username or email already exists');
    } else {
      res.status(500).send('Error registering user');
    }
  }
});

app.post('/login', async (req, res) => {
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

app.post('/posts', authenticateToken, upload.single('image'), async (req, res) => {
  const { description } = req.body;
  const image = req.file ? req.file.filename : null;
  const newPost = new Post({
    userId: req.user.id,
    description,
    image,
  });

  try {
    await newPost.save();
    res.status(201).send({ message: 'Post created' });
  } catch (err) {
    res.status(500).send('Error creating post');
  }
});

app.get('/posts', authenticateToken, async (req, res) => {
  try {
    const posts = await Post.find({}).populate('userId', 'username');
    res.json(posts);
  } catch (err) {
    res.status(500).send('Error fetching posts');
  }
});

app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).send('Error fetching profile');
  }
});


// הוספת חבר
app.post('/friends/add', authenticateToken, async (req, res) => {
  const { friendId } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user.friends.includes(friendId)) {
      user.friends.push(friendId);
      await user.save();
      res.status(200).send({ message: 'Friend added' });
    } else {
      res.status(400).send({ message: 'Friend already added' });
    }
  } catch (err) {
    res.status(500).send('Error adding friend');
  }
});

// הסרת חבר
app.delete('/users/:userId/friends/:friendId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (user) {
      user.friends = user.friends.filter(friendId => friendId.toString() !== req.params.friendId);
      await user.save();
      res.status(200).send('Friend removed');
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    res.status(500).send('Error removing friend');
  }
});

app.get('/posts', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('friends');
    const friendIds = user.friends.map(friend => friend._id);
    const posts = await Post.find({ userId: { $in: [req.user.id, ...friendIds] } }).populate('userId', 'username');
    res.json(posts);
  } catch (err) {
    res.status(500).send('Error fetching posts');
  }
});

app.get('/about', (req, res) => {
  const aboutContent = {
    description: 'We are a group of dedicated software engineering students working on an exciting project to connect pet lovers through a social network. Our members include Roei, Tamir, Aviram, Nir, Elad, Neria, and Idan. Stay tuned for more updates!',
    members: ['Roei', 'Tamir', 'Aviram', 'Nir', 'Elad', 'Neria', 'Idan'],
    project: 'Our project, PawPal Network, is a social network designed to help pet lovers connect, share experiences, and celebrate the joys of pet ownership.',
  };
  res.json(aboutContent);
});

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const token = req.header('Authorization').replace('Bearer ', '');

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

// All other GET requests not handled before will return the Angular app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/paw-pal-network-client/browser', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
