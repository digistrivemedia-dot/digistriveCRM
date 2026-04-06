import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Interaction from '@/models/Interaction';
import { authenticateUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await authenticateUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get all leads assigned to this employee
    const leads = await Lead.find({ assignedTo: params.id });

    // Calculate statistics
    const totalLeads = leads.length;
    const newLeads = leads.filter(lead => lead.status === 'New').length;
    const contactedLeads = leads.filter(lead => lead.status === 'Contacted').length;
    const inProgressLeads = leads.filter(lead => lead.status === 'In Progress').length;
    const convertedLeads = leads.filter(lead => lead.status === 'Converted').length;
    const lostLeads = leads.filter(lead => lead.status === 'Lost').length;
    const followUpLeads = leads.filter(lead => lead.status === 'Follow-up').length;

    // Calculate total calls from Interactions
    const totalCalls = await Interaction.countDocuments({
      lead: { $in: leads.map(lead => lead._id) },
      type: 'Call'
    });

    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

    // Calculate lead values
    const totalValue = leads.reduce((sum, lead) => sum + (lead.leadValue || 0), 0);
    const avgLeadValue = totalLeads > 0 ? Math.round(totalValue / totalLeads) : 0;

    const stats = {
      totalLeads,
      newLeads,
      contactedLeads,
      inProgressLeads,
      convertedLeads,
      lostLeads,
      followUpLeads,
      totalCalls,
      conversionRate: parseFloat(conversionRate),
      avgLeadValue,
      totalValue,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Get employee stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}