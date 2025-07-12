import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  code: {
    type: String,
    maxlength: 10000
  },
  category: {
    type: String,
    required: true,
    enum: ['JavaScript', 'Python', 'Java', 'C++', 'SQL', 'Web Dev', 'Mobile', 'Autre']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reply'
  }],
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isClosed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour la recherche
postSchema.index({ title: 'text', content: 'text' });

// Middleware pour mettre à jour updatedAt
postSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Méthode virtuelle pour obtenir le nombre de réponses
postSchema.virtual('replyCount').get(function() {
  return this.replies ? this.replies.length : 0;
});

// Méthode pour incrémenter les vues
postSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save();
};

const Post = mongoose.model('Post', postSchema);

export default Post;
