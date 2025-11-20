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
    const { leadIds, assignedTo } = body;

    // Validation
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'Lead IDs array is required' },
        { status: 400 }
      );
    }

    if (!assignedTo) {
      return NextResponse.json(
        { error: 'Assigned user is required' },
        { status: 400 }
      );
    }

    // Verify the assigned user exists
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return NextResponse.json(
        { error: 'Assigned user not found' },
        { status: 404 }
      );
    }

    // Find leads and check for duplicates
    const leads = await Lead.find({ _id: { $in: leadIds } });

    if (leads.length === 0) {
      return NextResponse.json(
        { error: 'No valid leads found' },
        { status: 404 }
      );
    }

    // Separate leads into assignable and already assigned
    const assignableLeads = [];
    const alreadyAssigned = [];

    leads.forEach(lead => {
      if (lead.assignedTo && lead.assignedTo.toString() !== '') {
        alreadyAssigned.push({
          id: lead._id,
          name: lead.name,
          currentlyAssignedTo: lead.assignedTo
        });
      } else {
        assignableLeads.push(lead._id);
      }
    });

    // If all leads are already assigned, return error
    if (assignableLeads.length === 0) {
      return NextResponse.json({
        error: 'All selected leads are already assigned to other users',
        alreadyAssigned: alreadyAssigned,
        success: false
      }, { status: 400 });
    }

    // Assign unassigned leads to the user and create interaction records
    await Lead.updateMany(
      { _id: { $in: assignableLeads } },
      { $set: { assignedTo: assignedTo } }
    );

    // Create interaction records for each assignment
    const interactionPromises = assignableLeads.map(leadId =>
      Interaction.create({
        lead: leadId,
        user: user.userId,
        type: 'Note',
        notes: `Lead assigned to ${assignedUser.name} by admin`,
        previousStatus: 'New',
        newStatus: 'New',
      })
    );

    await Promise.all(interactionPromises);

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${assignableLeads.length} lead(s) to ${assignedUser.name}`,
      assigned: assignableLeads.length,
      skipped: alreadyAssigned.length,
      alreadyAssigned: alreadyAssigned,
      assignedTo: {
        id: assignedUser._id,
        name: assignedUser.name
      }
    });

  } catch (error) {
    console.error('Bulk assign error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
