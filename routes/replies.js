import express from 'express';
import Reply from '../models/reply.js';
import Post from '../models/post.js';
import User from '../models/user.js';
import Notification from '../models/notification.js';
import { verifyToken } from './middleware/authMiddleware.js';

const router = express.Router();

// Créer une réponse à un post
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { postId, content, code, parentReplyId } = req.body;

    // Validation
    if (!postId || !content) {
      return res.status(400).json({ msg: 'Post ID et contenu sont requis' });
    }

    // Vérifier que le post existe
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ msg: 'Post non trouvé' });
    }

    // Vérifier que le post n'est pas fermé
    if (post.isClosed) {
      return res.status(403).json({ msg: 'Ce post est fermé aux nouvelles réponses' });
    }

    const newReply = new Reply({
      content,
      code,
      author: req.user._id,
      post: postId,
      parentReply: parentReplyId || null
    });

    await newReply.save();

    // Ajouter la réponse au post
    post.replies.push(newReply._id);
    await post.save();

    // Ajouter la réponse à la liste des réponses de l'utilisateur
    await User.findByIdAndUpdate(req.user._id, {
      $push: { replies: newReply._id }
    });

    // Augmenter la réputation de l'utilisateur
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { reputation: 2 }
    });

    // Créer une notification pour l'auteur du post si ce n'est pas lui qui répond
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'reply',
        post: post._id,
        reply: newReply._id,
        message: `${req.user.username} a répondu à votre post "${post.title}"`
      });
    }

    // Populate author info before sending response
    await newReply.populate('author', 'username email profilePic');

    res.status(201).json({
      msg: 'Réponse ajoutée avec succès',
      reply: newReply
    });
  } catch (err) {
    console.error('Erreur création réponse:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// Obtenir toutes les réponses d'un post
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt' } = req.query;
    const skip = (page - 1) * limit;

    // Options de tri
    let sortOptions = {};
    switch (sortBy) {
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'likes':
        sortOptions = { 'likes.length': -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const replies = await Reply.find({ post: postId })
      .populate('author', 'username email profilePic reputation')
      .populate('parentReply', 'author content')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalReplies = await Reply.countDocuments({ post: postId });

    res.json({
      replies,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalReplies / limit),
      totalReplies
    });
  } catch (err) {
    console.error('Erreur récupération réponses:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// Mettre à jour une réponse
router.put('/:replyId', verifyToken, async (req, res) => {
  try {
    const { replyId } = req.params;
    const { content, code } = req.body;

    const reply = await Reply.findById(replyId);

    if (!reply) {
      return res.status(404).json({ msg: 'Réponse non trouvée' });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (reply.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Non autorisé' });
    }

    // Sauvegarder l'ancienne version dans l'historique
    if (reply.content !== content) {
      reply.editHistory.push({
        content: reply.content,
        editedAt: new Date()
      });
    }

    // Mettre à jour les champs
    if (content) reply.content = content;
    if (code !== undefined) reply.code = code;

    await reply.save();

    res.json({ msg: 'Réponse mise à jour', reply });
  } catch (err) {
    console.error('Erreur mise à jour réponse:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// Supprimer une réponse
router.delete('/:replyId', verifyToken, async (req, res) => {
  try {
    const { replyId } = req.params;

    const reply = await Reply.findById(replyId);

    if (!reply) {
      return res.status(404).json({ msg: 'Réponse non trouvée' });
    }

    // Vérifier que l'utilisateur est l'auteur ou admin
    if (reply.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ msg: 'Non autorisé' });
    }

    // Retirer la réponse du post
    await Post.findByIdAndUpdate(reply.post, {
      $pull: { replies: replyId }
    });

    // Retirer la réponse de la liste des réponses de l'utilisateur
    await User.findByIdAndUpdate(reply.author, {
      $pull: { replies: replyId }
    });

    await reply.deleteOne();

    res.json({ msg: 'Réponse supprimée avec succès' });
  } catch (err) {
    console.error('Erreur suppression réponse:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// Liker/Unliker une réponse
router.post('/:replyId/like', verifyToken, async (req, res) => {
  try {
    const { replyId } = req.params;

    const reply = await Reply.findById(replyId).populate('post', 'title');

    if (!reply) {
      return res.status(404).json({ msg: 'Réponse non trouvée' });
    }

    const liked = await reply.toggleLike(req.user._id);

    // Augmenter la réputation de l'auteur si c'est un nouveau like
    const isLiked = reply.likes.includes(req.user._id);
    if (isLiked && reply.author.toString() !== req.user._id.toString()) {
      await User.findByIdAndUpdate(reply.author, {
        $inc: { reputation: 1 }
      });

      // Créer une notification pour l'auteur de la réponse
      await Notification.create({
        recipient: reply.author,
        sender: req.user._id,
        type: 'like_reply',
        post: reply.post._id,
        reply: reply._id,
        message: `${req.user.username} a aimé votre réponse sur "${reply.post.title}"`
      });
    }

    res.json({ 
      msg: isLiked ? 'Réponse likée' : 'Like retiré',
      likes: reply.likes.length 
    });
  } catch (err) {
    console.error('Erreur like réponse:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// Marquer une réponse comme acceptée (seulement l'auteur du post)
router.post('/:replyId/accept', verifyToken, async (req, res) => {
  try {
    const { replyId } = req.params;

    const reply = await Reply.findById(replyId).populate('post');

    if (!reply) {
      return res.status(404).json({ msg: 'Réponse non trouvée' });
    }

    // Vérifier que l'utilisateur est l'auteur du post
    if (reply.post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Seul l\'auteur du post peut accepter une réponse' });
    }

    // Retirer l'acceptation des autres réponses du même post
    await Reply.updateMany(
      { post: reply.post._id, isAccepted: true },
      { isAccepted: false }
    );

    // Accepter cette réponse
    reply.isAccepted = true;
    await reply.save();

    // Augmenter significativement la réputation de l'auteur de la réponse
    if (reply.author.toString() !== req.user._id.toString()) {
      await User.findByIdAndUpdate(reply.author, {
        $inc: { reputation: 10 }
      });
    }

    res.json({ msg: 'Réponse marquée comme acceptée' });
  } catch (err) {
    console.error('Erreur acceptation réponse:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// Obtenir les réponses d'un utilisateur
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const replies = await Reply.find({ author: userId })
      .populate('post', 'title category')
      .populate('author', 'username email profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalReplies = await Reply.countDocuments({ author: userId });

    res.json({
      replies,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalReplies / limit),
      totalReplies
    });
  } catch (err) {
    console.error('Erreur récupération réponses utilisateur:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

export default router;
