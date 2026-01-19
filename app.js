require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// JSON file operations
const dataDir = path.join(__dirname, 'data');
const postsFile = path.join(dataDir, 'posts.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const readPostsFromJSON = () => {
  try {
    if (fs.existsSync(postsFile)) {
      const data = fs.readFileSync(postsFile, 'utf8');
      return JSON.parse(data || '[]');
    }
    return [];
  } catch {
    return [];
  }
};

const writePostsToJSON = (posts) => {
  fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2), 'utf8');
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/create', (req, res) => {
  res.sendFile(path.join(__dirname, 'create.html'));
});

// MongoDB setup
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/blog';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err.message));

const postSchema = new mongoose.Schema({
  title: String,
  author: String,
  description: String,
  date: Date,
  image: String
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);

// REST API for posts
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    writePostsToJSON(posts);
    res.json(posts);
  } catch (err) {
    const jsonPosts = readPostsFromJSON();
    res.json(jsonPosts);
  }
});

app.post('/posts', upload.single('image'), async (req, res) => {
  try {
    const { title, author, description, date } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const p = new Post({ title, author, description, date, image });
    const saved = await p.save();

    // Also save to JSON
    const posts = readPostsFromJSON();
    posts.unshift({
      _id: saved._id.toString(),
      title,
      author,
      description,
      date,
      image,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt
    });
    writePostsToJSON(posts);

    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

app.put('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Post.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Post not found' });

    // Also update JSON
    const posts = readPostsFromJSON();
    const idx = posts.findIndex(p => p._id === id);
    if (idx !== -1) {
      posts[idx] = { ...posts[idx], ...req.body };
      writePostsToJSON(posts);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

app.delete('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await Post.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ error: 'Post not found' });

    // Also delete from JSON
    let posts = readPostsFromJSON();
    posts = posts.filter(p => p._id !== id);
    writePostsToJSON(posts);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Keep existing utility routes if needed (left minimal)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
