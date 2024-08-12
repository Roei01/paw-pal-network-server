import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import nodemailer from 'nodemailer';
import fs from 'fs';
import util from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;


// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// CORS options
const corsOptions = {
  origin: 'https://paw-pal-network-client.onrender.com',
  optionsSuccessStatus: 200,
};

// Configure your email service
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'royinagar2@gmail.com',
    pass: 'pryk uqde apyp kuwl'
  }
});

// Middleware
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use('/uploads', express.static('uploads'));
const mailIconPath = path.join(__dirname, '..', 'image', 'mail.png');



// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb+srv://roeinagar011:tjiBqVnrYAc8n0jY@pawpal-network.zo5jd6n.mongodb.net/?retryWrites=true&w=majority&appName=pawpal-network';
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    initializeInterests(); // הוספת הפונקציה כאן לאחר החיבור
  })
  .catch(err => console.error('Error connecting to MongoDB Atlas:', err));



// Models
const InterestSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  connectedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]  // Array of connected posts
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }], // הוסף שדה זה
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }], // עדכון הסכמה לשמור מזהי פוסטים
  pet: { type: String },
  followingInterests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Interest' }]  // Array of interests the user follows
});

const PostSchema = new mongoose.Schema({
  description: { type: String, required: true },
  image: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  shares: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  interests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Interest' }] 
});

const Schema = mongoose.Schema;

const SavePostSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }] // הוסף שדה זה
});


// Function to populate interests if not already present
async function initializeInterests() {
  try {
    const existingInterests = await Interest.find({}, 'name');
    const existingInterestNames = existingInterests.map(interest => interest.name);

    const newInterests = interestsData.filter(interest => !existingInterestNames.includes(interest.name));

    if (newInterests.length > 0) {
      await Interest.insertMany(newInterests, { ordered: false }); // ordered: false allows continuing on error
      console.log('Interests have been successfully initialized.');
    } else {
      console.log('No new interests to add. All interests are already initialized.');
    }
  } catch (err) {
    if (err.code === 11000) {
      console.warn('Duplicate key error detected. Some interests may have already been added:', err.message);
    } else {
      console.error('Error initializing interests:', err);
    }
  }
}

