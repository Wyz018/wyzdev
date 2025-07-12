import jwt from 'jsonwebtoken';
import User from '../../models/user.js';
import dotenv from 'dotenv';

dotenv.config();

export const verifyToken = async (req, res, next) => {
  console.log('verifyToken middleware called');
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('Authorization header missing');
    return res.status(401).json({ msg: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('Token missing in Authorization header');
    return res.status(401).json({ msg: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('User not found for decoded token id:', decoded.id);
      return res.status(401).json({ msg: 'Utilisateur non trouvé' });
    }

    req.user = user;
    console.log('User authenticated:', user._id);
    next();
  } catch (err) {
    console.log('Token verification error:', err.message);
    res.status(401).json({ msg: 'Token invalide' });
  }
};
