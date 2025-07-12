import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import User from '../models/user.js';
import Post from '../models/post.js';
import Reply from '../models/reply.js';
import { verifyToken } from './middleware/authMiddleware.js';

dotenv.config();

const router = express.Router();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'profile-pics',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 300, height: 300, crop: 'fill' }]
  }
});

const upload = multer({ storage });

// Mettre à jour son propre profil
router.put('/profile', verifyToken, upload.single('profilePic'), async (req, res) => {
  try {
    const user = req.user;
    const { email, username, password, bio, location, website, github, skills, preferredLanguages } = req.body;

    if (email) user.email = email.toLowerCase();
    if (username) user.username = username;
    if (password) {
      const bcrypt = await import('bcrypt');
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
    }
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (github !== undefined) user.github = github;
    if (skills) user.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
    if (preferredLanguages) user.preferredLanguages = Array.isArray(preferredLanguages) ? preferredLanguages : [preferredLanguages];
    
    if (req.file && req.file.path) {
      user.profilePic = req.file.path; // URL Cloudinary
    }

    user.lastActive = Date.now();

    await user.save();

    res.json({
      msg: 'Profil mis à jour',
      user: {
        email: user.email,
        username: user.username,
        profilePic: user.profilePic,
        bio: user.bio,
        location: user.location,
        website: user.website,
        github: user.github,
        skills: user.skills,
        preferredLanguages: user.preferredLanguages
      }
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// GET /profile - obtenir son propre profil
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    user.lastActive = Date.now();
    await user.save();
    
    res.json({
      _id: user._id,
      email: user.email,
      username: user.username,
      profilePic: user.profilePic,
      bio: user.bio,
      location: user.location,
      website: user.website,
      github: user.github,
      skills: user.skills,
      preferredLanguages: user.preferredLanguages,
      reputation: user.reputation || 0,
      joinDate: user.joinDate,
      lastActive: user.lastActive
    });
  } catch (err) {
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// GET /user/:userId - obtenir le profil public
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .select('-password -email')
      .lean();
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }

    const postCount = await Post.countDocuments({ author: userId });
    const replyCount = await Reply.countDocuments({ author: userId });
    
    const recentPosts = await Post.find({ author: userId })
      .select('title category createdAt replies views likes')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentReplies = await Reply.find({ author: userId })
      .populate('post', 'title')
      .select('content post createdAt likes')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        profilePic: user.profilePic,
        bio: user.bio,
        location: user.location,
        website: user.website,
        github: user.github,
        skills: user.skills,
        preferredLanguages: user.preferredLanguages,
        reputation: user.reputation || 0,
        joinDate: user.joinDate,
        lastActive: user.lastActive
      },
      stats: {
        postCount,
        replyCount,
        totalContributions: postCount + replyCount
      },
      recentActivity: {
        posts: recentPosts,
        replies: recentReplies
      }
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// GET /users/search
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q || q.length < 2) return res.json({ users: [] });

    const users = await User.find({
      username: { $regex: q, $options: 'i' }
    })
    .select('username profilePic reputation')
    .limit(parseInt(limit))
    .lean();

    res.json({ users });
  } catch (err) {
    console.error('Error searching users:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// GET /users/top
router.get('/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const topUsers = await User.find({ isActive: { $ne: false } })
      .select('username profilePic reputation joinDate')
      .sort({ reputation: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({ users: topUsers });
  } catch (err) {
    console.error('Error fetching top users:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// POST /follow/:userId
router.post('/follow/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ msg: 'Vous ne pouvez pas vous suivre vous-même' });
    }
    res.json({ msg: 'Fonctionnalité à venir' });
  } catch (err) {
    console.error('Error following user:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

export default router;
