import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Communication from '@/models/Communication';
import Interaction from '@/models/Interaction';
import { authenticateUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get all leads assigned to this user (or all leads for admin)
    let query = {};
    if (user.role !== 'admin') {
      query.assignedTo = new mongoose.Types.ObjectId(user.userId);
    }
    const leads = await Lead.find(query);
    
    // Calculate statistics
    const totalLeads = leads.length;
    const convertedLeads = leads.filter(lead => lead.status === 'Converted').length;
    const pendingLeads = leads.filter(lead => 
      ['New', 'Contacted', 'In Progress'].includes(lead.status)
    ).length;

    // Calculate follow-ups due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const followUpsToday = await Communication.countDocuments({
      leadId: { $in: leads.map(lead => lead._id) },
      followUpRequired: true,
      followUpDate: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

    // Calculate total calls made by this user
    let totalCalls = 0;
    if (user.role !== 'admin') {
      totalCalls = await Interaction.countDocuments({
        user: new mongoose.Types.ObjectId(user.userId),
        type: 'Call',
      });
    } else {
      // For admin, count all calls
      totalCalls = await Interaction.countDocuments({
        type: 'Call',
      });
    }

    const stats = {
      totalLeads,
      convertedLeads,
      pendingLeads,
      followUpsToday,
      conversionRate: parseFloat(conversionRate),
      totalCalls,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}