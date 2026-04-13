import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboard } from "@/lib/api";
import { Users, FolderKanban, HardHat, DollarSign, TrendingUp, Gavel } from "lucide-react";

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

export default function Dashboard() {
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
    { label: "Total Leads", value: data.leads.total, icon: Users, color: "bg-blue-500" },
    { label: "New Leads (30d)", value: data.leads.new_30d, icon: TrendingUp, color: "bg-sky-500" },
    { label: "Active Projects", value: data.projects.active, icon: FolderKanban, color: "bg-purple-500" },
    { label: "Pipeline Value", value: `$${(data.projects.total_pipeline_value || 0).toLocaleString()}`, icon: DollarSign, color: "bg-amber-500" },
    { label: "Contractors", value: data.contractors.total_active, icon: HardHat, color: "bg-orange-500" },
    { label: "Open Bid Packages", value: data.bidding.open_packages, icon: Gavel, color: "bg-rose-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Owner Dashboard</h1>
        <p className="text-zinc-500 mt-1">
          ProTerra Design — Florida & Alabama Gulf Coast
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${s.color} text-white`}>
                  <s.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Leads by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leads by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(data.leads.by_status).length === 0 ? (
              <p className="text-sm text-zinc-400">No leads yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.leads.by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm">{status}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-sky-500" style={{ width: `${Math.max(20, (count / data.leads.total) * 200)}px` }} />
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leads by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leads by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(data.leads.by_source).length === 0 ? (
              <p className="text-sm text-zinc-400">No leads yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.leads.by_source).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{source}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.max(20, (count / data.leads.total) * 200)}px` }} />
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Projects by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(data.projects.by_status).length === 0 ? (
              <p className="text-sm text-zinc-400">No projects yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.projects.by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm">{status}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-purple-500" style={{ width: `${Math.max(20, (count / data.projects.total) * 200)}px` }} />
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {(data.recent_activity || []).length === 0 ? (
              <p className="text-sm text-zinc-400">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {(data.recent_activity || []).slice(0, 8).map((a) => (
                  <div key={a.log_id} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">{a.details}</span>
                    <span className="text-xs text-zinc-400">{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rate */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Lead Conversion Rate</p>
              <p className="text-3xl font-bold">{(data.leads.conversion_rate || 0).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Total Bids</p>
              <p className="text-3xl font-bold">{data.bidding.total_bids}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Avg Project Value</p>
              <p className="text-3xl font-bold">${(data.projects.avg_project_value || 0).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
