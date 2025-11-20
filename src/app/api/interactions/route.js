import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Interaction from '@/models/Interaction';
import Lead from '@/models/Lead';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      lead: leadId,
      type,
      outcome,
      notes,
      duration,
      followUpDate,
      previousStatus: providedPreviousStatus,
      newStatus: providedNewStatus,
    } = body;

    if (!leadId || !type || !notes) {
      return NextResponse.json(
        { error: 'Lead, type, and notes are required' },
        { status: 400 }
      );
    }

    let query = { _id: leadId };
    if (user.role !== 'admin') {
      query.assignedTo = user.userId;
    }

    const lead = await Lead.findOne(query);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Use provided status values if available (for manual status updates)
    const previousStatus = providedPreviousStatus || lead.status;
    let updateData = {
      lastContactedAt: new Date(),
    };

    if (followUpDate) {
      updateData.followUpDate = new Date(followUpDate);
    }

    // Determine new status
    let newStatus = providedNewStatus;
    if (!newStatus) {
      // Auto-determine status based on outcome
      if (outcome === 'Converted') {
        newStatus = 'Converted';
        updateData.convertedAt = new Date();
      } else if (outcome === 'Follow-up Scheduled') {
        newStatus = 'Follow-up';
      } else if (outcome === 'Not Interested') {
        newStatus = 'Lost';
      } else if (outcome === 'Interested') {
        newStatus = 'In Progress';
      } else if (previousStatus === 'New') {
        newStatus = 'Contacted';
      } else {
        newStatus = previousStatus;
      }
    }

    updateData.status = newStatus;
    await Lead.findByIdAndUpdate(leadId, updateData);

    const interaction = await Interaction.create({
      lead: leadId,
      user: user.userId,
      type,
      outcome,
      notes,
      duration: duration || null,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      previousStatus,
      newStatus,
    });

    const populatedInteraction = await Interaction.findById(interaction._id)
      .populate('user', 'name')
      .populate('lead', 'name');

    return NextResponse.json(populatedInteraction, { status: 201 });
  } catch (error) {
    console.error('Create interaction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    // Check if user has access to this lead
    let query = { _id: leadId };
    if (user.role !== 'admin') {
      query.assignedTo = user.userId;
    }

    const lead = await Lead.findOne(query);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Fetch interactions for this lead
    const interactions = await Interaction.find({ lead: leadId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ interactions });
  } catch (error) {
    console.error('Get interactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}