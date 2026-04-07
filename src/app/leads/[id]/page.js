'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function LeadDetailPage() {
  const [lead, setLead] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const params = useParams();

  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leads/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setLead(data.lead);
        setInteractions(data.interactions);
      } else {
        router.push('/leads');
      }
    } catch (error) {
      console.error('Error fetching lead:', error);
      router.push('/leads');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  const fetchAllLeads = useCallback(async () => {
    try {
      setLeadsLoading(true);
      const response = await fetch('/api/leads?limit=100', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAllLeads(data.leads);
      }
    } catch (error) {
      console.error('Error fetching all leads:', error);
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  const getCurrentLeadIndex = useCallback(() => {
    return allLeads.findIndex(lead => lead._id === params.id);
  }, [allLeads, params.id]);

  const getPreviousLead = useCallback(() => {
    const currentIndex = getCurrentLeadIndex();
    if (currentIndex > 0) {
      return allLeads[currentIndex - 1];
    }
    return null;
  }, [allLeads, getCurrentLeadIndex]);

  const getNextLead = useCallback(() => {
    const currentIndex = getCurrentLeadIndex();
    if (currentIndex < allLeads.length - 1) {
      return allLeads[currentIndex + 1];
    }
    return null;
  }, [allLeads, getCurrentLeadIndex]);

  const handlePreviousLead = useCallback(() => {
    const previousLead = getPreviousLead();
    if (previousLead) {
      router.push(`/leads/${previousLead._id}`);
    }
  }, [getPreviousLead, router]);

  const handleNextLead = useCallback(() => {
    const nextLead = getNextLead();
    if (nextLead) {
      router.push(`/leads/${nextLead._id}`);
    }
  }, [getNextLead, router]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchLead();
    fetchAllLeads();
  }, [params.id, fetchLead, fetchAllLeads]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle if no modal is open and not in an input field
      if (editing || showInteractionModal || showStatusModal ||
          e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' ||
          e.target.tagName === 'SELECT') {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePreviousLead();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextLead();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [editing, showInteractionModal, showStatusModal, handlePreviousLead, handleNextLead]);

  const handleUpdateLead = async (updatedData) => {
    try {
      const response = await fetch(`/api/leads/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        const updatedLead = await response.json();
        setLead(updatedLead);
        setEditing(false);
      } else {
        alert('Failed to update lead');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const handleDeleteLead = async () => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const response = await fetch(`/api/leads/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/leads');
      } else {
        alert('Failed to delete lead');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'New':         'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
      'Contacted':   'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      'In Progress': 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
      'Converted':   'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      'Lost':        'bg-red-50 text-red-700 ring-1 ring-red-200',
      'Follow-up':   'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    };
    return colors[status] || 'bg-slate-50 text-slate-700 ring-1 ring-slate-200';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low':    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      'Medium': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      'High':   'bg-red-50 text-red-700 ring-1 ring-red-200',
    };
    return colors[priority] || 'bg-slate-50 text-slate-700 ring-1 ring-slate-200';
  };

  const handleLeadNavigation = (leadId) => {
    if (leadId !== params.id) {
      router.push(`/leads/${leadId}`);
    }
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Loading lead...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!lead) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-slate-900">Lead not found</h2>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex">
          {/* Sidebar */}
          <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block lg:w-72 bg-white border-r border-slate-200 h-screen overflow-y-auto fixed lg:sticky top-0 z-40`}>
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">All Leads</h2>
                <button className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer" onClick={() => setSidebarOpen(false)}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">{allLeads.length} leads total</p>
            </div>
            
            <div className="p-2">
              {leadsLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="space-y-1">
                  {allLeads.map((leadItem) => (
                    <div
                      key={leadItem._id}
                      onClick={() => handleLeadNavigation(leadItem._id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        leadItem._id === params.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            leadItem._id === params.id ? 'text-indigo-900' : 'text-gray-900'
                          }`}>
                            {leadItem.name}
                          </p>
                          {leadItem.companyName && (
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {leadItem.companyName}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{leadItem.phone}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(leadItem.status)}`}>
                          {leadItem.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          ₹{leadItem.leadValue?.toLocaleString() || '0'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(leadItem.priority)}`}>
                          {leadItem.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 lg:ml-0">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <div className="px-4 py-6 sm:px-0">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="lg:hidden mr-3"
                      onClick={() => setSidebarOpen(true)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                      Leads
                    </Button>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreviousLead}
                            disabled={!getPreviousLead() || leadsLoading}
                            className="px-2 py-1"
                          >
                            ← Previous
                          </Button>
                          <span className="text-sm text-gray-500" title="Use arrow keys to navigate">
                            {getCurrentLeadIndex() + 1} of {allLeads.length}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextLead}
                            disabled={!getNextLead() || leadsLoading}
                            className="px-2 py-1"
                          >
                            Next →
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-600">{lead.companyName}</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/leads')}
                    >
                      Back to Leads
                    </Button>
                    {!editing && user?.role === 'admin' && (
                      <Button onClick={() => setEditing(true)}>
                        Edit Lead
                      </Button>
                    )}
                    <Button
                      variant="success"
                      onClick={() => setShowInteractionModal(true)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      Add Interaction
                    </Button>
                    {user?.role === 'admin' && (
                      <Button variant="danger" onClick={handleDeleteLead}>
                        Delete Lead
                      </Button>
                    )}
                  </div>
                </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lead Information */}
              <div className="lg:col-span-2">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Lead Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editing ? (
                      <EditLeadForm
                        lead={lead}
                        onSave={handleUpdateLead}
                        onCancel={() => setEditing(false)}
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                          <div className="space-y-2 text-sm">
                            <div><strong>Phone:</strong> {lead.phone}</div>
                            {lead.email && <div><strong>Email:</strong> {lead.email}</div>}
                            {lead.whatsappNumber && <div><strong>WhatsApp:</strong> {lead.whatsappNumber}</div>}
                            {lead.address && <div><strong>Address:</strong> {lead.address}</div>}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Business Information</h4>
                          <div className="space-y-2 text-sm">
                            <div><strong>Product Interest:</strong> {lead.productInterest?.name}</div>
                            <div><strong>Source:</strong> {lead.source?.name}</div>
                            <div><strong>Lead Value:</strong> ₹{lead.leadValue?.toLocaleString()}</div>
                            <div><strong>Assigned To:</strong> {lead.assignedTo?.name}</div>
                            <div className="flex items-center justify-between">
                              <div>
                                <strong>Status:</strong>{' '}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ml-1 ${getStatusColor(lead.status)}`}>
                                  {lead.status}
                                </span>
                              </div>
                              <button
                                onClick={() => setShowStatusModal(true)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                              >
                                Update Status
                              </button>
                            </div>
                            <div>
                              <strong>Priority:</strong>{' '}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ml-1 ${getPriorityColor(lead.priority)}`}>
                                {lead.priority}
                              </span>
                            </div>
                            {lead.followUpDate && (
                              <div className="md:col-span-2 bg-orange-50 p-3 rounded-lg border border-orange-200">
                                <strong className="text-orange-800">Follow-up Scheduled:</strong>{' '}
                                <span className="text-orange-900 font-medium">
                                  {new Date(lead.followUpDate).toLocaleString('en-US', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {lead.notes && (
                          <div className="md:col-span-2">
                            <h4 className="font-medium text-gray-900 mb-3">Notes</h4>
                            <p className="text-sm text-gray-600">{lead.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Communication History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Communication History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {interactions.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No interactions recorded</p>
                      ) : (
                        interactions.map((interaction) => (
                          <div key={interaction._id} className="border-l-4 border-blue-300 pl-4 py-2 bg-slate-50/50 rounded-r-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{interaction.type}</span>
                                  {interaction.outcome && (
                                    <span className="text-sm text-gray-600">- {interaction.outcome}</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{interaction.notes}</p>
                                <div className="text-xs text-gray-500 mt-2">
                                  By {interaction.user?.name} on{' '}
                                  {new Date(interaction.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button
                        variant="success"
                        className="w-full"
                        onClick={() => window.open(`tel:${lead.phone}`)}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                        Call {lead.phone}
                      </Button>
                      {lead.email && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => window.open(`mailto:${lead.email}`)}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                          Send Email
                        </Button>
                      )}
                      {lead.whatsappNumber && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => window.open(`https://wa.me/${lead.whatsappNumber}`)}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.16 2.27.293 3.423.406 1.15.112 1.945.96 2.57 1.938.1.157.19.32.27.49.094.2.27.355.483.355.227 0 .409-.155.504-.36.082-.176.162-.354.25-.53.625-.967 1.42-1.815 2.553-1.932a43.47 43.47 0 003.423-.406c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                          WhatsApp
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Notes Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Recent Notes</span>
                      <span className="text-sm font-normal text-gray-500">
                        {interactions.length} total
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {interactions.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No notes recorded</p>
                      ) : (
                        interactions.slice(0, 10).map((interaction) => (
                          <div key={interaction._id} className="border-l-2 border-gray-200 pl-3 py-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xs font-medium text-gray-900 capitalize">
                                    {interaction.type}
                                  </span>
                                  {interaction.outcome && (
                                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                      {interaction.outcome}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 mb-2 overflow-hidden" style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical'
                                }}>
                                  {interaction.notes}
                                </p>
                                <div className="text-xs text-gray-500">
                                  {interaction.user?.name} • {new Date(interaction.createdAt).toLocaleDateString()} at{' '}
                                  {new Date(interaction.createdAt).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {interactions.length > 10 && (
                        <div className="text-center pt-3 border-t">
                          <p className="text-sm text-gray-500">
                            Showing 10 of {interactions.length} notes
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Add Interaction Modal */}
        <AddInteractionModal
          isOpen={showInteractionModal}
          onClose={() => setShowInteractionModal(false)}
          leadId={params.id}
          currentLead={lead}
          onSuccess={() => {
            setShowInteractionModal(false);
            fetchLead();
          }}
        />

        {/* Status Update Modal */}
        <StatusUpdateModal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          lead={lead}
          onSuccess={() => {
            setShowStatusModal(false);
            fetchLead();
          }}
        />

        </div>
      </div>
    </ProtectedRoute>
  );
}

// Edit Lead Form Component
function EditLeadForm({ lead, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: lead.name || '',
    phone: lead.phone || '',
    email: lead.email || '',
    whatsappNumber: lead.whatsappNumber || '',
    address: lead.address || '',
    companyName: lead.companyName || '',
    leadValue: lead.leadValue || '',
    status: lead.status || 'New',
    priority: lead.priority || 'Medium',
    notes: lead.notes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name</label>
          <input
            type="text"
            name="name"
            required
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            value={formData.name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label>
          <input
            type="tel"
            name="phone"
            required
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
          <input
            type="email"
            name="email"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">WhatsApp</label>
          <input
            type="text"
            name="whatsappNumber"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            value={formData.whatsappNumber}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company</label>
          <input
            type="text"
            name="companyName"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            value={formData.companyName}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lead Value</label>
          <input
            type="number"
            name="leadValue"
            min="0"
            step="0.01"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            value={formData.leadValue}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
          <select
            name="status"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="In Progress">In Progress</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
            <option value="Follow-up">Follow-up</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
          <select
            name="priority"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address</label>
        <input
          type="text"
          name="address"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          value={formData.address}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
        <textarea
          name="notes"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          value={formData.notes}
          onChange={handleChange}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </form>
  );
}

// Add Interaction Modal Component
function AddInteractionModal({ isOpen, onClose, leadId, onSuccess, currentLead }) {
  const [formData, setFormData] = useState({
    type: 'Call',
    outcome: '',
    notes: '',
    duration: '',
    followUpDate: '',
    leadStatus: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentLead) {
      setFormData(prev => ({
        ...prev,
        leadStatus: currentLead.status || 'New',
        followUpDate: new Date().toISOString().slice(0, 16) // Today's date and current time
      }));
    }
  }, [isOpen, currentLead]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Add interaction
      const interactionResponse = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          outcome: formData.outcome,
          notes: formData.notes,
          duration: formData.duration ? parseInt(formData.duration) : null,
          followUpDate: formData.followUpDate || null,
          lead: leadId,
        }),
      });

      if (!interactionResponse.ok) {
        throw new Error('Failed to add interaction');
      }

      // Update lead status if it has changed
      if (formData.leadStatus !== currentLead?.status) {
        const statusResponse = await fetch(`/api/leads/${leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            status: formData.leadStatus,
          }),
        });

        if (!statusResponse.ok) {
          throw new Error('Failed to update lead status');
        }
      }

      onSuccess();
      setFormData({
        type: 'Call',
        outcome: '',
        notes: '',
        duration: '',
        followUpDate: new Date().toISOString().slice(0, 16),
        leadStatus: currentLead?.status || 'New',
      });
    } catch (error) {
      alert(error.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Interaction">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type</label>
            <select
              name="type"
              required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="Call">Call</option>
              <option value="Email">Email</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Meeting">Meeting</option>
              <option value="Note">Note</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lead Status</label>
            <select
              name="leadStatus"
              required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
              value={formData.leadStatus}
              onChange={handleChange}
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="In Progress">In Progress</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Outcome</label>
          <select
            name="outcome"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            value={formData.outcome}
            onChange={handleChange}
          >
            <option value="">Select outcome</option>
            <option value="Interested">Interested</option>
            <option value="Not Interested">Not Interested</option>
            <option value="Call Back Later">Call Back Later</option>
            <option value="No Answer">No Answer</option>
            <option value="Converted">Converted</option>
            <option value="Follow-up Scheduled">Follow-up Scheduled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
          <textarea
            name="notes"
            required
            rows={3}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Describe the interaction..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Duration (minutes)
            </label>
            <input
              type="number"
              name="duration"
              min="0"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
              value={formData.duration}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Follow-up Date & Time
            </label>
            <input
              type="datetime-local"
              name="followUpDate"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
              value={formData.followUpDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Interaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Status Update Modal Component
function StatusUpdateModal({ isOpen, onClose, lead, onSuccess }) {
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lead) {
      setStatus(lead.status);
      setNotes('');
      setError('');
      // Set default follow-up date to tomorrow at 10 AM if switching to Follow-up
      if (lead.followUpDate) {
        const date = new Date(lead.followUpDate);
        setFollowUpDate(date.toISOString().slice(0, 16));
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        setFollowUpDate(tomorrow.toISOString().slice(0, 16));
      }
    }
  }, [lead]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lead) return;

    // Validate follow-up date if status is Follow-up
    if (status === 'Follow-up' && followUpDate) {
      const selectedDate = new Date(followUpDate);
      const now = new Date();
      if (selectedDate < now) {
        setError('Follow-up date cannot be in the past. Please select a future date and time.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      // Create interaction record for status change
      let interactionNotes = notes.trim();
      if (!interactionNotes) {
        interactionNotes = `Status changed from ${lead.status} to ${status}`;
        if (status === 'Follow-up' && followUpDate) {
          const followUpDateObj = new Date(followUpDate);
          interactionNotes += `. Follow-up scheduled for ${followUpDateObj.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}`;
        }
      }

      // Determine appropriate outcome based on new status
      let interactionOutcome;
      if (status === 'Converted') {
        interactionOutcome = 'Converted';
      } else if (status === 'Follow-up') {
        interactionOutcome = 'Follow-up Scheduled';
      } else if (status === 'In Progress') {
        interactionOutcome = 'Interested';
      } else if (status === 'Lost') {
        interactionOutcome = 'Not Interested';
      }
      // Otherwise, don't set outcome (it's optional)

      const interactionData = {
        lead: lead._id,
        type: 'Note',
        notes: interactionNotes,
        previousStatus: lead.status,
        newStatus: status,
      };

      // Only add outcome if we have a valid one
      if (interactionOutcome) {
        interactionData.outcome = interactionOutcome;
      }

      const interactionResponse = await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(interactionData),
      });

      if (!interactionResponse.ok) {
        throw new Error('Failed to create interaction record');
      }

      // Update lead status
      const updateData = {
        status,
      };

      // Add follow-up date if status is Follow-up
      if (status === 'Follow-up' && followUpDate) {
        updateData.followUpDate = new Date(followUpDate);
      }

      const response = await fetch(`/api/leads/${lead._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        onSuccess();
        setNotes('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update status');
      }
    } catch (error) {
      setError(error.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'New', label: 'New', color: 'text-blue-600', description: 'Lead has just been created' },
    { value: 'Contacted', label: 'Contacted', color: 'text-yellow-600', description: 'Initial contact made' },
    { value: 'In Progress', label: 'In Progress', color: 'text-purple-600', description: 'Actively working on this lead' },
    { value: 'Follow-up', label: 'Follow-up', color: 'text-orange-600', description: 'Scheduled for follow-up' },
    { value: 'Converted', label: 'Converted', color: 'text-green-600', description: 'Successfully converted to customer' },
    { value: 'Lost', label: 'Lost', color: 'text-red-600', description: 'Lead is no longer interested' },
  ];

  if (!lead) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Update Status: ${lead?.name}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
          Current Status: <strong className="font-semibold ml-1">{lead.status}</strong>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            New Status *
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {statusOptions.find(opt => opt.value === status)?.description}
          </p>
        </div>

        {/* Follow-up Date Picker - Only show when status is Follow-up */}
        {status === 'Follow-up' && (
          <div className="bg-orange-50 p-4 rounded-md border border-orange-200">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Follow-up Date & Time *
            </label>
            <input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              required={status === 'Follow-up'}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            />
            <p className="mt-2 text-xs text-orange-700">
              <strong>Set when you should follow up with this lead.</strong> You&apos;ll be reminded to contact them at this time.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Status Update Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            placeholder="Add any notes about this status change (e.g., reason for change, next steps, etc.)"
          />
          <p className="mt-1 text-xs text-gray-500">
            If left empty, a default note will be created automatically
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium text-gray-900 mb-2">Lead Information:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <p><strong>Phone:</strong> {lead?.phone}</p>
            <p><strong>Email:</strong> {lead?.email || 'N/A'}</p>
            <p><strong>Company:</strong> {lead?.companyName || 'N/A'}</p>
            <p><strong>Value:</strong> ₹{lead?.leadValue?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

