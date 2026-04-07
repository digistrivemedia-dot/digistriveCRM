import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  whatsappNumber: {
    type: String,
  },
  address: {
    type: String,
  },
  companyName: {
    type: String,
  },
  productInterest: {
    type: String,
    required: true,
  },
  source: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Source',
    required: true,
  },
  leadValue: {
    type: Number,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Unassigned by default
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'In Progress', 'Converted', 'Lost', 'Follow-up'],
    default: 'New',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  notes: {
    type: String,
  },
  followUpDate: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastContactedAt: {
    type: Date,
  },
  convertedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

LeadSchema.index({ assignedTo: 1, status: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ followUpDate: 1 });

export default mongoose.models.Lead || mongoose.model('Lead', LeadSchema);