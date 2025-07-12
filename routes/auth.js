import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// Inscription
router.post('/register', async (req, res) => {
  let { email, password, username } = req.body;
  email = email.toLowerCase();

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "Email déjà utilisé" });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ msg: "Nom d'utilisateur déjà utilisé" });

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ msg: "Le nom d'utilisateur doit contenir au moins 3 caractères" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      email, 
      password: hashed, 
      username: username.trim() 
    });
    await newUser.save();

    res.status(201).json({ msg: "Utilisateur créé" });
  } catch (err) {
    console.error('Erreur inscription:', err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  console.log('Route /login appelée avec:', req.body);

  let { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: "Email et mot de passe requis" });
  }
  email = email.toLowerCase();

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.warn('Login failed - email not found:', email);
      return res.status(400).json({ msg: "Email incorrect" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn('Login failed - mot de passe incorrect pour:', email);
      return res.status(400).json({ msg: "Mot de passe incorrect" });
    }

    // Mettre à jour la dernière activité
    user.lastActive = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({ 
      token, 
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        profilePic: user.profilePic,
        preferredLanguages: user.preferredLanguages,
        bio: user.bio,
        joinDate: user.joinDate
      }
    });
  } catch (err) {
    console.error('Erreur login:', err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
});

export default router;
