import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt: Date;
}

export interface ISkillMetric {
  name: string;
  score: number; // 0 - 100
}

export type UserRole = 'student' | 'faculty' | 'admin';

export interface IUser extends Document {
  fullName: string;
  username?: string;
  email: string;
  password?: string;
  authProvider?: 'local' | 'google' | 'phone';
  firebaseUid?: string;
  role: UserRole;
  avatarUrl?: string;
  college: string;
  department: string;
  year: string;
  preferredLanguage: string;
  onboarded: boolean;
  careerGoal?: string;
  experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | '';
  knownTechnologies?: string[];
  learningLanguage?: string;
  // Portfolio & Gamification
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioWebsite?: string;
  xp: number;
  level: number;
  streak: number;
  badges: IBadge[];
  skills: ISkillMetric[];
  completedProjects: mongoose.Types.ObjectId[];
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: '' },
    authProvider: { type: String, enum: ['local', 'google', 'phone'], default: 'local' },
    // Set only after a provider ID token has been verified server-side.
    firebaseUid: { type: String, unique: true, sparse: true, index: true },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      default: 'student',
      index: true,
    },
    avatarUrl: { type: String, default: '' },
    college: { type: String, trim: true, default: 'Engineering College' },
    department: { type: String, trim: true, default: 'Computer Science' },
    year: { type: String, trim: true, default: '1st Year' },
    preferredLanguage: { type: String, required: true, default: 'English' },
    onboarded: { type: Boolean, default: false },
    careerGoal: { type: String, default: '' },
    experienceLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', ''],
      default: '',
    },
    knownTechnologies: { type: [String], default: [] },
    learningLanguage: { type: String, default: '' },
    username: { type: String, sparse: true, trim: true, lowercase: true },
    bio: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    portfolioWebsite: { type: String, default: '' },
    // New accounts start at zero. XP only moves through the XP ledger.
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    badges: {
      type: [
        {
          id: { type: String, required: true },
          name: { type: String, required: true },
          icon: { type: String, default: 'Award' },
          description: { type: String, default: '' },
          unlockedAt: { type: Date, default: Date.now },
        },
      ],
      // Badges are earned, never granted at signup.
      default: [],
    },
    skills: {
      type: [
        {
          name: { type: String, required: true },
          score: { type: Number, required: true, default: 50 },
        },
      ],
      // Skill scores are earned from verified work, never seeded.
      default: [],
    },
    completedProjects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
  },
  { timestamps: true }
);

// Hash password & generate username before saving
UserSchema.pre<IUser>('save', async function () {
  if (!this.username) {
    const base = (this.fullName || (this.email ? this.email.split('@')[0] : ''))
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    this.username = `${base || 'coder'}${Math.floor(100 + Math.random() * 900)}`;
  }
  if (!this.password || !this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