const interestsData = [
  { category: 'Dogs', name: 'Dogs Training tips and techniques' },
  { category: 'Dogs', name: 'Dogs Nutrition and diet advice' },
  { category: 'Dogs', name: 'Dogs Breed-specific care guides' },
  { category: 'Dogs', name: 'Dogs Exercise and activity suggestions' },
  { category: 'Dogs', name: 'Dogs Health and wellness information' },
  { category: 'Cats', name: 'Cats Litter box training' },
  { category: 'Cats', name: 'Cats Nutrition and feeding advice' },
  { category: 'Cats', name: 'Cats Play and enrichment activities' },
  { category: 'Cats', name: 'Cats Grooming and hygiene tips' },
  { category: 'Cats', name: 'Cats Health and wellness information' },
  { category: 'Fish', name: 'Fish Aquarium setup and maintenance' },
  { category: 'Fish', name: 'Fish species compatibility' },
  { category: 'Fish', name: 'Fish Feeding and nutrition' },
  { category: 'Fish', name: 'Fish Water quality and filtration tips' },
  { category: 'Fish', name: 'Fish Health and disease prevention' },
  { category: 'Birds', name: 'Birds Cage setup and enrichment' },
  { category: 'Birds', name: 'Birds Nutrition and feeding advice' },
  { category: 'Birds', name: 'Birds Training and socialization tips' },
  { category: 'Birds', name: 'Birds Health and wellness information' },
  { category: 'Birds', name: 'Birds Species-specific care guides' },
  { category: 'Hamsters', name: 'Hamsters Cage setup and bedding' },
  { category: 'Hamsters', name: 'Hamsters Nutrition and feeding advice' },
  { category: 'Hamsters', name: 'Hamsters Exercise and enrichment activities' },
  { category: 'Hamsters', name: 'Hamsters Health and wellness information' },
  { category: 'Hamsters', name: 'Hamsters Handling and socialization tips' },
  { category: 'Rabbits', name: 'Rabbits Hutch and habitat setup' },
  { category: 'Rabbits', name: 'Rabbits Nutrition and feeding advice' },
  { category: 'Rabbits', name: 'Rabbits Exercise and play activities' },
  { category: 'Rabbits', name: 'Rabbits Health and wellness information' },
  { category: 'Rabbits', name: 'Rabbits Grooming and hygiene tips' },
  { category: 'Guinea Pigs', name: 'Guinea Pigs Cage setup and bedding' },
  { category: 'Guinea Pigs', name: 'Guinea Pigs Nutrition and feeding advice' },
  { category: 'Guinea Pigs', name: 'Guinea Pigs Exercise and enrichment activities' },
  { category: 'Guinea Pigs', name: 'Guinea Pigs Health and wellness information' },
  { category: 'Guinea Pigs', name: 'Guinea Pigs Handling and socialization tips' },
  { category: 'Turtles', name: 'Turtles Tank setup and maintenance' },
  { category: 'Turtles', name: 'Turtles Nutrition and feeding advice' },
  { category: 'Turtles', name: 'Turtles Health and wellness information' },
  { category: 'Turtles', name: 'Turtles Species-specific care guides' },
  { category: 'Turtles', name: 'Turtles Handling and socialization tips' },
  { category: 'Snakes', name: 'Snakes Enclosure setup and maintenance' },
  { category: 'Snakes', name: 'Snakes Nutrition and feeding advice' },
  { category: 'Snakes', name: 'Snakes Health and wellness information' },
  { category: 'Snakes', name: 'Snakes Species-specific care guides' },
  { category: 'Snakes', name: 'Snakes Handling and safety tips' },
  { category: 'Lizards', name: 'Lizards Enclosure setup and maintenance' },
  { category: 'Lizards', name: 'Lizards Nutrition and feeding advice' },
  { category: 'Lizards', name: 'Lizards Health and wellness information' },
  { category: 'Lizards', name: 'Lizards Species-specific care guides' },
  { category: 'Lizards', name: 'Lizards Handling and socialization tips' }
];


const User = mongoose.model('User', UserSchema);
const Post = mongoose.model('Post', PostSchema);
const Interest = mongoose.model('Interest', InterestSchema);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
const unlinkFile = util.promisify(fs.unlink); //help to remove files

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).send('Access denied');
  }

  try {
    const decoded = jwt.verify(token, 'secretKey'); // חשוב להחליף 'secretKey' במפתח סודי אמיתי
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).send('Invalid token');
  }
}


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
  if (!user) return res.status(404).send('User not found');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).send('Invalid credentials');

  const token = jwt.sign({ id: user._id, username: user.username, firstName: user.firstName, lastName: user.lastName }, 'secretKey', { expiresIn: '1h' });
  res.json({ token });
});

app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).send('Error fetching profile');
  }
});


app.get('/profile/:username', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.json(user);
  } catch (err) {
    res.status(500).send('Error fetching profile');
  }
});

app.get('/feed', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('following');
    const followingIds = user.following.map(f => f._id);
    const posts = await Post.find({
      $or: [
        { author: { $in: followingIds } },
        { author: user._id },
        { 'shares.user': { $in: followingIds } }
      ]
    })    .populate('author', 'username firstName lastName')
    .populate('shares.user', 'username firstName lastName')
    .populate('interests', 'name'); // Include interest names


    // ווידוא שהתמונה נשלחת עם הנתיב הנכון
    const postsWithImages = posts.map(post => {
      let imageUrl = null;
      if (post.image) {
        // המרת סלשים הפוכים לסלשים רגילים
        let imagePath = post.image.replace(/\\/g, '/');
        // הוספת סלש בתחילת הנתיב אם חסר
        if (!imagePath.startsWith('/')) {
          imagePath = '/' + imagePath;
        }
        imageUrl = `${req.protocol}://${req.get('host')}${imagePath}`;
      }
      
      return {
        ...post._doc,
        image: imageUrl,
        liked: post.likes.includes(req.user.id), // האם המשתמש עשה לייק
        saved: user.savedPosts.includes(post._id) // האם המשתמש שמר את הפוסט
      };
    });

    res.json(postsWithImages);
  } catch (err) {
    console.error('Error fetching feed:', err); // Add logging to see the error
    res.status(500).send('Error fetching feed');
  }
});


