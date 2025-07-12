import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    required: true,
    enum: ['like_post', 'like_reply', 'reply', 'mention']
  },
  post: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post' 
  },
  reply: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Reply' 
  },
  message: { 
    type: String, 
    required: true 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index pour améliorer les performances des requêtes
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
