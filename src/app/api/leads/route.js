import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Product from '@/models/Product';
import Source from '@/models/Source';
import User from '@/models/User';
import { authenticateUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;
    let query = {};

    if (user.role !== 'admin') {
      // Callers only see their assigned leads
      query.assignedTo = user.userId;
    } else if (assignedTo && assignedTo !== 'all') {
      // Admin filtering by specific user or unassigned
      if (assignedTo === 'unassigned') {
        query.assignedTo = null;
      } else {
        query.assignedTo = assignedTo;
      }
    }
    // If admin and assignedTo is 'all' or not specified, show all leads

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')

      .populate('source', 'name')
      .populate('createdBy', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Lead.countDocuments(query);

    return NextResponse.json({
      leads,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Get leads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      name, phone, email, whatsappNumber, address, companyName,
      productInterest, source, leadValue, assignedTo, priority, notes,
    } = body;

    if (!name || !phone || !productInterest || !source) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    // Determine who the lead should be assigned to
    let finalAssignedTo = assignedTo;
    if (user.role !== 'admin') {
      // Non-admin users (callers) always assign leads to themselves
      finalAssignedTo = user.userId;
    } else if (!assignedTo) {
      // Admin with no assignedTo specified = leave unassigned (null)
      finalAssignedTo = null;
    }

    const lead = await Lead.create({
      name, phone, email, whatsappNumber, address, companyName,
      productInterest, source, leadValue: leadValue !== '' && leadValue != null ? parseFloat(leadValue) : undefined,
      assignedTo: finalAssignedTo, priority: priority || 'Medium',
      notes, createdBy: user.userId,
    });

    const populatedLead = await Lead.findById(lead._id)
      .populate('assignedTo', 'name email')

      .populate('source', 'name')
      .populate('createdBy', 'name');

    return NextResponse.json(populatedLead, { status: 201 });
  } catch (error) {
    console.error('Create lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}