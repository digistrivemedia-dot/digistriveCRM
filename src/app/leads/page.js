'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showLogCallModal, setShowLogCallModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchLeads();
  }, [filters]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`/api/leads?${params}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch leads');
        setLeads([]);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleAddNote = (lead) => {
    setSelectedLead(lead);
    setShowNoteModal(true);
  };

  const handleLeadClick = (leadId) => {
    router.push(`/leads/${leadId}`);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(lead => lead._id)));
    }
  };

  const handleSelectLead = (leadId) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const clearSelection = () => {
    setSelectedLeads(new Set());
  };

  if (loading && leads.length === 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Loading leads...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="">
            <div className="flex justify-between items-center mb-7">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Leads Management</h1>
                <p className="text-slate-500 text-sm mt-0.5">Manage and track all your leads</p>
              </div>
              <div className="flex space-x-3">
                <Button onClick={() => setShowAddModal(true)}>
                  Add Lead
                </Button>
                {user?.role === 'admin' && (
                  <Button variant="outline">
                    Bulk Upload
                  </Button>
                )}
                <Button variant="outline">
                  Export
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Search
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
                      placeholder="Search by name, phone, email..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Status
                    </label>
                    <select
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Converted">Converted</option>
                      <option value="Lost">Lost</option>
                      <option value="Follow-up">Follow-up</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Results per page
                    </label>
                    <select
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
                      value={filters.limit}
                      onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions Bar */}
            {selectedLeads.size > 0 && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-700">
                        {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
                      </span>
                      <button
                        onClick={clearSelection}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Clear selection
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      {user?.role === 'admin' && (
                        <Button
                          variant="outline"
                          onClick={() => setShowBulkAssignModal(true)}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          Assign to Caller
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setShowBulkStatusModal(true)}
                        className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                      >
                        Change Status
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowBulkDeleteModal(true)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leads Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Leads ({pagination.total} total)
                  {loading && <span className="ml-2 text-sm text-gray-500">Loading...</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-slate-50/80 border-y border-slate-100">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest w-12">
                          <input
                            type="checkbox"
                            checked={selectedLeads.size === leads.length && leads.length > 0}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          Assigned To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leads.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                            No leads found
                          </td>
                        </tr>
                      ) : (
                        leads.map((lead) => (
                          <tr 
                            key={lead._id} 
                            className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                            onClick={() => handleLeadClick(lead._id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedLeads.has(lead._id)}
                                onChange={() => handleSelectLead(lead._id)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusHistoryTooltip leadId={lead._id}>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors cursor-help">
                                    {lead.name}
                                  </div>
                                  {lead.companyName && (
                                    <div className="text-sm text-gray-500">
                                      {lead.companyName}
                                    </div>
                                  )}
                                </div>
                              </StatusHistoryTooltip>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm text-gray-900">{lead.phone}</div>
                                {lead.email && (
                                  <div className="text-sm text-gray-500">{lead.email}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusHistoryTooltip leadId={lead._id}>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium cursor-help ${getStatusColor(lead.status)}`}>
                                  {lead.status}
                                </span>
                              </StatusHistoryTooltip>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{lead.leadValue?.toLocaleString() || '0'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {lead.assignedTo?.name || 'Unassigned'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2 flex-wrap">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Open phone dialer
                                    window.location.href = `tel:${lead.phone}`;
                                    // Show log call modal
                                    setSelectedLead(lead);
                                    setShowLogCallModal(true);
                                  }}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                                >
                                  Call
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLead(lead);
                                    setShowInteractionModal(true);
                                  }}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                                >
                                  Add Interaction
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddNote(lead);
                                  }}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  Add Note
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <Button
                        variant="outline"
                        disabled={pagination.current <= 1}
                        onClick={() => handlePageChange(pagination.current - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        disabled={pagination.current >= pagination.pages}
                        onClick={() => handlePageChange(pagination.current + 1)}
                      >
                        Next
                      </Button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{' '}
                          <span className="font-medium">
                            {(pagination.current - 1) * filters.limit + 1}
                          </span>{' '}
                          to{' '}
                          <span className="font-medium">
                            {Math.min(pagination.current * filters.limit, pagination.total)}
                          </span>{' '}
                          of{' '}
                          <span className="font-medium">{pagination.total}</span>{' '}
                          results
                        </p>
                      </div>
                      <div>
                        <nav className="inline-flex items-center gap-1">
                          {[...Array(pagination.pages)].map((_, i) => {
                            const page = i + 1;
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                  page === pagination.current
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Lead Modal */}
        <AddLeadModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchLeads();
          }}
          currentUser={user}
        />

        {/* Add Interaction Modal */}
        <AddInteractionModal
          isOpen={showInteractionModal}
          onClose={() => setShowInteractionModal(false)}
          lead={selectedLead}
          onSuccess={() => {
            setShowInteractionModal(false);
            fetchLeads();
          }}
        />

        {/* Add Note Modal */}
        <AddNoteModal
          isOpen={showNoteModal}
          onClose={() => setShowNoteModal(false)}
          lead={selectedLead}
          onSuccess={() => {
            setShowNoteModal(false);
            fetchLeads();
          }}
        />

        {/* Log Call Modal */}
        <LogCallModal
          isOpen={showLogCallModal}
          onClose={() => setShowLogCallModal(false)}
          lead={selectedLead}
          onSuccess={() => {
            setShowLogCallModal(false);
            fetchLeads();
          }}
        />

        {/* Bulk Delete Modal */}
        <BulkDeleteModal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          selectedLeads={selectedLeads}
          onSuccess={() => {
            setShowBulkDeleteModal(false);
            clearSelection();
            fetchLeads();
          }}
        />

        {/* Bulk Status Change Modal */}
        <BulkStatusModal
          isOpen={showBulkStatusModal}
          onClose={() => setShowBulkStatusModal(false)}
          selectedLeads={selectedLeads}
          onSuccess={() => {
            setShowBulkStatusModal(false);
            clearSelection();
            fetchLeads();
          }}
        />

        {/* Bulk Assign Modal */}
        <BulkAssignModal
          isOpen={showBulkAssignModal}
          onClose={() => setShowBulkAssignModal(false)}
          selectedLeads={selectedLeads}
          onSuccess={() => {
            setShowBulkAssignModal(false);
            clearSelection();
            fetchLeads();
          }}
        />
      </div>
    </ProtectedRoute>
  );
}

