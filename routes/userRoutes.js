import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/user.js';
import Post from '../models/post.js';
import Reply from '../models/reply.js';
import { verifyToken } from './middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for profile picture upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profile-pics';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    // Ensure unique filename by appending timestamp
    cb(null, req.user._id + '-' + Date.now() + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

// Mettre à jour son propre profil
router.put('/profile', verifyToken, upload.single('profilePic'), async (req, res) => {
  console.log('PUT /profile called');
  console.log('User:', req.user);
  console.log('Body:', req.body);
  console.log('File:', req.file);
  try {
    const user = req.user;
    const { email, username, password, bio, location, website, github, skills, preferredLanguages } = req.body;

    if (email) user.email = email.toLowerCase();
    if (username) user.username = username;
    if (password) {
      // Hash password before saving
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
    
    if (req.file) {
      console.log('Uploaded file:', req.file);
      // Delete old profile pic if exists
      if (user.profilePic && user.profilePic.startsWith('/uploads/')) {
        const oldPath = path.join(process.cwd(), user.profilePic);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      // Store relative path for frontend access
      user.profilePic = '/uploads/profile-pics/' + req.file.filename;
      console.log('Updated profilePic path:', user.profilePic);
    }

    // Update last active
    user.lastActive = Date.now();

    await user.save();
    console.log('User profile updated successfully');
    res.json({ msg: 'Profil mis à jour', user: {
      email: user.email,
      username: user.username,
      profilePic: user.profilePic,
      bio: user.bio,
      location: user.location,
      website: user.website,
      github: user.github,
      skills: user.skills,
      preferredLanguages: user.preferredLanguages
    }});
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// GET /profile - obtenir son propre profil
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Update last active
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

// GET /user/:userId - obtenir le profil public d'un utilisateur
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('-password -email') // Ne pas exposer le mot de passe et l'email
      .lean();
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }

    // Obtenir les statistiques de l'utilisateur
    const postCount = await Post.countDocuments({ author: userId });
    const replyCount = await Reply.countDocuments({ author: userId });
    
    // Obtenir les posts récents
    const recentPosts = await Post.find({ author: userId })
      .select('title category createdAt replies views likes')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Obtenir les réponses récentes
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

// GET /users/search - rechercher des utilisateurs
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ users: [] });
    }

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

// GET /users/top - obtenir les utilisateurs avec le plus de réputation
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

// POST /follow/:userId - suivre un utilisateur (fonctionnalité future)
router.post('/follow/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ msg: 'Vous ne pouvez pas vous suivre vous-même' });
    }

    // Cette fonctionnalité peut être implémentée plus tard
    res.json({ msg: 'Fonctionnalité à venir' });
  } catch (err) {
    console.error('Error following user:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

export default router;
