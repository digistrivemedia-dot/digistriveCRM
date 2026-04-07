import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { authenticateUser } from '@/lib/auth';

function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Wrap in quotes if contains comma, newline, or double-quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toRow(cells) {
  return cells.map(escapeCSV).join(',');
}

export async function GET(request) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query = {};

    // Role-based filter
    if (user.role !== 'admin') {
      query.assignedTo = user.userId;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { phone:       { $regex: search, $options: 'i' } },
        { email:       { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .populate('source', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // CSV header
    const headers = [
      'Name', 'Phone', 'Email', 'Company', 'Product Interest',
      'Source', 'Lead Value (₹)', 'Status', 'Priority',
      'Assigned To', 'Follow-up Date', 'Notes', 'Created At',
    ];

    const rows = [toRow(headers)];

    for (const lead of leads) {
      rows.push(toRow([
        lead.name,
        lead.phone,
        lead.email || '',
        lead.companyName || '',
        lead.productInterest || '',
        lead.source?.name || '',
        lead.leadValue != null ? lead.leadValue : '',
        lead.status,
        lead.priority,
        lead.assignedTo?.name || 'Unassigned',
        lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString('en-IN') : '',
        lead.notes || '',
        new Date(lead.createdAt).toLocaleDateString('en-IN'),
      ]));
    }

    const csvContent = rows.join('\n');
    const fileName = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed. Please try again.' }, { status: 500 });
  }
}
