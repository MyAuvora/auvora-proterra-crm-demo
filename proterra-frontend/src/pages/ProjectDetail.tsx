import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getProject, updateProject, deleteProject, updateTask } from "@/lib/api";
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar,
  Trash2, Save, Edit3, CheckCircle2, Circle, FolderKanban,
  FileText, ClipboardList,
} from "lucide-react";

interface Task {
  task_id: string;
  title: string;
  status: string;
  assigned_to: string;
  due_date: string;
  sort_order: number;
}

interface BidPackage {
  package_id: string;
  title: string;
  status: string;
  scope_of_work: string;
}

interface ProjectData {
  project_id: string;
  project_name: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  property_address: string;
  project_type: string;
  description: string;
  status: string;
  budget_estimate: number;
  actual_cost: number;
  estimated_value: number;
  start_date: string;
  target_completion: string;
  notes: string;
  created_at: string;
  updated_at: string;
  tasks: Task[];
  bid_packages: BidPackage[];
}

const STATUSES = [
  "Property Analysis", "Drone Survey", "3D Design", "Client Review",
  "Bidding Phase", "Contractor Selection", "Under Construction",
  "Final Inspection", "Completed",
];

const statusColors: Record<string, string> = {
  "Property Analysis": "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  "Drone Survey": "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200",
  "3D Design": "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
  "Client Review": "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  "Bidding Phase": "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
  "Contractor Selection": "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  "Under Construction": "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
  "Final Inspection": "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
  Completed: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});

  const loadProject = () => {
    if (!id) return;
    getProject(id)
      .then((data: ProjectData) => {
        setProject(data);
        setForm({
          client_name: data.client_name,
          client_email: data.client_email,
          client_phone: data.client_phone,
          property_address: data.property_address,
          project_type: data.project_type,
          description: data.description,
          budget_estimate: data.budget_estimate || data.estimated_value || 0,
          target_completion: data.target_completion || "",
          notes: data.notes || "",
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProject(); }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateProject(id, form);
      loadProject();
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("Delete this project permanently?")) return;
    await deleteProject(id);
    navigate("/projects");
  };

  const handleTaskToggle = async (taskId: string, currentStatus: string) => {
    if (!id) return;
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    await updateTask(id, taskId, { status: newStatus });
    loadProject();
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-sky-200 border-t-sky-600" />
      </div>
    );

  if (!project) return <p className="text-red-500 p-8">Project not found</p>;

  const completedTasks = (project.tasks || []).filter((t) => t.status === "completed").length;
  const totalTasks = (project.tasks || []).length;
  const budgetValue = project.budget_estimate || project.estimated_value || 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">
              {project.project_name || project.client_name}
            </h1>
            <Badge className={statusColors[project.status] || "bg-zinc-100 text-zinc-700"}>
              {project.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {project.project_type} &bull; Created {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" /> Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => { setEditing(false); }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5">
            <div className="flex items-center justify-between text-white mb-3">
              <span className="text-sm font-medium">Project Progress</span>
              <span className="text-sm">{completedTasks}/{totalTasks} tasks complete</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-sky-400 to-cyan-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="text-lg">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {editing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Client Name</Label>
                    <Input value={String(form.client_name || "")} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={String(form.client_email || "")} onChange={(e) => setForm({ ...form, client_email: e.target.value })} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={String(form.client_phone || "")} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Property Address</Label>
                    <Input value={String(form.property_address || "")} onChange={(e) => setForm({ ...form, property_address: e.target.value })} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FolderKanban className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700 font-medium">{project.client_name}</span>
                  </div>
                  {project.client_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <a href={`mailto:${project.client_email}`} className="text-sky-600 hover:underline">{project.client_email}</a>
                    </div>
                  )}
                  {project.client_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <a href={`tel:${project.client_phone}`} className="text-sky-600 hover:underline">{project.client_phone}</a>
                    </div>
                  )}
                  {project.property_address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-700">{project.property_address}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Checklist */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-sky-600" />
                <CardTitle className="text-lg">Task Checklist</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {(project.tasks || []).length === 0 ? (
                <p className="text-sm text-slate-400">No tasks yet</p>
              ) : (
                <div className="space-y-2">
                  {(project.tasks || []).map((task) => (
                    <button
                      key={task.task_id}
                      onClick={() => handleTaskToggle(task.task_id, task.status)}
                      className="flex items-center gap-3 w-full text-left text-sm hover:bg-stone-50 rounded-lg p-2.5 transition-colors"
                    >
                      {task.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-zinc-300 flex-shrink-0" />
                      )}
                      <span className={task.status === "completed" ? "line-through text-zinc-400" : "text-slate-700"}>
                        {task.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bid Packages */}
          {(project.bid_packages || []).length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-violet-600" />
                  <CardTitle className="text-lg">Bid Packages</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {(project.bid_packages || []).map((bp) => (
                    <div key={bp.package_id} className="flex items-center justify-between p-3 rounded-lg bg-stone-50">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{bp.title}</p>
                        {bp.scope_of_work && (
                          <p className="text-xs text-slate-400 mt-1 truncate max-w-md">{bp.scope_of_work}</p>
                        )}
                      </div>
                      <Badge variant="secondary">{bp.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description / Notes */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {editing ? (
                <Textarea
                  value={String(form.notes || "")}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={5}
                />
              ) : (
                <p className="text-slate-600 whitespace-pre-wrap">
                  {project.notes || project.description || "No notes yet."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Select
                value={project.status}
                onChange={async (e) => {
                  if (!id) return;
                  await updateProject(id, { status: e.target.value });
                  loadProject();
                }}
                className="w-full"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </CardContent>
          </Card>

          {/* Financials */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="text-lg">Financials</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {editing ? (
                <div>
                  <Label>Budget Estimate ($)</Label>
                  <Input
                    type="number"
                    value={String(form.budget_estimate || 0)}
                    onChange={(e) => setForm({ ...form, budget_estimate: Number(e.target.value) })}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Budget Estimate</span>
                    <span className="text-sm font-semibold text-slate-900">
                      ${budgetValue.toLocaleString()}
                    </span>
                  </div>
                  {project.actual_cost > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Actual Cost</span>
                      <span className="text-sm font-semibold text-slate-900">
                        ${project.actual_cost.toLocaleString()}
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {editing ? (
                <div>
                  <Label>Target Completion</Label>
                  <Input
                    type="date"
                    value={String(form.target_completion || "")}
                    onChange={(e) => setForm({ ...form, target_completion: e.target.value })}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Created:</span>
                    <span className="text-slate-700">{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                  {project.start_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">Started:</span>
                      <span className="text-slate-700">{new Date(project.start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {project.target_completion && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-emerald-400" />
                      <span className="text-slate-500">Target:</span>
                      <span className="text-slate-700">{new Date(project.target_completion).toLocaleDateString()}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Button variant="destructive" className="w-full" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete Project
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