// Simple Add Lead Modal Component
function AddLeadModal({ isOpen, onClose, onSuccess, currentUser }) {
  const emptyForm = {
    name: '', phone: '', email: '', companyName: '',
    productInterest: '', source: '', leadValue: '',
    assignedTo: '', priority: 'Medium', notes: '',
  };
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
      setFormData(emptyForm);
      setErrors({});
      setTouched({});
      setServerError('');
    }
  }, [isOpen]);

  const fetchDropdownData = async () => {
    try {
      const [sourcesRes, usersRes] = await Promise.all([
        fetch('/api/sources'),
        fetch('/api/users', { credentials: 'include' }),
      ]);
      if (sourcesRes.ok) setSources((await sourcesRes.json()).sources);
      if (usersRes.ok) setUsers((await usersRes.json()).users);
    } catch {}
  };

  // --- Validation rules ---
  const validate = (data) => {
    const e = {};
    if (!data.name.trim()) {
      e.name = 'Full name is required.';
    } else if (data.name.trim().length < 2) {
      e.name = 'Name must be at least 2 characters.';
    }

    if (!data.phone.trim()) {
      e.phone = 'Phone number is required.';
    } else if (data.phone.replace(/\D/g, '').length !== 10) {
      e.phone = 'Phone number must be exactly 10 digits.';
    }

    if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      e.email = 'Enter a valid email address.';
    }

    if (!data.productInterest.trim()) {
      e.productInterest = 'Product interest is required.';
    }

    if (!data.source) {
      e.source = 'Please select a lead source.';
    }

    if (data.leadValue !== '' && data.leadValue !== null) {
      const val = Number(data.leadValue);
      if (isNaN(val) || val < 0) {
        e.leadValue = 'Lead value must be a positive number.';
      }
    }

    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    // Clear error for this field as user types (if it was already touched)
    if (touched[name]) {
      const newErrors = validate(updated);
      setErrors(prev => ({ ...prev, [name]: newErrors[name] }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const newErrors = validate(formData);
    setErrors(prev => ({ ...prev, [name]: newErrors[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Touch all fields to show all errors
    const allTouched = Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      // Focus the first invalid field
      const firstErrorField = ['name', 'phone', 'email', 'productInterest', 'source', 'leadValue']
        .find(f => validationErrors[f]);
      if (firstErrorField) {
        document.querySelector(`[name="${firstErrorField}"]`)?.focus();
      }
      return;
    }

    setLoading(true);
    setServerError('');
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        onSuccess();
        setFormData(emptyForm);
        setErrors({});
        setTouched({});
      } else {
        const err = await response.json();
        setServerError(err.error || 'Failed to create lead. Please try again.');
      }
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get input class with error state
  const inputCls = (field) =>
    `w-full px-3 py-2.5 border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors text-sm bg-white ${
      touched[field] && errors[field]
        ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
        : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
    }`;

  const FieldError = ({ field }) =>
    touched[field] && errors[field] ? (
      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {errors[field]}
      </p>
    ) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Lead" size="lg">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        {serverError && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {serverError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. John Doe"
              className={inputCls('name')}
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <FieldError field="name" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="e.g. 98765 43210"
              maxLength={10}
              className={inputCls('phone')}
              value={formData.phone}
              onChange={(e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                handleChange(e);
              }}
              onBlur={handleBlur}
            />
            <FieldError field="phone" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Email <span className="text-slate-400 font-normal text-xs">(optional)</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="john@company.com"
              className={inputCls('email')}
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <FieldError field="email" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Company Name <span className="text-slate-400 font-normal text-xs">(optional)</span>
            </label>
            <input
              type="text"
              name="companyName"
              placeholder="e.g. Acme Corp"
              className={inputCls('companyName')}
              value={formData.companyName}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Product Interest <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="productInterest"
              placeholder="e.g. Software Development"
              className={inputCls('productInterest')}
              value={formData.productInterest}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <FieldError field="productInterest" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Source <span className="text-red-500">*</span>
            </label>
            <select
              name="source"
              className={inputCls('source')}
              value={formData.source}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              <option value="">Select source...</option>
              {sources.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <FieldError field="source" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Lead Value (₹) <span className="text-slate-400 font-normal text-xs">(optional)</span>
            </label>
            <input
              type="number"
              name="leadValue"
              placeholder="e.g. 50000"
              min="0"
              step="1"
              className={inputCls('leadValue')}
              value={formData.leadValue}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <FieldError field="leadValue" />
          </div>
        </div>

        {currentUser?.role === 'admin' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Assign To <span className="text-slate-400 font-normal text-xs">(optional)</span>
            </label>
            <select
              name="assignedTo"
              className={inputCls('assignedTo')}
              value={formData.assignedTo}
              onChange={handleChange}
            >
              <option value="">Select employee (leave blank for self)</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
          <select
            name="priority"
            className={inputCls('priority')}
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Notes <span className="text-slate-400 font-normal text-xs">(optional)</span>
          </label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Any additional details about this lead..."
            className={inputCls('notes')}
            value={formData.notes}
            onChange={handleChange}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : 'Create Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Add Interaction Modal Component
function AddInteractionModal({ isOpen, onClose, lead, onSuccess }) {
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
    if (isOpen && lead) {
      setFormData(prev => ({
        ...prev,
        leadStatus: lead.status || 'New',
        followUpDate: new Date().toISOString().slice(0, 16) // Today's date and current time
      }));
    }
  }, [isOpen, lead]);

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
          lead: lead._id,
        }),
      });

      if (!interactionResponse.ok) {
        throw new Error('Failed to add interaction');
      }

      // Update lead status if it has changed
      if (formData.leadStatus !== lead?.status) {
        const statusResponse = await fetch(`/api/leads/${lead._id}`, {
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
        leadStatus: lead?.status || 'New',
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Interaction: ${lead?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-5">
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

// Add Note Modal Component
function AddNoteModal({ isOpen, onClose, lead, onSuccess }) {
  const [type, setType] = useState('note');
  const [notes, setNotes] = useState('');
  const [subject, setSubject] = useState('');
  const [outcome, setOutcome] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lead) {
      setNotes('');
      setSubject('');
      setOutcome('');
      setFollowUpRequired(false);
      setFollowUpDate('');
    }
  }, [lead]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lead || !notes.trim()) return;

    setLoading(true);
    setError('');

    try {
      const communicationData = {
        leadId: lead._id,
        type,
        notes: notes.trim(),
        subject: subject.trim() || undefined,
        outcome: outcome || undefined,
        followUpRequired,
        followUpDate: followUpRequired && followUpDate ? new Date(followUpDate) : undefined,
      };

      const response = await fetch('/api/communications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(communicationData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add note');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const communicationTypes = [
    { value: 'note', label: 'Note' },
    { value: 'call', label: 'Phone Call' },
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'meeting', label: 'Meeting' },
  ];

  const outcomes = [
    { value: '', label: 'Select outcome...' },
    { value: 'successful', label: 'Successful' },
    { value: 'no_answer', label: 'No Answer' },
    { value: 'busy', label: 'Busy' },
    { value: 'voicemail', label: 'Voicemail' },
    { value: 'scheduled_callback', label: 'Scheduled Callback' },
    { value: 'not_interested', label: 'Not Interested' },
    { value: 'converted', label: 'Converted' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Communication: ${lead?.name}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Communication Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            >
              {communicationTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Subject (Optional)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
              placeholder="Brief subject..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Notes/Details *
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            required
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            placeholder="Describe the communication, key points discussed, next steps..."
          />
        </div>

        {(type === 'call' || type === 'meeting') && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Outcome
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            >
              {outcomes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="followUpRequired"
            checked={followUpRequired}
            onChange={(e) => setFollowUpRequired(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="followUpRequired" className="text-sm font-medium text-gray-700">
            Follow-up required
          </label>
        </div>

        {followUpRequired && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Follow-up Date
            </label>
            <input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            />
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Communication'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Bulk Delete Modal Component
function BulkDeleteModal({ isOpen, onClose, selectedLeads, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const leadIds = Array.from(selectedLeads);
      const response = await fetch('/api/leads/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ leadIds }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete leads');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Selected Leads" size="md">
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p className="mb-2">
            Are you sure you want to delete <strong>{selectedLeads.size}</strong> selected lead{selectedLeads.size !== 1 ? 's' : ''}?
          </p>
          <p className="text-red-600">
            <strong>Warning:</strong> This action cannot be undone. All associated data including notes and communications will be permanently deleted.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? 'Deleting...' : 'Delete Leads'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Bulk Status Change Modal Component
function BulkStatusModal({ isOpen, onClose, selectedLeads, onSuccess }) {
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStatusChange = async (e) => {
    e.preventDefault();
    if (!status) return;

    setLoading(true);
    setError('');

    try {
      const leadIds = Array.from(selectedLeads);
      const response = await fetch('/api/leads/bulk-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          leadIds,
          status,
          notes: notes.trim() || undefined,
        }),
      });

      if (response.ok) {
        onSuccess();
        setStatus('');
        setNotes('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update status');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: '', label: 'Select new status...', disabled: true },
    { value: 'New', label: 'New' },
    { value: 'Contacted', label: 'Contacted' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Follow-up', label: 'Follow-up' },
    { value: 'Converted', label: 'Converted' },
    { value: 'Lost', label: 'Lost' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Status for Selected Leads" size="lg">
      <form onSubmit={handleStatusChange} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="text-sm text-gray-600 mb-4">
          Updating status for <strong>{selectedLeads.size}</strong> selected lead{selectedLeads.size !== 1 ? 's' : ''}.
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
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Status Update Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            placeholder="Add any notes about this status change..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !status}>
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Log Call Modal Component
function LogCallModal({ isOpen, onClose, lead, onSuccess }) {
  const [callOutcome, setCallOutcome] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lead) {
      setStatus(lead.status);
      setCallOutcome('');
      setNotes('');
      setDuration('');
      setFollowUpRequired(false);
      setFollowUpDate('');
      setError('');
    }
  }, [lead]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lead || !callOutcome || !status) return;

    setLoading(true);
    setError('');

    try {
      // Create communication record
      const communicationData = {
        leadId: lead._id,
        type: 'call',
        outcome: callOutcome,
        notes: notes.trim(),
        duration: duration ? parseInt(duration) : undefined,
        followUpRequired,
        followUpDate: followUpRequired && followUpDate ? new Date(followUpDate) : undefined,
      };

      const commResponse = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(communicationData),
      });

      if (!commResponse.ok) {
        throw new Error('Failed to log call');
      }

      // Create interaction record if status changed
      if (status !== lead.status) {
        const interactionData = {
          lead: lead._id,
          type: 'Call',
          outcome: callOutcome,
          notes: `Call: ${notes.trim()}`,
          previousStatus: lead.status,
          newStatus: status,
        };

        const interactionResponse = await fetch('/api/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(interactionData),
        });

        if (!interactionResponse.ok) {
          throw new Error('Failed to create interaction record');
        }
      }

      // Update lead status
      const leadUpdateData = {
        status,
        lastContactedAt: new Date(),
      };

      if (followUpRequired && followUpDate) {
        leadUpdateData.followUpDate = new Date(followUpDate);
      }

      const leadResponse = await fetch(`/api/leads/${lead._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(leadUpdateData),
      });

      if (!leadResponse.ok) {
        throw new Error('Failed to update lead');
      }

      onSuccess();
    } catch (error) {
      setError(error.message || 'Failed to log call. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const callOutcomeOptions = [
    { value: '', label: 'Select outcome...', disabled: true },
    { value: 'interested', label: 'Interested' },
    { value: 'not_interested', label: 'Not Interested' },
    { value: 'no_answer', label: 'No Answer' },
    { value: 'busy', label: 'Busy' },
    { value: 'voicemail', label: 'Voicemail' },
    { value: 'scheduled_callback', label: 'Call Back Later' },
    { value: 'successful', label: 'Successful Discussion' },
    { value: 'converted', label: 'Converted' },
  ];

  const statusOptions = [
    { value: 'New', label: 'New' },
    { value: 'Contacted', label: 'Contacted' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Follow-up', label: 'Follow-up' },
    { value: 'Converted', label: 'Converted' },
    { value: 'Lost', label: 'Lost' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Log Call: ${lead?.name}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="bg-blue-50 p-3 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-blue-600">ℹ️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Calling: {lead?.phone}</strong> - Log the call outcome and update lead status
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Call Outcome *
            </label>
            <select
              value={callOutcome}
              onChange={(e) => setCallOutcome(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            >
              {callOutcomeOptions.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Lead Status *
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
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Call Duration (minutes)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            placeholder="How long was the call?"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Call Notes *
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            required
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            placeholder="What was discussed? Key points, concerns, next steps..."
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="followUpRequired"
            checked={followUpRequired}
            onChange={(e) => setFollowUpRequired(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="followUpRequired" className="text-sm font-medium text-gray-700">
            Follow-up required
          </label>
        </div>

        {followUpRequired && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Follow-up Date & Time *
            </label>
            <input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              required={followUpRequired}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              When should you call this lead again?
            </p>
          </div>
        )}

        <div className="bg-gray-50 p-3 rounded-md">
          <h4 className="font-medium text-gray-900 mb-2">Lead Information:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <p><strong>Company:</strong> {lead?.companyName || 'N/A'}</p>
            <p><strong>Email:</strong> {lead?.email || 'N/A'}</p>
            <p><strong>Value:</strong> ₹{lead?.leadValue?.toLocaleString() || '0'}</p>
            <p><strong>Current Status:</strong> {lead?.status}</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !callOutcome || !status}>
            {loading ? 'Saving...' : 'Save Call Log'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Bulk Assign Modal Component
function BulkAssignModal({ isOpen, onClose, selectedLeads, onSuccess }) {
  const [assignedTo, setAssignedTo] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Filter only active users
        const activeUsers = data.users.filter(u => u.isActive);
        setUsers(activeUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignedTo) return;

    setLoading(true);
    setError('');
    setWarning('');

    try {
      const leadIds = Array.from(selectedLeads);
      const response = await fetch('/api/leads/bulk-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ leadIds, assignedTo }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.skipped > 0) {
          setWarning(`${data.assigned} leads assigned. ${data.skipped} leads were skipped (already assigned).`);
        }
        setTimeout(() => {
          onSuccess();
          setAssignedTo('');
          setWarning('');
        }, 2000);
      } else {
        setError(data.error || 'Failed to assign leads');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Leads to Caller" size="lg">
      <form onSubmit={handleAssign} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {warning && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            {warning}
          </div>
        )}

        <div className="text-sm text-gray-600 mb-4">
          Assigning <strong>{selectedLeads.size}</strong> selected lead{selectedLeads.size !== 1 ? 's' : ''}.
        </div>

        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
          <p><strong>Duplicate Prevention:</strong> Only unassigned leads will be assigned. Leads already assigned to other callers will be skipped automatically.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Assign to Caller *
          </label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
          >
            <option value="">Select a caller...</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email}) - {user.role === 'admin' ? 'Admin' : 'Caller'}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !assignedTo}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Assigning...' : 'Assign Leads'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Status History Tooltip Component
function StatusHistoryTooltip({ leadId, children }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (!leadId || history.length > 0) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/interactions?leadId=${leadId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Filter for status changes
        const statusChanges = data.interactions.filter(
          interaction => interaction.previousStatus || interaction.newStatus
        );
        setHistory(statusChanges);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => {
        setShowTooltip(true);
        fetchHistory();
      }}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}

      {showTooltip && (
        <div className="absolute z-50 left-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-4">
          <div className="max-h-80 overflow-y-auto">
            <h4 className="font-semibold text-gray-900 mb-3 sticky top-0 bg-white">
              Status Change History
            </h4>

            {loading ? (
              <div className="text-center py-4 text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No status changes yet</p>
            ) : (
              <div className="space-y-3">
                {history.map((item, index) => (
                  <div key={item._id || index} className="border-l-2 border-indigo-200 pl-3 pb-2">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(item.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-1">
                      {item.previousStatus && (
                        <>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {item.previousStatus}
                          </span>
                          <span className="text-xs text-gray-400">→</span>
                        </>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                        {item.newStatus}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-sm text-gray-600 mt-1 italic">
                        &ldquo;{item.notes}&rdquo;
                      </p>
                    )}

                    {item.user?.name && (
                      <p className="text-xs text-gray-500 mt-1">
                        by {item.user.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}