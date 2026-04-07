'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const emptyAnalytics = {
  conversionFunnel: { new: 0, contacted: 0, inProgress: 0, converted: 0, lost: 0, followUp: 0 },
  sourceAnalysis: [],
  monthlyTrends: [],
  userPerformance: [],
  valueStats: { totalValue: 0, convertedValue: 0, avgLeadValue: 0 },
  totalLeads: 0,
};

const funnelStages = [
  { key: 'new',        label: 'New',        color: 'bg-blue-500',   text: 'text-blue-600'   },
  { key: 'contacted',  label: 'Contacted',  color: 'bg-amber-500',  text: 'text-amber-600'  },
  { key: 'inProgress', label: 'In Progress',color: 'bg-violet-500', text: 'text-violet-600' },
  { key: 'followUp',   label: 'Follow-up',  color: 'bg-orange-500', text: 'text-orange-600' },
  { key: 'converted',  label: 'Converted',  color: 'bg-emerald-500',text: 'text-emerald-600'},
  { key: 'lost',       label: 'Lost',       color: 'bg-red-500',    text: 'text-red-600'    },
];

const ValueCard = ({ label, value, color }) => (
  <Card>
    <CardContent className="p-5 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-slate-500 mt-1 font-medium">{label}</p>
    </CardContent>
  </Card>
);

export default function AnalyticsPage() {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAnalytics({
          conversionFunnel: data.conversionFunnel,
          sourceAnalysis: data.sourceAnalysis,
          monthlyTrends: data.monthlyTrends,
          userPerformance: data.userPerformance,
          valueStats: data.valueStats,
          totalLeads: data.totalLeads,
        });
      } else {
        setAnalytics(emptyAnalytics);
      }
    } catch {
      setAnalytics(emptyAnalytics);
    } finally {
      setLoading(false);
    }
  };

  const maxFunnelCount = Math.max(...funnelStages.map(s => analytics.conversionFunnel?.[s.key] || 0), 1);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="h-7 w-48 bg-slate-200 rounded-lg animate-pulse mb-7" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-7">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                  <div className="h-6 w-20 bg-slate-100 rounded mx-auto mb-2" />
                  <div className="h-3 w-16 bg-slate-100 rounded mx-auto" />
                </div>
              ))}
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
          {/* Header */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-900">
              {user?.role === 'admin' ? 'Company Analytics' : 'My Analytics'}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Performance overview and pipeline insights</p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
            <ValueCard label="Total Leads"     value={analytics.totalLeads || 0}                                           color="text-blue-600" />
            <ValueCard label="Total Value"     value={`₹${analytics.valueStats?.totalValue?.toLocaleString() || '0'}`}     color="text-emerald-600" />
            <ValueCard label="Converted Value" value={`₹${analytics.valueStats?.convertedValue?.toLocaleString() || '0'}`} color="text-emerald-700" />
            <ValueCard label="Avg Lead Value"  value={`₹${analytics.valueStats?.avgLeadValue?.toLocaleString() || '0'}`}   color="text-blue-600" />
          </div>

          {/* Conversion Funnel */}
          <Card className="mb-7">
            <CardHeader>
              <CardTitle>Pipeline Funnel</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {funnelStages.map((stage) => {
                  const count = analytics.conversionFunnel?.[stage.key] || 0;
                  const pct = Math.round((count / maxFunnelCount) * 100);
                  return (
                    <div key={stage.key} className="flex flex-col items-center gap-2">
                      <p className={`text-2xl font-bold ${stage.text}`}>{count}</p>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className={`${stage.color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs font-semibold text-slate-500 text-center">{stage.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Source Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Sources Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.sourceAnalysis?.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.sourceAnalysis.map((source) => {
                      const pct = source.leads > 0 ? Math.round((source.converted / source.leads) * 100) : 0;
                      return (
                        <div key={source.name}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div>
                              <span className="text-sm font-semibold text-slate-800">{source.name}</span>
                              <span className="text-xs text-slate-500 ml-2">{source.leads} leads · {source.converted} converted</span>
                            </div>
                            <span className="text-sm font-bold text-emerald-600">{(source.rate || 0).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 text-sm">No source data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.monthlyTrends?.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {analytics.monthlyTrends.map((month) => {
                      const rate = month.leads > 0 ? ((month.converted / month.leads) * 100).toFixed(1) : '0.0';
                      return (
                        <div key={month.month} className="flex items-center justify-between py-3">
                          <span className="text-sm font-semibold text-slate-800 w-24">{month.month}</span>
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <p className="text-sm font-bold text-blue-600">{month.leads}</p>
                              <p className="text-xs text-slate-500">leads</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-bold text-emerald-600">{month.converted}</p>
                              <p className="text-xs text-slate-500">converted</p>
                            </div>
                            <div className="text-center min-w-[40px]">
                              <p className="text-sm font-bold text-slate-800">{rate}%</p>
                              <p className="text-xs text-slate-500">rate</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                    </div>
                    <p className="text-slate-500 text-sm">No monthly trend data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Team Performance — Admin Only */}
          {user?.role === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {analytics.userPerformance?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-slate-50/80 border-y border-slate-100">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Member</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Total Leads</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Converted</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Conversion Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analytics.userPerformance.map((perf) => (
                          <tr key={perf.name} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-semibold text-slate-800">{perf.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-700 tabular-nums">{perf.leads}</td>
                            <td className="px-6 py-4 text-sm text-slate-700 tabular-nums">{perf.converted}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-24">
                                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(perf.rate || 0, 100)}%` }} />
                                </div>
                                <span className="text-sm font-bold text-emerald-600 tabular-nums">{(perf.rate || 0).toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 text-sm">No team performance data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
