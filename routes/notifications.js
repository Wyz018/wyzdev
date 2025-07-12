import express from 'express';
import Notification from '../models/notification.js';
import { verifyToken } from './middleware/authMiddleware.js';

const router = express.Router();

// Récupérer toutes les notifications de l'utilisateur
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username profilePic')
      .populate('post', 'title')
      .populate('reply', 'content')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des notifications' });
  }
});

// Compter les notifications non lues
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: req.user._id, 
      read: false 
    });
    res.json({ count });
  } catch (error) {
    console.error('Erreur comptage notifications:', error);
    res.status(500).json({ message: 'Erreur lors du comptage des notifications' });
  }
});

// Marquer une notification comme lue
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Erreur marquage notification:', error);
    res.status(500).json({ message: 'Erreur lors du marquage de la notification' });
  }
});

// Marquer toutes les notifications comme lues
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error('Erreur marquage notifications:', error);
    res.status(500).json({ message: 'Erreur lors du marquage des notifications' });
  }
});

// Supprimer une notification
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    console.error('Erreur suppression notification:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la notification' });
  }
});

export default router;
