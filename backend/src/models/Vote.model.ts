import mongoose, { Schema, Document } from 'mongoose';
import { IVote } from '../types';

export interface IVoteDocument extends IVote, Document {}

const VoteSchema: Schema = new Schema({
  pollId: {
    type: Schema.Types.ObjectId,
    ref: 'Poll',
    required: true,
  },
  studentName: {
    type: String,
    required: true,
    trim: true,
  },
  selectedOption: {
    type: Number,
    required: true,
    min: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});


VoteSchema.index({ pollId: 1, studentName: 1 }, { unique: true });


VoteSchema.index({ pollId: 1, selectedOption: 1 });

export default mongoose.model<IVoteDocument>('Vote', VoteSchema);
