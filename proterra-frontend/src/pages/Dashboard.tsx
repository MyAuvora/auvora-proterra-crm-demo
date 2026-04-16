import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboard } from "@/lib/api";
import { Users, FolderKanban, HardHat, DollarSign, TrendingUp, Gavel, Activity, BarChart3 } from "lucide-react";

interface DashboardData {
  leads: {
    total: number;
    new_30d: number;
    by_status: Record<string, number>;
    by_source: Record<string, number>;
    conversion_rate: number;
  };
  projects: {
    total: number;
    active: number;
    by_status: Record<string, number>;
    total_pipeline_value: number;
    avg_project_value: number;
  };
  contractors: {
    total_active: number;
  };
  bidding: {
    open_packages: number;
    total_bids: number;
    submitted: number;
    awarded: number;
  };
  recent_activity: Array<{
    log_id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    details: string;
    created_at: string;
  }>;
}

const statGradients = [
  "from-blue-500 to-blue-600",
  "from-sky-500 to-cyan-500",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-500",
  "from-teal-500 to-emerald-500",
  "from-rose-500 to-pink-500",
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
      </div>
    );

  if (!data) return <p className="text-red-500">Failed to load dashboard</p>;

  const stats = [
    { label: "Total Leads", value: data.leads.total, icon: Users, path: "/leads" },
    { label: "New Leads (30d)", value: data.leads.new_30d, icon: TrendingUp, path: "/leads" },
    { label: "Active Projects", value: data.projects.active, icon: FolderKanban, path: "/projects" },
    { label: "Pipeline Value", value: `$${(data.projects.total_pipeline_value || 0).toLocaleString()}`, icon: DollarSign, path: "/projects" },
    { label: "Contractors", value: data.contractors.total_active, icon: HardHat, path: "/contractors" },
    { label: "Open Bid Packages", value: data.bidding.open_packages, icon: Gavel, path: "/bidding" },
  ];

  const barColors = ["bg-sky-500", "bg-blue-500", "bg-violet-500", "bg-amber-500", "bg-teal-500", "bg-rose-500", "bg-cyan-500"];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-600/20 to-transparent" />
        <div className="relative">
          <h1 className="text-3xl font-bold">Owner Dashboard</h1>
          <p className="text-slate-300 mt-1">
            ProTerra Design — Florida & Alabama Gulf Coast
          </p>
        </div>
      </div>

      {/* Stat Cards with gradients */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s, i) => (
          <Card
            key={s.label}
            className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={() => navigate(s.path)}
          >
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-5">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${statGradients[i]} text-white shadow-lg`}>
                  <s.icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                </div>
              </div>
              <div className={`h-1 bg-gradient-to-r ${statGradients[i]}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Leads by Status */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-stone-100 bg-stone-50/50">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-sky-600" />
              <CardTitle className="text-lg">Leads by Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {Object.keys(data.leads.by_status).length === 0 ? (
              <p className="text-sm text-slate-400">No leads yet</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(data.leads.by_status).map(([status, count], i) => (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{status}</span>
                      <span className="text-sm font-semibold text-slate-900">{count}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-stone-100 overflow-hidden">
                      <div className={`h-full rounded-full ${barColors[i % barColors.length]} transition-all duration-500`} style={{ width: `${Math.max(8, (count / data.leads.total) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leads by Source */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-stone-100 bg-stone-50/50">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Leads by Source</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {Object.keys(data.leads.by_source).length === 0 ? (
              <p className="text-sm text-slate-400">No leads yet</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(data.leads.by_source).map(([source, count], i) => (
                  <div key={source}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700 capitalize">{source}</span>
                      <span className="text-sm font-semibold text-slate-900">{count}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-stone-100 overflow-hidden">
                      <div className={`h-full rounded-full ${barColors[(i + 1) % barColors.length]} transition-all duration-500`} style={{ width: `${Math.max(8, (count / data.leads.total) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects by Status */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-stone-100 bg-stone-50/50">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-violet-600" />
              <CardTitle className="text-lg">Projects by Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {Object.keys(data.projects.by_status).length === 0 ? (
              <p className="text-sm text-slate-400">No projects yet</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(data.projects.by_status).map(([status, count], i) => (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{status}</span>
                      <span className="text-sm font-semibold text-slate-900">{count}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-stone-100 overflow-hidden">
                      <div className={`h-full rounded-full ${barColors[(i + 2) % barColors.length]} transition-all duration-500`} style={{ width: `${Math.max(8, (count / data.projects.total) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-stone-100 bg-stone-50/50">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal-600" />
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {(data.recent_activity || []).length === 0 ? (
              <p className="text-sm text-slate-400">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {(data.recent_activity || []).slice(0, 8).map((a) => (
                  <div key={a.log_id} className="flex items-center justify-between rounded-lg p-2 hover:bg-stone-50 transition-colors">
                    <span className="text-sm text-slate-600">{a.details}</span>
                    <span className="text-xs text-slate-400 whitespace-nowrap ml-3">{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* KPI Strip */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6">
          <div className="flex items-center justify-around text-white">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-400">Lead Conversion Rate</p>
              <p className="text-3xl font-bold mt-1">{(data.leads.conversion_rate || 0).toFixed(1)}%</p>
            </div>
            <div className="h-12 w-px bg-slate-700" />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-400">Total Bids</p>
              <p className="text-3xl font-bold mt-1">{data.bidding.total_bids}</p>
            </div>
            <div className="h-12 w-px bg-slate-700" />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-400">Avg Project Value</p>
              <p className="text-3xl font-bold mt-1">${(data.projects.avg_project_value || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
