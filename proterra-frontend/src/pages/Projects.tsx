import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getProjects, createProject, updateProject, deleteProject, getTasks, updateTask } from "@/lib/api";
import { Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2, Circle, DollarSign, MapPin, Calendar, FolderKanban } from "lucide-react";

interface Task {
  task_id: string;
  title: string;
  status: string;
  assigned_to: string;
  due_date: string;
  sort_order: number;
}

interface Project {
  project_id: string;
  project_name: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  property_address: string;
  project_type: string;
  status: string;
  estimated_value: number;
  target_completion: string;
  notes: string;
  created_at: string;
}

const STATUSES = [
  "Property Analysis",
  "Drone Survey",
  "3D Design",
  "Client Review",
  "Bidding Phase",
  "Contractor Selection",
  "Under Construction",
  "Final Inspection",
  "Completed",
];

const statusColors: Record<string, string> = {
  "Property Analysis": "bg-blue-100 text-blue-700",
  "Drone Survey": "bg-cyan-100 text-cyan-700",
  "3D Design": "bg-indigo-100 text-indigo-700",
  "Client Review": "bg-yellow-100 text-yellow-700",
  "Bidding Phase": "bg-orange-100 text-orange-700",
  "Contractor Selection": "bg-amber-100 text-amber-700",
  "Under Construction": "bg-emerald-100 text-emerald-700",
  "Final Inspection": "bg-purple-100 text-purple-700",
  Completed: "bg-green-100 text-green-700",
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    project_name: "", client_name: "", client_email: "", client_phone: "",
    property_address: "", project_type: "Pool", estimated_value: 0,
    target_completion: "", notes: "",
  });

  const loadProjects = () => {
    getProjects(filter || undefined)
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProjects(); }, [filter]);

  const loadTasks = async (projectId: string) => {
    const t = await getTasks(projectId);
    setTasks((prev) => ({ ...prev, [projectId]: t }));
  };

  const toggleExpand = async (projectId: string) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
    } else {
      setExpandedProject(projectId);
      if (!tasks[projectId]) await loadTasks(projectId);
    }
  };

  const handleCreate = async () => {
    await createProject(form);
    setDialogOpen(false);
    setForm({
      project_name: "", client_name: "", client_email: "", client_phone: "",
      property_address: "", project_type: "Pool", estimated_value: 0,
      target_completion: "", notes: "",
    });
    loadProjects();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateProject(id, { status });
    loadProjects();
  };

  const handleTaskToggle = async (projectId: string, taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    await updateTask(projectId, taskId, { status: newStatus });
    loadTasks(projectId);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this project?")) {
      await deleteProject(id);
      loadProjects();
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Pipeline</h1>
          <p className="text-zinc-500 mt-1">{projects.length} projects</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={filter === "" ? "default" : "outline"} size="sm" onClick={() => setFilter("")}>All</Button>
        {STATUSES.map((s) => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>{s}</Button>
        ))}
      </div>

      {/* Project Cards */}
      <div className="space-y-4">
        {projects.map((project) => {
          const projectTasks = tasks[project.project_id] || [];
          const completedTasks = projectTasks.filter((t) => t.status === "completed").length;
          const isExpanded = expandedProject === project.project_id;

          return (
            <Card key={project.project_id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{project.project_name}</CardTitle>
                      <Badge className={statusColors[project.status] || "bg-zinc-100 text-zinc-700"}>
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">
                      {project.client_name} &bull; {project.project_type}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => toggleExpand(project.project_id)}>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-zinc-600">
                  {project.property_address && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {project.property_address}
                    </div>
                  )}
                  {project.estimated_value > 0 && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" /> ${project.estimated_value.toLocaleString()}
                    </div>
                  )}
                  {project.target_completion && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Target: {project.target_completion}
                    </div>
                  )}
                </div>

                {/* Task Checklist */}
                {isExpanded && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold">Task Checklist</h4>
                      {projectTasks.length > 0 && (
                        <span className="text-xs text-zinc-400">
                          {completedTasks}/{projectTasks.length} complete
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    {projectTasks.length > 0 && (
                      <div className="w-full bg-zinc-100 rounded-full h-2 mb-3">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${(completedTasks / projectTasks.length) * 100}%` }}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      {projectTasks.map((task) => (
                        <button
                          key={task.task_id}
                          onClick={() => handleTaskToggle(project.project_id, task.task_id, task.status)}
                          className="flex items-center gap-2 w-full text-left text-sm hover:bg-zinc-50 rounded p-1"
                        >
                          {task.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-zinc-300 flex-shrink-0" />
                          )}
                          <span className={task.status === "completed" ? "line-through text-zinc-400" : ""}>
                            {task.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                  <Select
                    value={project.status}
                    onChange={(e) => handleStatusChange(project.project_id, e.target.value)}
                    className="h-8 text-xs flex-1"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(project.project_id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 text-zinc-400">
          <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No projects yet. Convert leads or create a new project!</p>
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Project Name *</Label>
            <Input value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} />
          </div>
          <div>
            <Label>Client Name *</Label>
            <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
          </div>
          <div>
            <Label>Client Email</Label>
            <Input type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} />
          </div>
          <div>
            <Label>Client Phone</Label>
            <Input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Property Address</Label>
            <Input value={form.property_address} onChange={(e) => setForm({ ...form, property_address: e.target.value })} />
          </div>
          <div>
            <Label>Project Type</Label>
            <Select value={form.project_type} onChange={(e) => setForm({ ...form, project_type: e.target.value })}>
              {["Pool", "Outdoor Kitchen", "Patio/Deck", "Landscaping", "Full Backyard", "Fire Feature", "Pergola/Pavilion", "Other"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Estimated Value ($)</Label>
            <Input type="number" value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Target Completion</Label>
            <Input type="date" value={form.target_completion} onChange={(e) => setForm({ ...form, target_completion: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!form.project_name || !form.client_name}>Create Project</Button>
        </div>
      </Dialog>
    </div>
  );
}
