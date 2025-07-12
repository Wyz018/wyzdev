import express from 'express';
import Post from '../models/post.js';
import Reply from '../models/reply.js';
import User from '../models/user.js';
import Notification from '../models/notification.js';
import { verifyToken } from './middleware/authMiddleware.js';

const router = express.Router();

// Créer un nouveau post
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { title, content, code, category, tags } = req.body;
    
    // Validation
    if (!title || !content || !category) {
      return res.status(400).json({ msg: 'Titre, contenu et catégorie sont requis' });
    }

    const newPost = new Post({
      title,
      content,
      code,
      category,
      author: req.user._id,
      tags: tags || []
    });

    await newPost.save();

    // Ajouter le post à la liste des posts de l'utilisateur
    await User.findByIdAndUpdate(req.user._id, {
      $push: { posts: newPost._id }
    });

    // Populate author info before sending response
    await newPost.populate('author', 'username email profilePic');

    res.status(201).json({
      msg: 'Post créé avec succès',
      post: newPost
    });
  } catch (err) {
    console.error('Erreur création post:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// Obtenir tous les posts avec pagination et filtres
router.get('/all', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, sortBy = 'createdAt' } = req.query;
    const skip = (page - 1) * limit;

    // Construire la requête
    let query = {};
    
    if (category && category !== 'Tous') {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Options de tri
    let sortOptions = {};
    switch (sortBy) {
      case 'recent':
        sortOptions = { createdAt: -1 };
        break;
      case 'popular':
        sortOptions = { views: -1 };
        break;
      case 'mostReplies':
        sortOptions = { 'replies.length': -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const posts = await Post.find(query)
      .populate('author', 'username email profilePic')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Ajouter le nombre de réponses pour chaque post
    const postsWithReplyCount = posts.map(post => ({
      ...post,
      replyCount: post.replies ? post.replies.length : 0
    }));

    const totalPosts = await Post.countDocuments(query);

    res.json({
      posts: postsWithReplyCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts
    });
  } catch (err) {
    console.error('Erreur récupération posts:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// Obtenir un post spécifique avec ses réponses
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('author', 'username email profilePic bio reputation')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username email profilePic'
        }
      });

    if (!post) {
      return res.status(404).json({ msg: 'Post non trouvé' });
    }

    // Incrémenter les vues
    await post.incrementViews();

    res.json(post);
  } catch (err) {
    console.error('Erreur récupération post:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// Mettre à jour un post
router.put('/:postId', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content, code, category, tags } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ msg: 'Post non trouvé' });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Non autorisé' });
    }

    // Mettre à jour les champs
    if (title) post.title = title;
    if (content) post.content = content;
    if (code !== undefined) post.code = code;
    if (category) post.category = category;
    if (tags) post.tags = tags;

    await post.save();

    res.json({ msg: 'Post mis à jour', post });
  } catch (err) {
    console.error('Erreur mise à jour post:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// Supprimer un post
router.delete('/:postId', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ msg: 'Post non trouvé' });
    }

    // Vérifier que l'utilisateur est l'auteur ou admin
    if (post.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ msg: 'Non autorisé' });
    }

    // Supprimer toutes les réponses associées
    await Reply.deleteMany({ post: postId });

    // Retirer le post de la liste des posts de l'utilisateur
    await User.findByIdAndUpdate(post.author, {
      $pull: { posts: postId }
    });

    await post.deleteOne();

    res.json({ msg: 'Post supprimé avec succès' });
  } catch (err) {
    console.error('Erreur suppression post:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// Liker/Unliker un post
router.post('/:postId/like', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId).populate('author', 'username');

    if (!post) {
      return res.status(404).json({ msg: 'Post non trouvé' });
    }

    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(userId);
      
      // Créer une notification si ce n'est pas l'auteur qui like son propre post
      if (post.author._id.toString() !== userId.toString()) {
        // Augmenter la réputation de l'auteur
        await User.findByIdAndUpdate(post.author._id, {
          $inc: { reputation: 1 }
        });

        // Créer la notification
        await Notification.create({
          recipient: post.author._id,
          sender: userId,
          type: 'like_post',
          post: post._id,
          message: `${req.user.username} a aimé votre post "${post.title}"`
        });
      }
    }

    await post.save();

    res.json({ 
      msg: likeIndex > -1 ? 'Like retiré' : 'Post liké',
      likes: post.likes.length 
    });
  } catch (err) {
    console.error('Erreur like post:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// Obtenir les posts d'un utilisateur
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: userId })
      .populate('author', 'username email profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalPosts = await Post.countDocuments({ author: userId });

    res.json({
      posts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts
    });
  } catch (err) {
    console.error('Erreur récupération posts utilisateur:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// Marquer un post comme résolu/fermé
router.put('/:postId/close', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ msg: 'Post non trouvé' });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Non autorisé' });
    }

    // Basculer l'état résolu/fermé
    post.isClosed = !post.isClosed;
    await post.save();

    res.json({ 
      msg: post.isClosed ? 'Post marqué comme résolu' : 'Post réouvert',
      isClosed: post.isClosed 
    });
  } catch (err) {
    console.error('Erreur fermeture post:', err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

export default router;
