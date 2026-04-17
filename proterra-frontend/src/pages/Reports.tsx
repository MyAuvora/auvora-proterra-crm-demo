import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getRevenuePipeline,
  getLeadConversion,
  getContractorScorecards,
  getProfitTracking,
  getMonthlySummary,
} from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Users,
  HardHat,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  Award,
  Star,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* -- Types matching actual backend responses -- */

interface FunnelStage {
  stage: string;
  count: number;
  value: number;
}

interface PipelineData {
  lead_stages: Record<string, { count: number; value: number }>;
  project_stages: Record<string, { count: number; value: number }>;
  funnel: FunnelStage[];
}

interface SourceConversion {
  source: string;
  total: number;
  signed: number;
  lost: number;
  conversion_rate: number;
}

interface TypeConversion {
  project_type: string;
  total: number;
  signed: number;
  conversion_rate: number;
  avg_value: number;
}

interface MonthlyTrend {
  month: string;
  leads: number;
  signed: number;
  conversion_rate: number;
}

interface ConversionData {
  overall_conversion_rate: number;
  total_leads: number;
  total_signed: number;
  by_source: SourceConversion[];
  by_type: TypeConversion[];
  monthly_trend: MonthlyTrend[];
}

interface ContractorScore {
  contractor_id: string;
  company_name: string;
  contact_name: string;
  specialty: string;
  rating: number;
  total_bids: number;
  bids_awarded: number;
  win_rate: number;
  avg_bid_amount: number;
  total_awarded_value: number;
  insurance_status: string;
  insurance_ok: boolean;
  days_until_insurance_expiry: number | null;
}

interface ProfitProject {
  project_id: string;
  client_name: string;
  project_type: string;
  status: string;
  budget_estimate: number;
  actual_cost: number;
  variance: number;
  margin_percent: number;
  total_invoiced: number;
  total_paid: number;
  over_budget: boolean;
}

interface ProfitData {
  projects: ProfitProject[];
  summary: {
    total_budget: number;
    total_actual_cost: number;
    total_invoiced: number;
    total_collected: number;
    overall_margin: number;
    projects_over_budget: number;
  };
}

interface MonthlySummaryItem {
  month: string;
  new_leads: number;
  new_projects: number;
  invoiced: number;
  collected: number;
}