app.post('/posts', authenticateToken, upload.single('image'), async (req, res) => {
  const { description, interestId } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const post = new Post({
      description,
      image,
      author: req.user.id,
      authorName: req.user.username
    });

    if (interestId) {
      post.interests = [interestId]; // הוספת תחום עניין רק אם נבחר
    }

    await post.save();
    res.status(201).send(post);
  } catch (err) {
    res.status(500).send('Error creating post');
  }
});




app.put('/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { description, image } = req.body;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).send('Post not found');
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).send('You are not authorized to edit this post');
    }

    post.description = description || post.description;
    post.image = image || post.image;

    await post.save();
    res.send(post);
  } catch (err) {
    res.status(500).send('Error updating post');
  }
});
app.delete('/posts/:id', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).send('Post not found');
    }

    // Log the post image path for debugging
    console.log('Post image path:', post.image);

    // Delete the image file if it exists
    if (post.image) {
      const imagePath = path.join(__dirname, '..', 'uploads', path.basename(post.image));
      // Log the constructed image path for debugging
      console.log('Constructed image path:', imagePath);

      try {
        await unlinkFile(imagePath);
      } catch (error) {
        console.error('Error deleting image file:', error);
        // Continue to delete the post even if the image deletion fails
      }
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: 'Post and image deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).send('Server error');
  }
});


app.post('/posts/:id/unlike', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).send('Post not found');
    post.likes = post.likes.filter(userId => userId.toString() !== req.user.id);
    await post.save();
    res.status(200).send(post);
  } catch (err) {
    console.error('Error unliking post:', err);
    res.status(500).send('Server error');
  }
});

app.post('/posts/:id/like', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    const user = await User.findById(req.user.id);
    if (!post) {
      return res.status(404).send('Post not found');
    }
    if (!user) {
      return res.status(404).send('User not found');
    }

    const userId = req.user.id;
    if (post.likes.includes(userId)) {
      post.likes.pull(userId);
      post.liked = false;
    } else {
      post.likes.push(userId);
      post.liked = true;
    }

    if (user.likes.includes(id)) {
      user.likes.pull(id);
    } else {
      user.likes.push(id);
    }

    await user.save();
    await post.save();
    res.send(post);
  } catch (err) {
    res.status(500).send('Error liking/unliking post');
  }
});

app.post('/posts/:id/share', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { text } = req.body; // הנחת שיש תגובה ב-body של הבקשה

  try {
    const originalPost = await Post.findById(id);
    if (!originalPost) {
      return res.status(404).send('Post not found');
    }

    // הוספת השיתוף החדש לרשימת השיתופים של הפוסט המקורי
    originalPost.shares.push({
      user: req.user.id,
      text: text || '', // טקסט ברירת מחדל ריק אם אין תגובה
      createdAt: new Date()
    });

    // הוספת מזהה הפוסט ששיתף לרשימת השיתופים של המשתמש
    const user = await User.findById(req.user.id);
    user.shares.push(id);

    await originalPost.save();
    await user.save();
    res.status(200).send(originalPost);
  } catch (err) {
    res.status(500).send('Error sharing post');
  }
});



app.post('/posts/:id/save', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    const user = await User.findById(req.user.id);
    if (!post) {
      return res.status(404).send('Post not found');
    }
    if (!user) {
      return res.status(404).send('User not found');
    }

    const userId = req.user.id;

    if (user.savedPosts.includes(id)) {
      user.savedPosts.pull(id);
    } else {
      user.savedPosts.push(id);
    }

    await user.save();
    res.send(post);
  } catch (err) {
    res.status(500).send('Error liking/unliking post');
  }
});




