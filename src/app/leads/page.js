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
  const [showStatusModal, setShowStatusModal] = useState(false);
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
      'New': 'bg-blue-100 text-blue-800',
      'Contacted': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-purple-100 text-purple-800',
      'Converted': 'bg-green-100 text-green-800',
      'Lost': 'bg-red-100 text-red-800',
      'Follow-up': 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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

  const handleStatusUpdate = (lead) => {
    setSelectedLead(lead);
    setShowStatusModal(true);
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
              <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
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
            <Card className="mb-6 text-black">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Search by name, phone, email..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Results per page
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                          <input
                            type="checkbox"
                            checked={selectedLeads.size === leads.length && leads.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
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
                          Assigned To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
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
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleLeadClick(lead._id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedLeads.has(lead._id)}
                                onChange={() => handleSelectLead(lead._id)}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
                              ${lead.leadValue?.toLocaleString() || '0'}
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
                                  className="text-green-600 hover:text-green-900 px-2 py-1 rounded bg-green-50 hover:bg-green-100"
                                >
                                  📞 Call
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(lead);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900 px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100"
                                >
                                  Update Status
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddNote(lead);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100"
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
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          {[...Array(pagination.pages)].map((_, i) => {
                            const page = i + 1;
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === pagination.current
                                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
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

        {/* Status Update Modal */}
        <StatusUpdateModal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          lead={selectedLead}
          onSuccess={() => {
            setShowStatusModal(false);
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
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    companyName: '',
    productInterest: '',
    source: '',
    leadValue: '',
    assignedTo: '',
    priority: 'Medium',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [sources, setSources] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);

  const fetchDropdownData = async () => {
    try {
      const [productsRes, sourcesRes, usersRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/sources'),
        fetch('/api/users', { credentials: 'include' }),
      ]);

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products);
      }

      if (sourcesRes.ok) {
        const sourcesData = await sourcesRes.json();
        setSources(sourcesData.sources);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        setFormData({
          name: '', phone: '', email: '', companyName: '',
          productInterest: '', source: '', leadValue: '', assignedTo: '',
          priority: 'Medium', notes: '',
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create lead');
      }
    } catch (error) {
      alert('Network error. Please try again.');
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
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Lead" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              name="phone"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              name="companyName"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.companyName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Interest *
            </label>
            <select
              name="productInterest"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.productInterest}
              onChange={handleChange}
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source *
            </label>
            <select
              name="source"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.source}
              onChange={handleChange}
            >
              <option value="">Select Source</option>
              {sources.map((source) => (
                <option key={source._id} value={source._id}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lead Value *
            </label>
            <input
              type="number"
              name="leadValue"
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.leadValue}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Assigned To field - only show for admins */}
        {currentUser?.role === 'admin' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <select
              name="assignedTo"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.assignedTo}
              onChange={handleChange}
            >
              <option value="">Select Employee (leave blank for self)</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            name="priority"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Lead'}
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lead) {
      setStatus(lead.status);
      setNotes('');
    }
  }, [lead]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lead) return;

    setLoading(true);
    setError('');

    try {
      // Create interaction record for status change
      const interactionData = {
        lead: lead._id,
        type: 'Note',
        outcome: 'Status Changed',
        notes: notes.trim() || `Status changed from ${lead.status} to ${status}`,
        previousStatus: lead.status,
        newStatus: status,
      };

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
      const response = await fetch(`/api/leads/${lead._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status,
        }),
      });

      if (response.ok) {
        onSuccess();
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
    { value: 'New', label: 'New', color: 'text-blue-600' },
    { value: 'Contacted', label: 'Contacted', color: 'text-yellow-600' },
    { value: 'In Progress', label: 'In Progress', color: 'text-purple-600' },
    { value: 'Follow-up', label: 'Follow-up', color: 'text-orange-600' },
    { value: 'Converted', label: 'Converted', color: 'text-green-600' },
    { value: 'Lost', label: 'Lost', color: 'text-red-600' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Update Status: ${lead?.name}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lead Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status Update Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Add any notes about this status change..."
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium text-gray-900 mb-2">Current Lead Info:</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p><strong>Phone:</strong> {lead?.phone}</p>
            <p><strong>Email:</strong> {lead?.email}</p>
            <p><strong>Company:</strong> {lead?.companyName}</p>
            <p><strong>Value:</strong> ${lead?.leadValue?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
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
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Communication Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {communicationTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject (Optional)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Brief subject..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes/Details *
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Describe the communication, key points discussed, next steps..."
          />
        </div>

        {(type === 'call' || type === 'meeting') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Outcome
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="followUpRequired" className="text-sm font-medium text-gray-700">
            Follow-up required
          </label>
        </div>

        {followUpRequired && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Follow-up Date
            </label>
            <input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
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
      <form onSubmit={handleStatusChange} className="space-y-4 text-black">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="text-sm text-gray-600 mb-4">
          Updating status for <strong>{selectedLeads.size}</strong> selected lead{selectedLeads.size !== 1 ? 's' : ''}.
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Status *
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status Update Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Call Outcome *
            </label>
            <select
              value={callOutcome}
              onChange={(e) => setCallOutcome(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {callOutcomeOptions.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lead Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Call Duration (minutes)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="How long was the call?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Call Notes *
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="What was discussed? Key points, concerns, next steps..."
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="followUpRequired"
            checked={followUpRequired}
            onChange={(e) => setFollowUpRequired(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="followUpRequired" className="text-sm font-medium text-gray-700">
            Follow-up required
          </label>
        </div>

        {followUpRequired && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Follow-up Date & Time *
            </label>
            <input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              required={followUpRequired}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
            <p><strong>Value:</strong> ${lead?.leadValue?.toLocaleString() || '0'}</p>
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
      <form onSubmit={handleAssign} className="space-y-4 text-black">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
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

        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-blue-600">ℹ️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Duplicate Prevention:</strong> Only unassigned leads will be assigned. Leads already assigned to other callers will be skipped automatically.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assign to Caller *
          </label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
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