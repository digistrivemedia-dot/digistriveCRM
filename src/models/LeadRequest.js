import mongoose from 'mongoose';

const LeadRequestSchema = new mongoose.Schema({
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requestedCount: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  notes: {
    type: String,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  reviewNotes: {
    type: String,
  },
  assignedLeads: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
  }],
}, {
  timestamps: true,
});

LeadRequestSchema.index({ requestedBy: 1, status: 1 });
LeadRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.LeadRequest || mongoose.model('LeadRequest', LeadRequestSchema);