app.post('/follow/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const userToFollow = await User.findById(id);
    if (!userToFollow) {
      return res.status(404).send('User not found');
    }

    const currentUser = await User.findById(req.user.id);

    if (currentUser.following.includes(userToFollow._id)) {
      currentUser.following.pull(userToFollow._id);
      userToFollow.followers.pull(currentUser._id);
    } else {
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);
    }

    await currentUser.save();
    await userToFollow.save();

    res.send({ following: currentUser.following, followers: userToFollow.followers });
  } catch (err) {
    res.status(500).send('Error following/unfollowing user');
  }
});

app.get('/search', authenticateToken, async (req, res) => {
  const { query } = req.query;

  try {
    const users = await User.find({
      $or: [
        { username: new RegExp(query, 'i') },
        { firstName: new RegExp(query, 'i') },
        { lastName: new RegExp(query, 'i') }
      ]
    }).select('username firstName lastName');
    res.json(users);
  } catch (err) {
    res.status(500).send('Error searching users');
  }
});


app.get('/users/:username', authenticateToken, async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select('username firstName lastName email'); // בחירת שדות להצגה
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.json(user);
  } catch (err) {
    res.status(500).send('Error retrieving user');
  }
});




app.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).send('Invalid current password');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.send('Password changed');
  } catch (err) {
    res.status(500).send('Error changing password');
  }
});

app.delete('/delete-account', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.send('Account deleted');
  } catch (err) {
    res.status(500).send('Error deleting account');
  }
});


app.post('/following', authenticateToken, async (req, res) => {
  try {
    const usernameToFollow = req.body.username; // Username of the user to follow
    const currentUsername = req.user.username; // Username of the logged-in user

    // Check if the user is trying to follow themselves
    if (usernameToFollow === currentUsername) {
      return res.status(400).send('You cannot follow yourself');
    }

    // Find the user to follow
    const userToFollow = await User.findOne({ username: usernameToFollow });
    if (!userToFollow) {
      return res.status(404).send('User not found');
    }

    // Find the current logged-in user
    const currentUser = await User.findOne({ username: currentUsername });
    if (!currentUser) {
      return res.status(404).send('Current user not found');
    }

    // Check if the current user is already following the user
    if (currentUser.following.includes(userToFollow._id)) {
      return res.status(400).send('Already following this user');
    }

    // Add the user to the following list of the current user
    currentUser.following.push(userToFollow._id);
    await currentUser.save();

    res.json({ message: `Now following ${usernameToFollow}` });
  } catch (error) {
    res.status(500).send(error.message);
  }
});


app.post('/unfollow', authenticateToken, async (req, res) => {
  try {
    const usernameToUnfollow = req.body.username; // Username of the user to unfollow
    const currentUsername = req.user.username; // Username of the logged-in user

    // Find the user to unfollow
    const userToUnfollow = await User.findOne({ username: usernameToUnfollow });
    if (!userToUnfollow) {
      return res.status(404).send('User not found');
    }

    // Find the current logged-in user
    const currentUser = await User.findOne({ username: currentUsername });
    if (!currentUser) {
      return res.status(404).send('Current user not found');
    }

    // Check if the current user is not following the user
    if (!currentUser.following.includes(userToUnfollow._id)) {
      return res.status(400).send('Not following this user');
    }

    // Remove the user from the following list of the current user
    currentUser.following = currentUser.following.filter(followingId => !followingId.equals(userToUnfollow._id));
    await currentUser.save();

    res.json({ message: `Unfollowed ${usernameToUnfollow}` });
  } catch (error) {
    res.status(500).send(error.message);
  }
});


app.get('/current-user-following', authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user; // המשתמש המחובר

    // מציאת המשתמש המחובר במסד הנתונים
    const user = await User.findOne({ username: currentUser.username }).populate('following', 'username');
    if (!user) {
      return res.status(404).send('User not found');
    }

    // החזרת רשימת המשתמשים שהמשתמש עוקב אחריהם
    const following = user.following.map(user => user.username);
    res.json({ following });
  } catch (error) {
    res.status(500).send(error.message);
  }
});


