import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PipelineStage {
  stage: string;
  count: number;
  value: number;
}

interface PipelineData {
  pipeline: PipelineStage[];
  total_pipeline_value: number;
  total_completed_value: number;
  total_projects: number;
  active_projects: number;
}

interface ConversionData {
  by_source: Record<string, { total: number; converted: number; rate: number }>;
  by_type: Record<string, { total: number; converted: number; rate: number }>;
  overall: { total_leads: number; converted: number; rate: number };
  monthly_trends: Array<{ month: string; leads: number; converted: number }>;
}

interface ContractorScore {
  contractor_id: string;
  name: string;
  specialty: string;
  total_bids: number;
  awarded_bids: number;
  win_rate: number;
  avg_bid_amount: number;
  rating: number;
}

interface ProfitProject {
  project_id: string;
  project_name: string;
  client_name: string;
  status: string;
  estimated_value: number;
  total_invoiced: number;
  total_paid: number;
  total_bid_cost: number;
  estimated_profit: number;
  profit_margin: number;
}

interface ProfitData {
  projects: ProfitProject[];
  totals: {
    total_estimated_value: number;
    total_invoiced: number;
    total_paid: number;
    total_bid_cost: number;
    total_estimated_profit: number;
    avg_margin: number;
  };
}

interface MonthlySummaryItem {
  month: string;
  new_leads: number;
  new_projects: number;
  completed_projects: number;
  revenue: number;
  invoiced: number;
}

