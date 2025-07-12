import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 3000
  },
  code: {
    type: String,
    maxlength: 5000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  parentReply: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reply',
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isAccepted: {
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
  },
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }]
});

// Middleware pour mettre à jour updatedAt
replySchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.updatedAt = Date.now();
  }
  next();
});

// Méthode pour ajouter un like
replySchema.methods.toggleLike = async function(userId) {
  const index = this.likes.indexOf(userId);
  if (index > -1) {
    this.likes.splice(index, 1);
  } else {
    this.likes.push(userId);
  }
  return this.save();
};

const Reply = mongoose.model('Reply', replySchema);

export default Reply;
