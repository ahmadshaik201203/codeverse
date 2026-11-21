import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDomain extends Document {
  name: string;
  slug: string;
  description: string;
  category: 'AI' | 'Data' | 'Development' | 'Infrastructure';
  icon?: string;
  skills: string[];
  technologies: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  careerRoles: string[];
}

const DomainSchema = new Schema<IDomain>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['AI', 'Data', 'Development', 'Infrastructure'],
      required: true,
    },
    icon: { type: String }, // Can store a string reference to a Lucide icon name
    skills: { type: [String], default: [] },
    technologies: { type: [String], default: [] },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'All Levels',
    },
    careerRoles: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Domain: Model<IDomain> =
  mongoose.models.Domain || mongoose.model<IDomain>('Domain', DomainSchema);
