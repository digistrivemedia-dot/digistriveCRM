import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import LeadRequest from '@/models/LeadRequest';
import Lead from '@/models/Lead';
import { authenticateUser } from '@/lib/auth';

// GET - Fetch lead requests
export async function GET(request) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    let query = {};

    // Non-admin users only see their own requests
    if (user.role !== 'admin') {
      query.requestedBy = user.userId;
    }

    // Filter by status if specified
    if (status !== 'all') {
      query.status = status;
    }

    const requests = await LeadRequest.find(query)
      .populate('requestedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('assignedLeads', 'name phone status')
      .sort({ createdAt: -1 });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Get lead requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new lead request
export async function POST(request) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { requestedCount, notes } = body;

    // Validation
    if (!requestedCount || requestedCount < 1) {
      return NextResponse.json(
        { error: 'Valid request count is required' },
        { status: 400 }
      );
    }

    // Create lead request
    const leadRequest = await LeadRequest.create({
      requestedBy: user.userId,
      requestedCount,
      notes: notes || '',
      status: 'pending',
    });

    const populatedRequest = await LeadRequest.findById(leadRequest._id)
      .populate('requestedBy', 'name email');

    return NextResponse.json({
      success: true,
      message: 'Lead request submitted successfully',
      request: populatedRequest,
    }, { status: 201 });

  } catch (error) {
    console.error('Create lead request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