const COLORS = ["#0ea5e9", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#06b6d4", "#ec4899"];

export default function Reports() {
  const [tab, setTab] = useState("pipeline");
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [conversion, setConversion] = useState<ConversionData | null>(null);
  const [scorecards, setScorecards] = useState<ContractorScore[]>([]);
  const [profit, setProfit] = useState<ProfitData | null>(null);
  const [monthly, setMonthly] = useState<MonthlySummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getRevenuePipeline(),
      getLeadConversion(),
      getContractorScorecards(),
      getProfitTracking(),
      getMonthlySummary(),
    ])
      .then(([p, c, s, pr, m]) => {
        setPipeline(p);
        setConversion(c);
        setScorecards(s.contractors || []);
        setProfit(pr);
        setMonthly(m.months || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Page Header */}
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

      {/* KPI Strip */}
      {pipeline && profit && conversion && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Pipeline Value</p>
                  <p className="text-lg font-bold text-slate-900">${(pipeline.total_pipeline_value || 0).toLocaleString()}</p>
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
                  <p className="text-lg font-bold text-emerald-600">${(pipeline.total_completed_value || 0).toLocaleString()}</p>
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
                  <p className="text-lg font-bold text-violet-600">{(conversion.overall.rate || 0).toFixed(1)}%</p>
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
                  <p className="text-xs font-medium text-slate-500">Est. Profit</p>
                  <p className="text-lg font-bold text-amber-600">${(profit.totals.total_estimated_profit || 0).toLocaleString()}</p>
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
                  <p className="text-lg font-bold text-rose-600">{(profit.totals.avg_margin || 0).toFixed(1)}%</p>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pipeline">Revenue Pipeline</TabsTrigger>
          <TabsTrigger value="conversion">Lead Conversion</TabsTrigger>
          <TabsTrigger value="contractors">Contractor Scorecards</TabsTrigger>
          <TabsTrigger value="profit">Profit Tracking</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
        </TabsList>

        {/* Revenue Pipeline Tab */}
        <TabsContent value="pipeline">
          {pipeline && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-0 shadow-md">
                <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-sky-600" />
                    <CardTitle className="text-lg">Pipeline by Stage (Value)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {pipeline.pipeline.length === 0 ? (
                    <p className="text-sm text-slate-400">No pipeline data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={pipeline.pipeline}>
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
                    <CardTitle className="text-lg">Pipeline by Stage (Count)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {pipeline.pipeline.length === 0 ? (
                    <p className="text-sm text-slate-400">No pipeline data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pipeline.pipeline}
                          dataKey="count"
                          nameKey="stage"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ stage, count }) => `${stage}: ${count}`}
                          labelLine
                        >
                          {pipeline.pipeline.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Pipeline Summary Table */}
              <Card className="border-0 shadow-md lg:col-span-2">
                <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                  <CardTitle className="text-lg">Pipeline Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-stone-50 border-b">
                          <th className="p-3 text-left font-medium text-slate-600">Stage</th>
                          <th className="p-3 text-right font-medium text-slate-600">Projects</th>
                          <th className="p-3 text-right font-medium text-slate-600">Value</th>
                          <th className="p-3 text-right font-medium text-slate-600">% of Pipeline</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pipeline.pipeline.map((stage, i) => (
                          <tr key={stage.stage} className="border-b last:border-0">
                            <td className="p-3 font-medium text-slate-900">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                {stage.stage}
                              </div>
                            </td>
                            <td className="p-3 text-right text-slate-600">{stage.count}</td>
                            <td className="p-3 text-right font-medium text-slate-900">${stage.value.toLocaleString()}</td>
                            <td className="p-3 text-right text-slate-600">
                              {pipeline.total_pipeline_value > 0
                                ? ((stage.value / pipeline.total_pipeline_value) * 100).toFixed(1)
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
          )}
        </TabsContent>

        {/* Lead Conversion Tab */}
        <TabsContent value="conversion">
          {conversion && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* By Source */}
              <Card className="border-0 shadow-md">
                <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">Conversion by Source</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {Object.keys(conversion.by_source).length === 0 ? (
                    <p className="text-sm text-slate-400">No data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={Object.entries(conversion.by_source).map(([name, data]) => ({ name, ...data }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" fill="#94a3b8" name="Total Leads" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="converted" fill="#0ea5e9" name="Converted" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* By Type */}
              <Card className="border-0 shadow-md">
                <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-violet-600" />
                    <CardTitle className="text-lg">Conversion by Project Type</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {Object.keys(conversion.by_type).length === 0 ? (
                    <p className="text-sm text-slate-400">No data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={Object.entries(conversion.by_type).map(([name, data]) => ({ name, ...data }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" fill="#94a3b8" name="Total Leads" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="converted" fill="#8b5cf6" name="Converted" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Trends */}
              {conversion.monthly_trends.length > 0 && (
                <Card className="border-0 shadow-md lg:col-span-2">
                  <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      <CardTitle className="text-lg">Lead Conversion Trends</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={conversion.monthly_trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="leads" stroke="#94a3b8" strokeWidth={2} name="New Leads" dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="converted" stroke="#10b981" strokeWidth={2} name="Converted" dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Contractor Scorecards Tab */}
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
                            <p className="font-semibold text-slate-900 text-lg">{contractor.name}</p>
                            <Badge className="bg-slate-100 text-slate-600">{contractor.specialty}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                            <span>{contractor.total_bids} bids</span>
                            <span>{contractor.awarded_bids} awarded</span>
                            <span>Avg bid: ${contractor.avg_bid_amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs font-medium text-slate-500">Win Rate</p>
                          <p className={`text-2xl font-bold ${contractor.win_rate >= 50 ? "text-emerald-600" : contractor.win_rate >= 25 ? "text-amber-600" : "text-red-600"}`}>
                            {contractor.win_rate.toFixed(0)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium text-slate-500">Rating</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                            <span className="text-xl font-bold text-slate-900">{contractor.rating.toFixed(1)}</span>
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
                    {/* Win Rate Bar */}
                    <div className="mt-3">
                      <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${contractor.win_rate >= 50 ? "bg-emerald-500" : contractor.win_rate >= 25 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${Math.max(5, contractor.win_rate)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Profit Tracking Tab */}
        <TabsContent value="profit">
          {profit && (
            <div className="space-y-6">
              {/* Profit Chart */}
              {profit.projects.length > 0 && (
                <Card className="border-0 shadow-md">
                  <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                      <CardTitle className="text-lg">Profit by Project</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={profit.projects.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="project_name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                        <Legend />
                        <Bar dataKey="estimated_value" fill="#94a3b8" name="Est. Value" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="estimated_profit" fill="#10b981" name="Est. Profit" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Projects Table */}
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
                            <th className="p-3 text-right font-medium text-slate-600">Est. Value</th>
                            <th className="p-3 text-right font-medium text-slate-600">Invoiced</th>
                            <th className="p-3 text-right font-medium text-slate-600">Paid</th>
                            <th className="p-3 text-right font-medium text-slate-600">Bid Cost</th>
                            <th className="p-3 text-right font-medium text-slate-600">Est. Profit</th>
                            <th className="p-3 text-right font-medium text-slate-600">Margin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profit.projects.map((p) => (
                            <tr key={p.project_id} className="border-b last:border-0 hover:bg-stone-50">
                              <td className="p-3">
                                <p className="font-medium text-slate-900">{p.project_name}</p>
                                <p className="text-xs text-slate-500">{p.client_name}</p>
                              </td>
                              <td className="p-3">
                                <Badge className="bg-slate-100 text-slate-600 text-xs">{p.status}</Badge>
                              </td>
                              <td className="p-3 text-right text-slate-700">${p.estimated_value.toLocaleString()}</td>
                              <td className="p-3 text-right text-slate-700">${p.total_invoiced.toLocaleString()}</td>
                              <td className="p-3 text-right text-emerald-600 font-medium">${p.total_paid.toLocaleString()}</td>
                              <td className="p-3 text-right text-slate-700">${p.total_bid_cost.toLocaleString()}</td>
                              <td className={`p-3 text-right font-bold ${p.estimated_profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                ${p.estimated_profit.toLocaleString()}
                              </td>
                              <td className={`p-3 text-right font-medium ${p.profit_margin >= 20 ? "text-emerald-600" : p.profit_margin >= 0 ? "text-amber-600" : "text-red-600"}`}>
                                {p.profit_margin.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-900 text-white">
                            <td colSpan={2} className="p-3 font-bold">Totals</td>
                            <td className="p-3 text-right font-bold">${profit.totals.total_estimated_value.toLocaleString()}</td>
                            <td className="p-3 text-right font-bold">${profit.totals.total_invoiced.toLocaleString()}</td>
                            <td className="p-3 text-right font-bold">${profit.totals.total_paid.toLocaleString()}</td>
                            <td className="p-3 text-right font-bold">${profit.totals.total_bid_cost.toLocaleString()}</td>
                            <td className="p-3 text-right font-bold">${profit.totals.total_estimated_profit.toLocaleString()}</td>
                            <td className="p-3 text-right font-bold">{profit.totals.avg_margin.toFixed(1)}%</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Monthly Summary Tab */}
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
                        <Bar dataKey="revenue" fill="#10b981" name="Revenue (Paid)" radius={[4, 4, 0, 0]} />
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
                        <Line type="monotone" dataKey="completed_projects" stroke="#10b981" strokeWidth={2} name="Completed" dot={{ r: 4 }} />
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
