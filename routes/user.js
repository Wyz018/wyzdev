import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import User from '../models/user.js';
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
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

// GET /profile - get user profile data
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user._id,
      email: user.email,
      username: user.username,
      profilePic: user.profilePic,
      preferredLanguages: user.preferredLanguages,
      bio: user.bio,
      joinDate: user.joinDate,
      lastActive: user.lastActive
    });
  } catch (err) {
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// PUT /profile - update user profile
router.put('/profile', verifyToken, upload.single('profilePic'), async (req, res) => {
  try {
    const user = req.user;
    const { email, username, bio, preferredLanguages } = req.body;

    // Vérifier l'email unique si modifié
    if (email && email.toLowerCase() !== user.email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ msg: "Email déjà utilisé" });
      }
      user.email = email.toLowerCase();
    }

    // Vérifier le nom d'utilisateur unique si modifié
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ msg: "Nom d'utilisateur déjà utilisé" });
      }
      user.username = username;
    }

    if (bio !== undefined) user.bio = bio;
    
    if (preferredLanguages) {
      const languages = Array.isArray(preferredLanguages) ? preferredLanguages : JSON.parse(preferredLanguages);
      user.preferredLanguages = languages;
    }

    if (req.file) {
      // Supprimer l'ancienne photo si elle existe
      if (user.profilePic && user.profilePic !== '') {
        const oldPath = path.join(process.cwd(), 'uploads/profile-pics', path.basename(user.profilePic));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      user.profilePic = '/uploads/profile-pics/' + req.file.filename;
    }

    await user.save();
    
    res.json({ 
      msg: 'Profil mis à jour',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        profilePic: user.profilePic,
        preferredLanguages: user.preferredLanguages,
        bio: user.bio
      }
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// PUT /profile/password - change password
router.put('/profile/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Vérifier le mot de passe actuel
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Mot de passe actuel incorrect" });
    }

    // Valider le nouveau mot de passe
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ msg: "Le nouveau mot de passe doit contenir au moins 6 caractères" });
    }

    // Hasher et sauvegarder le nouveau mot de passe
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ msg: 'Mot de passe mis à jour' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// DELETE /profile/picture - delete profile picture
router.delete('/profile/picture', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    
    if (user.profilePic && user.profilePic !== '') {
      const imagePath = path.join(process.cwd(), 'uploads/profile-pics', path.basename(user.profilePic));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      user.profilePic = '';
      await user.save();
    }

    res.json({ msg: 'Photo de profil supprimée' });
  } catch (err) {
    console.error('Error deleting profile picture:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

export default router;