const COLORS = ["#0ea5e9", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#06b6d4", "#ec4899"];

/* -- Error Boundary -- */

class ReportsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Reports page error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <h2 className="text-lg font-semibold text-slate-700">Something went wrong</h2>
          <p className="text-sm text-slate-500">{this.state.error?.message || "Failed to load reports page"}</p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            className="px-4 py-2 bg-sky-600 text-white rounded-md text-sm hover:bg-sky-700"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* -- Main Component -- */

function ReportsContent() {
  const [tab, setTab] = useState("pipeline");
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [conversion, setConversion] = useState<ConversionData | null>(null);
  const [scorecards, setScorecards] = useState<ContractorScore[]>([]);
  const [profit, setProfit] = useState<ProfitData | null>(null);
  const [monthly, setMonthly] = useState<MonthlySummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const errors: string[] = [];
    Promise.all([
      getRevenuePipeline().catch((e) => { errors.push("pipeline"); console.error("Failed to load pipeline:", e); return null; }),
      getLeadConversion().catch((e) => { errors.push("conversion"); console.error("Failed to load conversion:", e); return null; }),
      getContractorScorecards().catch((e) => { errors.push("scorecards"); console.error("Failed to load scorecards:", e); return null; }),
      getProfitTracking().catch((e) => { errors.push("profit"); console.error("Failed to load profit:", e); return null; }),
      getMonthlySummary().catch((e) => { errors.push("monthly"); console.error("Failed to load monthly:", e); return null; }),
    ])
      .then(([p, c, s, pr, m]) => {
        if (p) setPipeline(p);
        if (c) setConversion(c);
        if (s) setScorecards(s.contractors || []);
        if (pr) setProfit(pr);
        if (m) setMonthly(m.months || []);
        if (errors.length === 5) {
          setLoadError("Failed to load report data. Please check your connection and try again.");
        }
      })
      .catch((e) => {
        console.error("Reports loadData error:", e);
        setLoadError(e instanceof Error ? e.message : "Failed to load data");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
      </div>
    );

  if (loadError)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <h2 className="text-lg font-semibold text-slate-700">Failed to load report data</h2>
        <p className="text-sm text-slate-500">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-sky-600 text-white rounded-md text-sm hover:bg-sky-700"
        >
          Retry
        </button>
      </div>
    );

  const totalPipelineValue = pipeline?.funnel?.[0]?.value || 0;
  const completedValue = pipeline?.funnel?.find((f) => f.stage === "Completed")?.value || 0;
  const conversionRate = conversion?.overall_conversion_rate || 0;
  const totalBudget = profit?.summary?.total_budget || 0;
  const overallMargin = profit?.summary?.overall_margin || 0;

  const leadStageData = pipeline
    ? Object.entries(pipeline.lead_stages || {}).map(([stage, data]) => ({ stage, ...data }))
    : [];

  const projectStageData = pipeline
    ? Object.entries(pipeline.project_stages || {}).map(([stage, data]) => ({ stage, ...data }))
    : [];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-transparent" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Business Reports</h1>
            <p className="text-slate-300 mt-1">
              Revenue pipeline, conversion analytics, contractor scorecards & profit tracking
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <BarChart3 className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Pipeline Value</p>
                <p className="text-lg font-bold text-slate-900">${totalPipelineValue.toLocaleString()}</p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-sky-500 to-cyan-500" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Completed Value</p>
                <p className="text-lg font-bold text-emerald-600">${completedValue.toLocaleString()}</p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Conversion Rate</p>
                <p className="text-lg font-bold text-violet-600">{conversionRate.toFixed(1)}%</p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Budget</p>
                <p className="text-lg font-bold text-amber-600">${totalBudget.toLocaleString()}</p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Avg Margin</p>
                <p className="text-lg font-bold text-rose-600">{overallMargin.toFixed(1)}%</p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pipeline">Revenue Pipeline</TabsTrigger>
          <TabsTrigger value="conversion">Lead Conversion</TabsTrigger>
          <TabsTrigger value="contractors">Contractor Scorecards</TabsTrigger>
          <TabsTrigger value="profit">Profit Tracking</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          {pipeline ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-0 shadow-md">
                <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-sky-600" />
                    <CardTitle className="text-lg">Lead Pipeline by Stage</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {leadStageData.length === 0 ? (
                    <p className="text-sm text-slate-400">No pipeline data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={leadStageData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="stage" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]} />
                        <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-violet-600" />
                    <CardTitle className="text-lg">Project Stages</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {projectStageData.length === 0 ? (
                    <p className="text-sm text-slate-400">No project data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={projectStageData}
                          dataKey="count"
                          nameKey="stage"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ stage, count }: { stage: string; count: number }) => `${stage}: ${count}`}
                          labelLine
                        >
                          {projectStageData.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md lg:col-span-2">
                <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                  <CardTitle className="text-lg">Sales Funnel</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-stone-50 border-b">
                          <th className="p-3 text-left font-medium text-slate-600">Stage</th>
                          <th className="p-3 text-right font-medium text-slate-600">Count</th>
                          <th className="p-3 text-right font-medium text-slate-600">Value</th>
                          <th className="p-3 text-right font-medium text-slate-600">% of Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(pipeline.funnel || []).map((stage, i) => (
                          <tr key={stage.stage} className="border-b last:border-0">
                            <td className="p-3 font-medium text-slate-900">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                {stage.stage}
                              </div>
                            </td>
                            <td className="p-3 text-right text-slate-600">{stage.count}</td>
                            <td className="p-3 text-right font-medium text-slate-900">${(stage.value || 0).toLocaleString()}</td>
                            <td className="p-3 text-right text-slate-600">
                              {totalPipelineValue > 0
                                ? (((stage.value || 0) / totalPipelineValue) * 100).toFixed(1)
                                : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <p className="text-lg font-medium text-slate-500">No pipeline data available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="conversion">
          {conversion ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-0 shadow-md">
                <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">Conversion by Source</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {(conversion.by_source || []).length === 0 ? (
                    <p className="text-sm text-slate-400">No data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={conversion.by_source.map((s) => ({ name: s.source, total: s.total, signed: s.signed }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" fill="#94a3b8" name="Total Leads" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="signed" fill="#0ea5e9" name="Signed" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-violet-600" />
                    <CardTitle className="text-lg">Conversion by Project Type</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {(conversion.by_type || []).length === 0 ? (
                    <p className="text-sm text-slate-400">No data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={conversion.by_type.map((t) => ({ name: t.project_type, total: t.total, signed: t.signed }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" fill="#94a3b8" name="Total Leads" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="signed" fill="#8b5cf6" name="Signed" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {(conversion.monthly_trend || []).length > 0 && (
                <Card className="border-0 shadow-md lg:col-span-2">
                  <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      <CardTitle className="text-lg">Lead Conversion Trends</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={conversion.monthly_trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="leads" stroke="#94a3b8" strokeWidth={2} name="New Leads" dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="signed" stroke="#10b981" strokeWidth={2} name="Signed" dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <p className="text-lg font-medium text-slate-500">No conversion data available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="contractors">
          <div className="space-y-4">
            {scorecards.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <HardHat className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-lg font-medium text-slate-500">No contractor data</p>
                <p className="text-sm mt-1">Add contractors and bids to see scorecards</p>
              </div>
            ) : (
              scorecards.map((contractor, i) => (
                <Card key={contractor.contractor_id} className="border-0 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white font-bold text-lg">
                          {i + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 text-lg">{contractor.company_name}</p>
                            <Badge className="bg-slate-100 text-slate-600">{contractor.specialty}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                            <span>{contractor.total_bids} bids</span>
                            <span>{contractor.bids_awarded} awarded</span>
                            <span>Avg bid: ${(contractor.avg_bid_amount || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs font-medium text-slate-500">Win Rate</p>
                          <p className={`text-2xl font-bold ${(contractor.win_rate || 0) >= 50 ? "text-emerald-600" : (contractor.win_rate || 0) >= 25 ? "text-amber-600" : "text-red-600"}`}>
                            {(contractor.win_rate || 0).toFixed(0)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium text-slate-500">Rating</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                            <span className="text-xl font-bold text-slate-900">{(contractor.rating || 0).toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium text-slate-500">Rank</p>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                            <Award className="h-4 w-4 text-amber-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${(contractor.win_rate || 0) >= 50 ? "bg-emerald-500" : (contractor.win_rate || 0) >= 25 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${Math.max(5, contractor.win_rate || 0)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="profit">
          {profit ? (
            <div className="space-y-6">
              {profit.projects.length > 0 && (
                <Card className="border-0 shadow-md">
                  <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                      <CardTitle className="text-lg">Budget vs Actual by Project</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={profit.projects.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="client_name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                        <Legend />
                        <Bar dataKey="budget_estimate" fill="#94a3b8" name="Budget" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actual_cost" fill="#10b981" name="Actual Cost" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              <Card className="border-0 shadow-md">
                <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                  <CardTitle className="text-lg">Project Profitability</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {profit.projects.length === 0 ? (
                    <p className="text-sm text-slate-400 py-8 text-center">No project data yet</p>
                  ) : (
                    <div className="rounded-lg border overflow-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-stone-50 border-b">
                            <th className="p-3 text-left font-medium text-slate-600">Project</th>
                            <th className="p-3 text-left font-medium text-slate-600">Status</th>
                            <th className="p-3 text-right font-medium text-slate-600">Budget</th>
                            <th className="p-3 text-right font-medium text-slate-600">Actual Cost</th>
                            <th className="p-3 text-right font-medium text-slate-600">Invoiced</th>
                            <th className="p-3 text-right font-medium text-slate-600">Collected</th>
                            <th className="p-3 text-right font-medium text-slate-600">Variance</th>
                            <th className="p-3 text-right font-medium text-slate-600">Margin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profit.projects.map((p) => (
                            <tr key={p.project_id} className="border-b last:border-0 hover:bg-stone-50">
                              <td className="p-3">
                                <p className="font-medium text-slate-900">{p.client_name}</p>
                                <p className="text-xs text-slate-500">{p.project_type}</p>
                              </td>
                              <td className="p-3">
                                <Badge className={`text-xs ${p.over_budget ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>{p.status}</Badge>
                              </td>
                              <td className="p-3 text-right text-slate-700">${(p.budget_estimate || 0).toLocaleString()}</td>
                              <td className="p-3 text-right text-slate-700">${(p.actual_cost || 0).toLocaleString()}</td>
                              <td className="p-3 text-right text-slate-700">${(p.total_invoiced || 0).toLocaleString()}</td>
                              <td className="p-3 text-right text-emerald-600 font-medium">${(p.total_paid || 0).toLocaleString()}</td>
                              <td className={`p-3 text-right font-bold ${(p.variance || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                ${(p.variance || 0).toLocaleString()}
                              </td>
                              <td className={`p-3 text-right font-medium ${(p.margin_percent || 0) >= 20 ? "text-emerald-600" : (p.margin_percent || 0) >= 0 ? "text-amber-600" : "text-red-600"}`}>
                                {(p.margin_percent || 0).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-900 text-white">
                            <td colSpan={2} className="p-3 font-bold">Totals</td>
                            <td className="p-3 text-right font-bold">${(profit.summary.total_budget || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-bold">${(profit.summary.total_actual_cost || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-bold">${(profit.summary.total_invoiced || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-bold">${(profit.summary.total_collected || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-bold">-</td>
                            <td className="p-3 text-right font-bold">{(profit.summary.overall_margin || 0).toFixed(1)}%</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <p className="text-lg font-medium text-slate-500">No profit data available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="monthly">
          <div className="space-y-6">
            {monthly.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <p className="text-lg font-medium text-slate-500">No monthly data yet</p>
              </div>
            ) : (
              <>
                <Card className="border-0 shadow-md">
                  <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-sky-600" />
                      <CardTitle className="text-lg">Monthly Revenue & Invoicing</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                        <Legend />
                        <Bar dataKey="invoiced" fill="#3b82f6" name="Invoiced" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="collected" fill="#10b981" name="Collected" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-violet-600" />
                      <CardTitle className="text-lg">Monthly Activity</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="new_leads" stroke="#0ea5e9" strokeWidth={2} name="New Leads" dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="new_projects" stroke="#8b5cf6" strokeWidth={2} name="New Projects" dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Reports() {
  return (
    <ReportsErrorBoundary>
      <ReportsContent />
    </ReportsErrorBoundary>
  );
}
