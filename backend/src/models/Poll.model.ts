import mongoose, { Schema, Document } from 'mongoose';
import { IPoll } from '../types';

export interface IPollDocument extends IPoll, Document { }

const PollSchema: Schema = new Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (v: string[]) => v.length >= 2 && v.length <= 4,
      message: 'Poll must have between 2 and 4 options',
    },
  },
  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
  },
  timerDuration: {
    type: Number,
    required: true,
    min: 10,
    max: 300,
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


PollSchema.index({ status: 1, startedAt: -1 });

export default mongoose.model<IPollDocument>('Poll', PollSchema);
