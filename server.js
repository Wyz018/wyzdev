// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import userRoutesNew from './routes/userRoutes.js';
import postRoutes from './routes/posts.js';
import replyRoutes from './routes/replies.js';
import notificationRoutes from './routes/notifications.js';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config();  // une seule fois, juste après l'import

// Récupère l'URL MongoDB depuis les variables d'environnement ou utilise une valeur par défaut
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/auth-panel';

const app = express();
const PORT = process.env.PORT || 5001;


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for profile pictures
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Serve frontend files
app.use(express.static('frontend'));

// Routes
app.get('/api', (req, res) => {
  res.json({ 
    message: '✅ API WyzDev en ligne !',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      users: '/api/users',
      posts: '/api/posts',
      replies: '/api/replies'
    }
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// User profile routes (ancienne route pour compatibilité)
app.use('/api/user', userRoutes);

// New user routes with public profiles
app.use('/api/users', userRoutesNew);

// Forum routes
app.use('/api/posts', postRoutes);
app.use('/api/replies', replyRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// MongoDB connection
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/auth-panel';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ Connecté à MongoDB');
    
    // Create text indexes for search functionality
    mongoose.connection.db.collection('posts').createIndex(
      { title: 'text', content: 'text' },
      { default_language: 'french' },
      (err) => {
        if (err && err.code !== 85) { // 85 = index already exists
          console.error('Erreur création index posts:', err);
        }
      }
    );
    
    // Start server after DB connection
    app.listen(PORT, () => {
      console.log(`✅ Backend WyzDev lancé sur le port ${PORT}`);
      console.log(`📍 API disponible sur http://localhost:${PORT}/api`);
      console.log(`🌐 Frontend disponible sur http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Erreur de connexion MongoDB:', error);
    process.exit(1);
  });

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route non trouvée',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Une erreur est survenue!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