//return the uploaded post(personal-area)
app.get('/share', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      // Fetch posts where the user has shared them
      const sharePosts = await Post.find({ 'shares.user': user.id }).populate('author', 'username firstName lastName');

      // Prepare array of shared posts with additional information
      const userShares = [];
      sharePosts.forEach(post => {
        post.shares.forEach(share => {
          if (share.user.toString() === user.id.toString()) {
            let imageUrl = null;
            if (post.image) {
              let imagePath = post.image.replace(/\\/g, '/');
              if (!imagePath.startsWith('/')) {
                imagePath = '/' + imagePath;
              }
              imageUrl = `${req.protocol}://${req.get('host')}${imagePath}`;
            }

            userShares.push({
              ...post.toObject(), // Convert Mongoose document to plain object
              description: `Shared Post: ${post.description}`, // Add "Shared Post" text
              sharedText: share.text,
              sharedAt: share.createdAt,
              sharedBy: {
                firstName: user.firstName,
                lastName: user.lastName,
              },
              image: imageUrl // הוספת כתובת התמונה אם קיימת
            });
          }
        });
      });

      res.json(userShares);
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error fetching shared posts:', error);
    res.status(500).send(error.message);
  }
});

// פונקציה חדשה להסרת שיתוף
app.delete('/Unshare/:postId/:userId/:createdAt', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.params.userId;
    const createdAt = new Date(req.params.createdAt);
    const currentUserId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).send('Post not found');
    }

    // מציאת השיתוף הספציפי והסרתו
    const shareIndex = post.shares.findIndex(share => share.user.toString() === userId && new Date(share.createdAt).getTime() === createdAt.getTime());
    if (shareIndex === -1) {
      return res.status(404).send('Share not found');
    }

    post.shares.splice(shareIndex, 1);
    await post.save();

    // הסרת מזהה השיתוף מרשימת השיתופים של המשתמש
    const user = await User.findById(currentUserId);
    user.shares = user.shares.filter(userShareId => userShareId.toString() !== postId);
    await user.save();

    res.status(200).send({ message: 'Unshared post successfully' });
  } catch (error) {
    console.error('Error unsharing post:', error);
    res.status(500).send('Server error');
  }
});

app.get('/uploaded-content', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      const uploadedPosts = await Post.find({ author: user.id });

      const postsWithImages = uploadedPosts.map(post => {
        let imageUrl = null;
        if (post.image) {
          let imagePath = post.image.replace(/\\/g, '/');
          if (!imagePath.startsWith('/')) {
            imagePath = '/' + imagePath;
          }
          imageUrl = `${req.protocol}://${req.get('host')}${imagePath}`;
        }
        return {
          ...post._doc,
          image: imageUrl
        };
      });

      res.json(postsWithImages);
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});



