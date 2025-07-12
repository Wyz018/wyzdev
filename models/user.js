import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: '' },
  preferredLanguages: { 
    type: [String], 
    default: [],
    enum: ['JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'TypeScript', 'Swift', 'Kotlin', 'HTML/CSS', 'SQL', 'R', 'Dart']
  },
  bio: { type: String, default: '', maxlength: 500 },
  joinDate: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model('User', userSchema);
