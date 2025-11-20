import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import User from '@/models/User';
import Interaction from '@/models/Interaction';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await authenticateUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { leadIds, newAssignedTo } = body;

    // Validation
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'Lead IDs array is required' },
        { status: 400 }
      );
    }

    if (!newAssignedTo) {
      return NextResponse.json(
        { error: 'New assigned user is required' },
        { status: 400 }
      );
    }

    // Verify the new assigned user exists
    const newUser = await User.findById(newAssignedTo);
    if (!newUser) {
      return NextResponse.json(
        { error: 'New assigned user not found' },
        { status: 404 }
      );
    }

    // Find leads to be reassigned
    const leads = await Lead.find({ _id: { $in: leadIds } }).populate('assignedTo', 'name');

    if (leads.length === 0) {
      return NextResponse.json(
        { error: 'No valid leads found' },
        { status: 404 }
      );
    }

    let reassignedCount = 0;

    // Re-assign each lead and create interaction record
    for (const lead of leads) {
      const oldAssignedTo = lead.assignedTo;

      // Update lead assignment
      await Lead.findByIdAndUpdate(lead._id, { assignedTo: newAssignedTo });

      // Create interaction record for reassignment
      await Interaction.create({
        lead: lead._id,
        user: user.userId,
        type: 'Note',
        notes: `Lead reassigned from ${oldAssignedTo?.name || 'Unassigned'} to ${newUser.name} by admin`,
        previousStatus: lead.status,
        newStatus: lead.status,
      });

      reassignedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully reassigned ${reassignedCount} lead(s) to ${newUser.name}`,
      reassigned: reassignedCount,
      assignedTo: {
        id: newUser._id,
        name: newUser.name
      }
    });

  } catch (error) {
    console.error('Reassign error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
