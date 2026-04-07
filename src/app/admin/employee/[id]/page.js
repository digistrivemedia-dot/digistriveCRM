'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const statusConfig = {
  'New':         'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  'Contacted':   'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  'In Progress': 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  'Converted':   'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  'Lost':        'bg-red-50 text-red-700 ring-1 ring-red-200',
  'Follow-up':   'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
};

const StatCard = ({ label, value, icon, color }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function EmployeeDetailPage() {
  const [employee, setEmployee] = useState(null);
  const [stats, setStats] = useState({
    totalLeads: 0, newLeads: 0, contactedLeads: 0, inProgressLeads: 0,
    convertedLeads: 0, lostLeads: 0, followUpLeads: 0,
    totalCalls: 0, conversionRate: 0, avgLeadValue: 0, totalValue: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  useEffect(() => { fetchEmployeeData(); }, [params.id]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const [employeeRes, statsRes, activityRes, leadsRes] = await Promise.all([
        fetch(`/api/admin/employee/${params.id}`, { credentials: 'include' }),
        fetch(`/api/admin/employee/${params.id}/stats`, { credentials: 'include' }),
        fetch(`/api/admin/employee/${params.id}/activity`, { credentials: 'include' }),
        fetch(`/api/admin/employee/${params.id}/leads?limit=10`, { credentials: 'include' }),
      ]);
      if (employeeRes.ok) setEmployee((await employeeRes.json()).employee);
      if (statsRes.ok) setStats((await statsRes.json()).stats);
      if (activityRes.ok) setRecentActivity((await activityRes.json()).activity);
      if (leadsRes.ok) setLeads((await leadsRes.json()).leads);
    } catch {} finally { setLoading(false); }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Loading...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!employee) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Employee not found</h2>
            <Button variant="outline" onClick={() => router.push('/admin')}>Back to Admin</Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const statusBreakdown = [
    { status: 'New',         count: stats.newLeads,       color: 'bg-blue-500' },
    { status: 'Contacted',   count: stats.contactedLeads, color: 'bg-amber-500' },
    { status: 'In Progress', count: stats.inProgressLeads,color: 'bg-violet-500' },
    { status: 'Follow-up',   count: stats.followUpLeads,  color: 'bg-orange-500' },
    { status: 'Converted',   count: stats.convertedLeads, color: 'bg-emerald-500' },
    { status: 'Lost',        count: stats.lostLeads,      color: 'bg-red-500' },
  ];
  const maxStatus = Math.max(...statusBreakdown.map(s => s.count), 1);

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-blue-700 text-xl font-bold uppercase">{employee.name?.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{employee.name}</h1>
                <p className="text-slate-500 text-sm">{employee.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${employee.role === 'admin' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'}`}>
                    {employee.role === 'admin' ? 'Admin' : 'Employee'}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${employee.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}>
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push('/admin')}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Admin
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
            <StatCard label="Total Leads" value={stats.totalLeads} color="bg-blue-50 text-blue-600"
              icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            <StatCard label="Converted" value={stats.convertedLeads} color="bg-emerald-50 text-emerald-600"
              icon="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <StatCard label="Total Calls" value={stats.totalCalls} color="bg-violet-50 text-violet-600"
              icon="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            <StatCard label="Conversion Rate" value={`${stats.conversionRate}%`} color="bg-blue-50 text-blue-600"
              icon="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-7">
            {/* Status Breakdown */}
            <Card>
              <CardHeader><CardTitle>Lead Status Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statusBreakdown.map((item) => (
                    <div key={item.status} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-24 font-medium">{item.status}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className={`${item.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.round((item.count / maxStatus) * 100)}%` }} />
                      </div>
                      <span className="text-sm font-bold text-slate-800 w-6 text-right tabular-nums">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader><CardTitle>Performance Metrics</CardTitle></CardHeader>
              <CardContent>
                <div className="divide-y divide-slate-100">
                  {[
                    { label: 'Average Lead Value', value: `₹${stats.avgLeadValue?.toLocaleString()}` },
                    { label: 'Total Pipeline Value', value: `₹${stats.totalValue?.toLocaleString()}` },
                    { label: 'Calls per Lead', value: stats.totalLeads > 0 ? (stats.totalCalls / stats.totalLeads).toFixed(1) : '0.0' },
                    { label: 'Member Since', value: new Date(employee.createdAt).toLocaleDateString() },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-3">
                      <span className="text-sm text-slate-600 font-medium">{item.label}</span>
                      <span className="text-sm font-bold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                      <svg className="w-4.5 h-4.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 text-sm">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800">{activity.description}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{new Date(activity.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Leads */}
            <Card>
              <CardHeader><CardTitle>Recent Leads</CardTitle></CardHeader>
              <CardContent>
                {leads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                      <svg className="w-4.5 h-4.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 text-sm">No leads assigned</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leads.map((lead) => (
                      <div key={lead._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{lead.name}</p>
                          <p className="text-xs text-slate-500">{lead.phone}</p>
                          <p className="text-xs text-slate-400 mt-0.5 tabular-nums">₹{lead.leadValue?.toLocaleString()} · {new Date(lead.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`ml-3 flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig[lead.status] || 'bg-slate-100 text-slate-600'}`}>
                          {lead.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
