import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import LeadRequest from '@/models/LeadRequest';
import Lead from '@/models/Lead';
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
    const { requestId, action, reviewNotes } = body;

    // Validation
    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Request ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Find the lead request
    const leadRequest = await LeadRequest.findById(requestId).populate('requestedBy', 'name email');

    if (!leadRequest) {
      return NextResponse.json(
        { error: 'Lead request not found' },
        { status: 404 }
      );
    }

    if (leadRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Lead request has already been reviewed' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Find unassigned leads to assign
      const unassignedLeads = await Lead.find({
        assignedTo: null,
      })
      .sort({ createdAt: -1 })
      .limit(leadRequest.requestedCount);

      if (unassignedLeads.length === 0) {
        return NextResponse.json(
          { error: 'No unassigned leads available' },
          { status: 400 }
        );
      }

      const leadIds = unassignedLeads.map(lead => lead._id);

      // Assign leads to the requester
      await Lead.updateMany(
        { _id: { $in: leadIds } },
        { $set: { assignedTo: leadRequest.requestedBy._id } }
      );

      // Create interaction records for assignments
      const interactionPromises = leadIds.map(leadId =>
        Interaction.create({
          lead: leadId,
          user: user.userId,
          type: 'Note',
          notes: `Lead assigned to ${leadRequest.requestedBy.name} via approved lead request`,
          previousStatus: 'New',
          newStatus: 'New',
        })
      );

      await Promise.all(interactionPromises);

      // Update lead request
      leadRequest.status = 'approved';
      leadRequest.reviewedBy = user.userId;
      leadRequest.reviewedAt = new Date();
      leadRequest.reviewNotes = reviewNotes || '';
      leadRequest.assignedLeads = leadIds;
      await leadRequest.save();

      return NextResponse.json({
        success: true,
        message: `Approved and assigned ${unassignedLeads.length} lead(s) to ${leadRequest.requestedBy.name}`,
        assigned: unassignedLeads.length,
        requested: leadRequest.requestedCount,
      });

    } else {
      // Reject the request
      leadRequest.status = 'rejected';
      leadRequest.reviewedBy = user.userId;
      leadRequest.reviewedAt = new Date();
      leadRequest.reviewNotes = reviewNotes || 'Request rejected';
      await leadRequest.save();

      return NextResponse.json({
        success: true,
        message: 'Lead request rejected',
      });
    }

  } catch (error) {
    console.error('Approve/reject lead request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
