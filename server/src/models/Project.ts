import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProject extends Document {
  title: string;
  slug: string;
  domainSlug: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  problemStatement: string;
  estimatedTime: string;
  skills: string[];
  technologies: string[];
  tags: string[];
  thumbnail?: string;
  featured: boolean;
  prerequisites: string[];
  popularity: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    domainSlug: { type: String, required: true, lowercase: true, index: true },
    category: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    problemStatement: { type: String, required: true },
    estimatedTime: { type: String, required: true },
    skills: { type: [String], default: [] },
    technologies: { type: [String], default: [] },
    tags: { type: [String], default: [], index: true },
    thumbnail: { type: String },
    featured: { type: Boolean, default: false },
    prerequisites: { type: [String], default: [] },
    popularity: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