app.get('/public-uploaded-content/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username });
    if (user) {
      const uploadedPosts = await Post.find({ author: user.id });

      const postsWithImages = uploadedPosts.map(post => {
        let imageUrl = null;
        if (post.image) {
          let imagePath = post.image.replace(/\\/g, '/');
          if (!imagePath.startsWith('/')) {
            imagePath = '/' + imagePath;
          }
          imageUrl = `${req.protocol}://${req.get('host')}${imagePath}`;
        }
        return {
          ...post._doc,
          image: imageUrl
        };
      });

      res.json(postsWithImages);
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// נתיב לעדכון פרטי המשתמש
app.put('/user-details', authenticateToken, async (req, res) => {
  const { firstName, lastName, email, dateOfBirth, pet} = req.body;
  
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // עדכון הפרטים החדשים
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.pet= pet|| user.pet;
    await user.save();
    res.status(200).send('User details updated successfully');
  } catch (err) {
    console.error('Error updating user details:', err);
    res.status(500).send('Error updating user details');
  }
});


//return the favorite post(personal-area)
// Return favorite posts with proper image URLs
app.get('/favorite-content', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      const favoritePostIds = user.likes;
      const favoritePosts = await Post.find({ _id: { $in: favoritePostIds } });

      const postsWithImages = favoritePosts.map(post => {
        let imageUrl = null;
        if (post.image) {
          let imagePath = post.image.replace(/\\/g, '/');
          if (!imagePath.startsWith('/')) {
            imagePath = '/' + imagePath;
          }
          imageUrl = `${req.protocol}://${req.get('host')}${imagePath}`;
        }
        return {
          ...post._doc,
          image: imageUrl
        };
      });

      res.json(postsWithImages);
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Return saved posts with proper image URLs
app.get('/saved-content', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      const savedPostIds = user.savedPosts;
      const savedPosts = await Post.find({ _id: { $in: savedPostIds } });

      const postsWithImages = savedPosts.map(post => {
        let imageUrl = null;
        if (post.image) {
          let imagePath = post.image.replace(/\\/g, '/');
          if (!imagePath.startsWith('/')) {
            imagePath = '/' + imagePath;
          }
          imageUrl = `${req.protocol}://${req.get('host')}${imagePath}`;
        }
        return {
          ...post._doc,
          image: imageUrl
        };
      });

      res.json(postsWithImages);
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.delete('/uploaded-content/:id', authenticateToken, async (req, res) => {
  // Handle removal of uploaded content
  res.send('Uploaded content removed');
});







app.get('/interests', authenticateToken, async (req, res) => {
  try {
    const interests = await Interest.find({});
    res.json(interests);
  } catch (err) {
    res.status(500).send('Error fetching interests');
  }
});


app.get('/user-interests', authenticateToken, async (req, res) => {
  try {
    // שליפת המשתמש לפי המזהה שמופיע בטוקן
    const user = await User.findById(req.user.id).populate('followingInterests');
    
    // בדיקה שהמשתמש קיים
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // החזרת תחומי העניין שאחריהם המשתמש עוקב כתגובה
    res.json(user.followingInterests);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user interests' });
  }
});

app.get('/interest-categories', authenticateToken, async (req, res) => {
  try {
    // נניח שיש לך מודל של תחום עניין עם שדות כמו שם וקטגוריה
    const categories = await Interest.aggregate([
      {
        $group: {
          _id: '$category', // מקבץ לפי קטגוריה
          interests: { $push: { _id: '$_id', name: '$name' } } // צובר את התחומי עניין בכל קטגוריה
        }
      },
      {
        $project: {
          _id: 0, // לא מציג את ה-id של הקבוצה
          name: '$_id', // מציג את שם הקטגוריה
          interests: 1 // מציג את התחומי עניין בקטגוריה
        }
      }
    ]);

    res.json(categories);
  } catch (err) {
    res.status(500).send('Error fetching interest categories');
  }
});


app.get('/interests-posts', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('followingInterests');
    const interestsIds = user.followingInterests.map(interest => interest._id);
    
    const posts = await Post.find({ interests: { $in: interestsIds } })
                            .populate('author', 'username firstName lastName')
                            .populate('interests', 'name category');

    const postsWithImages = posts.map(post => {
      let imageUrl = null;
      if (post.image) {
        let imagePath = post.image.replace(/\\/g, '/');
        if (!imagePath.startsWith('/')) {
          imagePath = '/' + imagePath;
        }
        imageUrl = `${req.protocol}://${req.get('host')}${imagePath}`;
      }
      return {
        ...post.toObject(),
        image: imageUrl
      };
    });

    res.json(postsWithImages);
  } catch (err) {
    res.status(500).send('Error fetching posts by interests');
  }
});



app.get('/trending-posts', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('followingInterests');
    const interestsIds = user.followingInterests.map(interest => interest._id);
    
    const posts = await Post.aggregate([
      { $match: { interests: { $in: interestsIds } } },
      { $project: { description: 1, author: 1, image: 1, likesCount: { $size: "$likes" }, createdAt: 1 } },
      { $sort: { likesCount: -1, createdAt: -1 } },
      { $limit: 10 }
    ]);
    
    res.json(posts);
  } catch (err) {
    res.status(500).send('Error fetching trending posts');
  }
});

