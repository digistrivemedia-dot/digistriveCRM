import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Product from '@/models/Product';
import Source from '@/models/Source';
import User from '@/models/User';
import { authenticateUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await authenticateUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = parseInt(searchParams.get('skip')) || 0;

    // Get recent leads assigned to this employee
    const leads = await Lead.find({ assignedTo: params.id })
      .populate('source', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Format leads for display
    const formattedLeads = leads.map(lead => ({
      _id: lead._id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      companyName: lead.companyName,
      status: lead.status,
      priority: lead.priority,
      leadValue: lead.leadValue || 0,
      productInterest: lead.productInterest || '',
      source: lead.source?.name || 'Unknown',
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      notes: lead.notes
    }));

    // Get total count for pagination
    const totalCount = await Lead.countDocuments({ assignedTo: params.id });

    return NextResponse.json({ 
      leads: formattedLeads,
      total: totalCount,
      hasMore: skip + leads.length < totalCount
    });
  } catch (error) {
    console.error('Get employee leads error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}