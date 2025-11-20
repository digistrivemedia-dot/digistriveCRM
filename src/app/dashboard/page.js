'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalLeads: 0,
    convertedLeads: 0,
    pendingLeads: 0,
    followUpsToday: 0,
    conversionRate: 0,
    totalCalls: 0,
  });
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
    fetchDashboardData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, leadsResponse] = await Promise.all([
        fetch('/api/dashboard/stats', { credentials: 'include' }),
        fetch('/api/dashboard/leads', { credentials: 'include' })
      ]);
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }
      
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        setLeads(leadsData.leads);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = statusFilter === 'all' 
    ? leads 
    : leads.filter(lead => lead.status.toLowerCase().replace(/[\s-]/g, '') === statusFilter);

  const handleLeadClick = (leadId) => {
    router.push(`/leads/${leadId}`);
  };

  const getStatusColor = (status) => {
    const colors = {
      'New': 'bg-blue-100 text-blue-800',
      'Contacted': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-purple-100 text-purple-800',
      'Converted': 'bg-green-100 text-green-800',
      'Lost': 'bg-red-100 text-red-800',
      'Follow-up': 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}
              </h1>
              {user?.role !== 'admin' && (
                <Button
                  onClick={() => router.push('/request-leads')}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  📝 Request New Leads
                </Button>
              )}
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Leads</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
                    </div>
                    <div className="ml-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">📊</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Calls</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.totalCalls}</p>
                    </div>
                    <div className="ml-4">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">📞</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Converted</p>
                      <p className="text-2xl font-bold text-green-600">{stats.convertedLeads}</p>
                    </div>
                    <div className="ml-4">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">✅</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.pendingLeads}</p>
                    </div>
                    <div className="ml-4">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">⏳</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Follow-ups Today</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.followUpsToday}</p>
                    </div>
                    <div className="ml-4">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">📅</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conversion Rate */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${stats.conversionRate}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="ml-4 text-lg font-semibold text-green-600">
                    {stats.conversionRate}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Lead Overview */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>My Leads Overview</CardTitle>
                  <div className="flex space-x-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 text-black py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="all">All Leads</option>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="inprogress">In Progress</option>
                      <option value="followup">Follow-up</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/leads')}
                    >
                      Manage Leads
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-blue-600">💡</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>Click on any lead name</strong> to go to the leads page where you can call, update status, and add notes all in one place!
                      </p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lead Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Update
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLeads.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                            {statusFilter === 'all' ? 'No leads assigned to you yet' : `No ${statusFilter} leads found`}
                          </td>
                        </tr>
                      ) : (
                        filteredLeads.map((lead) => (
                          <tr 
                            key={lead._id} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleLeadClick(lead._id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-blue-600">{lead.name}</div>
                                <div className="text-sm text-gray-500">{lead.companyName}</div>
                                <div className="text-xs text-gray-400">
                                  {lead.productInterest} • {lead.source}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{lead.phone}</div>
                              <div className="text-sm text-gray-500">{lead.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                                {lead.status}
                              </span>
                              {lead.priority && (
                                <div className={`text-xs mt-1 ${
                                  lead.priority === 'High' ? 'text-red-600' : 
                                  lead.priority === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                  {lead.priority} Priority
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${lead.leadValue?.toLocaleString() || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(lead.updatedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}