app.get('/popular-interests', authenticateToken, async (req, res) => {
  try {
    const popularInterests = await Interest.aggregate([
      { $lookup: { from: 'users', localField: '_id', foreignField: 'followingInterests', as: 'followers' } },
      { $project: { name: 1, category: 1, followersCount: { $size: "$followers" } } },
      { $sort: { followersCount: -1 } },
      { $limit: 10 }
    ]);
    res.json(popularInterests);
  } catch (err) {
    res.status(500).send('Error fetching popular interests');
  }
});

app.get('/interests-by-category', authenticateToken, async (req, res) => {
  const { category } = req.query;

  try {
    const interests = await Interest.find({ category: new RegExp(category, 'i') });
    res.json(interests);
  } catch (err) {
    res.status(500).send('Error fetching interests by category');
  }
});

app.get('/search-interests', authenticateToken, async (req, res) => {
  const { query } = req.query;

  try {
    const interests = await Interest.find({ name: new RegExp(query, 'i') });
    res.json(interests);
  } catch (err) {
    res.status(500).send('Error searching interests');
  }
});


app.post('/follow-interest', authenticateToken, async (req, res) => {
  const { interestId } = req.body;

  try {
    const interest = await Interest.findById(interestId);
    const user = await User.findById(req.user.id);

    if (!interest) {
      return res.status(404).json({ message: 'Interest not found' });
    }

    if (!user.followingInterests.includes(interestId)) {
      user.followingInterests.push(interestId);
      await user.save();
    }

    res.status(200).json({ message: 'Interest followed successfully' });  // Ensure JSON response
  } catch (err) {
    res.status(500).json({ message: 'Error following interest' });
  }
});



app.post('/unfollow-interest', authenticateToken, async (req, res) => {
  const { interestId } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user.followingInterests.includes(interestId)) {
      return res.status(400).json({ message: 'You are not following this interest' });
    }

    user.followingInterests = user.followingInterests.filter(id => id.toString() !== interestId);
    await user.save();

    res.status(200).json({ message: 'Interest unfollowed successfully' });  // Ensure JSON response
  } catch (err) {
    res.status(500).json({ message: 'Error unfollowing interest' });
  }
});







app.delete('/uploaded-content/:id', authenticateToken, async (req, res) => {
  // Handle removal of uploaded content
  res.send('Uploaded content removed');
});





app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  const mailOptions = {
    from: email,
    to: 'roeina@ac.sce.ac.il, tamirbe2@ac.sce.ac.il, nirag@ac.sce.ac.il, neriaat@ac.sce.ac.il, avirabe5@ac.sce.ac.il, eladge1@ac.sce.ac.il, idanya@ac.sce.ac.il',
    subject: `New message from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); background: #ffffff;">
        <div style="text-align: center; background: #bebebe; padding: 20px; border-radius: 10px 10px 0 0;">
          <img src="cid:mailIcon" alt="Mail Icon" style="width: 50px; height: 50px; display: block; margin: 0 auto;">
          <h2 style="color: #ffffff;">New Message from ${name}</h2>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 16px; color: #555;">You have received a new message through the contact form on your website:</p>
          <p style="font-size: 16px; color: #555;"><strong>Name:</strong> ${name}</p>
          <p style="font-size: 16px; color: #555;"><strong>Email:</strong> ${email}</p>
          <p style="font-size: 16px; color: #555;"><strong>Message:</strong></p>
          <p style="font-size: 16px; color: #555; background: #f9f9f9; padding: 10px; border-radius: 5px;">${message}</p>
        </div>
        <div style="text-align: center; padding: 20px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
          <p style="font-size: 14px; color: #999;">This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: 'mail.png',
        path: mailIconPath,
        cid: 'mailIcon' // same cid value as in the html img src
      }
    ]
  };
  
  
  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Message received' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Error sending email' });
  }
});

app.get('/getUserDetails', (req, res) => {
  res.json(aboutContent);
});


// All other GET requests not handled before will return the Angular app
app.get('*', (req, res) => {
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;//