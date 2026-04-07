'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white';
const labelCls = 'block text-sm font-semibold text-slate-700 mb-1.5';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const router = useRouter();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', { credentials: 'include' });
      if (response.ok) setUsers((await response.json()).users);
    } catch {} finally { setLoading(false); }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (response.ok) fetchUsers();
      else alert('Failed to update user status');
    } catch { alert('Network error. Please try again.'); }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', credentials: 'include' });
      if (response.ok) fetchUsers();
      else alert('Failed to delete user');
    } catch { alert('Network error. Please try again.'); }
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

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-7">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
              <p className="text-slate-500 text-sm mt-0.5">Manage employees and their access</p>
            </div>
            <Button onClick={() => setShowAddUserModal(true)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Employee
            </Button>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Users</CardTitle>
                <span className="text-sm text-slate-500 font-medium">{users.length} total</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-slate-50/80 border-y border-slate-100">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                              </svg>
                            </div>
                            <p className="text-slate-500 text-sm">No users found</p>
                          </div>
                        </td>
                      </tr>
                    ) : users.map((user) => (
                      <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => router.push(`/admin/employee/${user._id}`)}
                          >
                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-700 text-sm font-bold uppercase">{user.name?.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-blue-600 group-hover:text-blue-700">{user.name}</p>
                              <p className="text-xs text-slate-500">Click to view profile</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'}`}>
                            {user.role === 'admin' ? 'Admin' : 'Employee'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${user.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleUserStatus(user._id, user.isActive); }}
                              className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${user.isActive ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            {user.role === 'user' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setShowUploadModal(true); }}
                                className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                              >
                                Upload Leads
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteUser(user._id, user.name); }}
                              className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          onSuccess={() => { setShowAddUserModal(false); fetchUsers(); }}
        />
        <CsvUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => { setShowUploadModal(false); setSelectedUser(null); }}
          selectedUser={selectedUser}
        />
      </div>
    </ProtectedRoute>
  );
}

function AddUserModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password, role: formData.role }),
      });
      const data = await response.json();
      if (response.ok) {
        onSuccess();
        setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'user' });
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch { setError('Network error. Please try again.'); } finally { setLoading(false); }
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Employee" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
            <input type="text" name="name" required className={inputCls} placeholder="Enter full name" value={formData.name} onChange={handleChange} />
          </div>
          <div>
            <label className={labelCls}>Email Address <span className="text-red-500">*</span></label>
            <input type="email" name="email" required className={inputCls} placeholder="employee@company.com" value={formData.email} onChange={handleChange} />
          </div>
          <div>
            <label className={labelCls}>Password <span className="text-red-500">*</span></label>
            <input type="password" name="password" required className={inputCls} placeholder="Min. 6 characters" value={formData.password} onChange={handleChange} />
          </div>
          <div>
            <label className={labelCls}>Confirm Password <span className="text-red-500">*</span></label>
            <input type="password" name="confirmPassword" required className={inputCls} placeholder="Repeat password" value={formData.confirmPassword} onChange={handleChange} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Role <span className="text-red-500">*</span></label>
          <select name="role" required className={inputCls} value={formData.role} onChange={handleChange}>
            <option value="user">Employee (User)</option>
            <option value="admin">Admin</option>
          </select>
          <p className="mt-1.5 text-xs text-slate-500">Employees manage assigned leads only. Admins have full system access.</p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Employee'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function CsvUploadModal({ isOpen, onClose, onSuccess, selectedUser }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState([]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) { setError('Please select a CSV file'); return; }
    setFile(selectedFile);
    setError('');
    try {
      const text = await selectedFile.text();
      setPreview(text.split('\n').slice(0, 4));
    } catch {}
  };

  const handleUpload = async () => {
    if (!file || !selectedUser) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('assignedTo', selectedUser._id);
      const response = await fetch('/api/admin/upload-leads', { method: 'POST', credentials: 'include', body: formData });
      const data = await response.json();
      if (response.ok) {
        alert(`Successfully uploaded ${data.count} leads to ${selectedUser.name}`);
        onSuccess();
        setFile(null);
        setPreview([]);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch { setError('Network error. Please try again.'); } finally { setUploading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Upload Leads for ${selectedUser?.name}`} size="lg">
      <div className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <div>
          <label className={labelCls}>Select CSV File</label>
          <input type="file" accept=".csv" onChange={handleFileChange}
            className="w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-white cursor-pointer" />
          <p className="mt-1.5 text-xs text-slate-500">CSV columns: name, phone, email, companyName, productInterest, source, leadValue, priority, notes</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <h4 className="text-sm font-semibold text-slate-800 mb-2">Expected CSV Format</h4>
          <pre className="text-xs text-slate-600 overflow-x-auto font-mono">{`name,phone,email,companyName,productInterest,source,leadValue,priority,notes
John Doe,+1234567890,john@example.com,ABC Corp,Software,Website,5000,High,Interested`}</pre>
        </div>

        {preview.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-2">File Preview</h4>
            <div className="bg-white border border-slate-200 rounded-xl p-3 max-h-32 overflow-y-auto">
              {preview.map((row, i) => (
                <div key={i} className="text-xs text-slate-600 font-mono mb-1">{row}</div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <div>
            <p className="font-semibold">Upload Information</p>
            <p className="mt-0.5">All leads assigned to: <strong>{selectedUser?.name}</strong>. Missing product/source will use defaults. Invalid rows will be skipped.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>{uploading ? 'Uploading...' : 'Upload Leads'}</Button>
        </div>
      </div>
    </Modal>
  );
}
