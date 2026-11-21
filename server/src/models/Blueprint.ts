import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IBlueprintPhase {
  phase: string;
  tasks: string[];
  learningObjectives: string[];
  deliverables: string[];
}

export interface IBlueprint extends Document {
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  architecture: string;
  steps: IBlueprintPhase[];
  bestPractices: string[];
  /** Provider model name. Not called `model` because Mongoose Document owns that. */
  providerModel: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlueprintPhaseSchema = new Schema<IBlueprintPhase>(
  {
    phase: { type: String, required: true, trim: true },
    tasks: { type: [String], default: [] },
    learningObjectives: { type: [String], default: [] },
    deliverables: { type: [String], default: [] },
  },
  { _id: false }
);

const BlueprintSchema = new Schema<IBlueprint>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    architecture: { type: String, required: true },
    steps: { type: [BlueprintPhaseSchema], default: [] },
    bestPractices: { type: [String], default: [] },
    // Recorded for provenance; the provider key is never stored.
    providerModel: { type: String, default: '' },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One saved blueprint per learner per project; regeneration replaces it.
BlueprintSchema.index({ userId: 1, projectId: 1 }, { unique: true });

export const Blueprint: Model<IBlueprint> =
  mongoose.models.Blueprint || mongoose.model<IBlueprint>('Blueprint', BlueprintSchema);
