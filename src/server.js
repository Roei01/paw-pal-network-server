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


const corsOptions = {
  origin: 'http://localhost:4200', // Adjust this to match your Angular app's URL
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
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }], // הוסף שדה זה
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }], // עדכון הסכמה לשמור מזהי פוסטים
  pet: { type: String },
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
  }]
});

const Schema = mongoose.Schema;

const SavePostSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }] // הוסף שדה זה
});

const User = mongoose.model('User', UserSchema);
const Post = mongoose.model('Post', PostSchema);

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
    }).populate('author', 'username firstName lastName').populate('shares.user', 'username firstName lastName');

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
        image: imageUrl
      };
    });

    res.json(postsWithImages);
  } catch (err) {
    console.error('Error fetching feed:', err); // Add logging to see the error
    res.status(500).send('Error fetching feed');
  }
});


app.post('/posts', authenticateToken, upload.single('image'), async (req, res) => {
  const { description } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const post = new Post({
      description,
      image,
      author: req.user.id,
      authorName: req.user.username
    });

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
    } else {
      post.likes.push(userId);
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
    const { password } = req.body; // קבלת הסיסמה מהבקשה
    console.log(req.body);

    // חיפוש המשתמש במסד הנתונים לפי ID
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send('User not found');
    }

    // השוואת הסיסמה שסופקה עם הסיסמה המוצפנת במסד הנתונים
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send('Invalid password');
    }

    // אם הסיסמה תואמת, המשך למחיקת החשבון
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
            userShares.push({
              ...post.toObject(), // Convert Mongoose document to plain object
              description: `Shared Post: ${post.description}`, // Add "Shared Post" text
              sharedText: share.text,
              sharedAt: share.createdAt,
              sharedBy: {
                firstName: user.firstName,
                lastName: user.lastName
              }
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
  const { firstName, lastName, email, dateOfBirth, pet } = req.body;

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
    user.pet = pet || user.pet;
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


app.delete('/uploaded-content/:id', authenticateToken, async (req, res) => {
  // Handle removal of uploaded content
  res.send('Uploaded content removed');
});




app.get('/about', (req, res) => {
  const aboutContent = {
    description: 'We are a group of dedicated software engineering students working on an exciting project to connect pet lovers through a social network. Our members include Roei, Tamir, Aviram, Nir, Elad, Neria, and Idan. Stay tuned for more updates!',
    members: ['Roei', 'Tamir', 'Aviram', 'Nir', 'Elad', 'Neria', 'Idan'],
    project: 'Our project, PawPal Network, is a social network designed to help pet lovers connect, share experiences, and celebrate the joys of pet ownership.',
  };
  res.json(aboutContent);
});

app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  const mailOptions = {
    from: email,
    to: 'roeina@ac.sce.ac.il, tamirbe2@ac.sce.ac.il, nirag@ac.sce.ac.il, neriaat@ac.sce.ac.il, avirabe5@ac.sce.ac.il, eladge1@ac.sce.ac.il, idanya@ac.sce.ac.il',
    subject: `New message from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <h2 style="text-align: center; color: #333;">New Message from ${name}</h2>
        <p style="font-size: 16px; color: #555;">You have received a new message through the contact form on your website:</p>
        <p style="font-size: 16px; color: #555;"><strong>Name:</strong> ${name}</p>
        <p style="font-size: 16px; color: #555;"><strong>Email:</strong> ${email}</p>
        <p style="font-size: 16px; color: #555;"><strong>Message:</strong></p>
        <p style="font-size: 16px; color: #555; background: #f9f9f9; padding: 10px; border-radius: 5px;">${message}</p>
        <p style="text-align: center; margin-top: 20px; font-size: 14px; color: #999;">This is an automated message. Please do not reply directly to this email.</p>
      </div>
    `
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

export default app;