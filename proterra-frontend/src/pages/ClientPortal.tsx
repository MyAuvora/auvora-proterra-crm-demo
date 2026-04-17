import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getPortalAccess,
  createPortalAccess,
  deletePortalAccess,
  togglePortalAccess,
  getDesignApprovals,
  createDesignApproval,
} from "@/lib/api";
import { getProjects } from "@/lib/api";
import {
  Link2,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Shield,
  UserCheck,
  ExternalLink,
} from "lucide-react";

interface PortalAccess {
  access_id: string;
  project_id: string;
  access_token: string;
  client_name: string;
  client_email: string;
  is_active: boolean;
  last_accessed_at: string | null;
  created_at: string;
  project: {
    project_id: string;
    project_name: string;
    status: string;
  };
}

interface DesignApproval {
  approval_id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  client_notes: string;
  created_at: string;
  responded_at: string | null;
  project: {
    project_id: string;
    project_name: string;
  };
}

interface Project {
  project_id: string;
  project_name: string;
  client_name: string;
}

const approvalStatusColors: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  Approved: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  "Revision Requested": "bg-red-100 text-red-700 ring-1 ring-red-200",
};

export default function ClientPortal() {
  const [tab, setTab] = useState("access");
  const [accessList, setAccessList] = useState<PortalAccess[]>([]);
  const [approvals, setApprovals] = useState<DesignApproval[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [accessForm, setAccessForm] = useState({
    project_id: "",
    client_name: "",
    client_email: "",
  });
  const [approvalForm, setApprovalForm] = useState({
    project_id: "",
    title: "",
    description: "",
  });

  const loadData = async () => {
    try {
      const [access, approvalsData, projectsData] = await Promise.all([
        getPortalAccess(),
        getDesignApprovals(),
        getProjects(),
      ]);
      setAccessList(access);
      setApprovals(approvalsData);
      setProjects(projectsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAccess = async () => {
    await createPortalAccess(accessForm);
    setDialogOpen(false);
    setAccessForm({ project_id: "", client_name: "", client_email: "" });
    loadData();
  };

  const handleDeleteAccess = async (id: string) => {
    if (confirm("Revoke this client's portal access?")) {
      await deletePortalAccess(id);
      loadData();
    }
  };

  const handleToggleAccess = async (id: string) => {
    await togglePortalAccess(id);
    loadData();
  };

  const handleCreateApproval = async () => {
    await createDesignApproval(approvalForm);
    setApprovalDialogOpen(false);
    setApprovalForm({ project_id: "", title: "", description: "" });
    loadData();
  };

  const copyPortalLink = (token: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/portal/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

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
        <div className="absolute inset-0 bg-gradient-to-r from-sky-600/20 to-transparent" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Client Portal</h1>
            <p className="text-slate-300 mt-1">
              Manage client access links and design approvals
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <Shield className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg">
                <Link2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Active Links</p>
                <p className="text-2xl font-bold text-slate-900">
                  {accessList.filter((a) => a.is_active).length}
                </p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-sky-500 to-cyan-500" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Approvals</p>
                <p className="text-2xl font-bold text-slate-900">
                  {approvals.filter((a) => a.status === "Pending").length}
                </p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Approved</p>
                <p className="text-2xl font-bold text-slate-900">
                  {approvals.filter((a) => a.status === "Approved").length}
                </p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-lg">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Revisions Requested</p>
                <p className="text-2xl font-bold text-slate-900">
                  {approvals.filter((a) => a.status === "Revision Requested").length}
                </p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-red-500 to-rose-500" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="access">Portal Access Links</TabsTrigger>
          <TabsTrigger value="approvals">Design Approvals</TabsTrigger>
        </TabsList>

        {/* Access Links Tab */}
        <TabsContent value="access">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Access Link
            </Button>
          </div>
          <div className="space-y-3">
            {accessList.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <Link2 className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-lg font-medium text-slate-500">No portal access links</p>
                <p className="text-sm mt-1">Create a link to give clients view access to their project</p>
              </div>
            ) : (
              accessList.map((access) => (
                <Card key={access.access_id} className="border-0 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${access.is_active ? "bg-emerald-100" : "bg-zinc-100"}`}>
                          <UserCheck className={`h-5 w-5 ${access.is_active ? "text-emerald-600" : "text-zinc-400"}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{access.client_name}</p>
                            <Badge className={access.is_active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}>
                              {access.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500">
                            {access.project.project_name} &bull; {access.client_email || "No email"}
                          </p>
                          {access.last_accessed_at && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              Last accessed: {new Date(access.last_accessed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyPortalLink(access.access_token)}
                        >
                          {copiedToken === access.access_token ? (
                            <><CheckCircle2 className="mr-1 h-3 w-3 text-emerald-500" /> Copied!</>
                          ) : (
                            <><Copy className="mr-1 h-3 w-3" /> Copy Link</>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/portal/${access.access_token}`, "_blank")}
                        >
                          <ExternalLink className="mr-1 h-3 w-3" /> Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAccess(access.access_id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAccess(access.access_id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setApprovalDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Approval Request
            </Button>
          </div>
          <div className="space-y-3">
            {approvals.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <CheckCircle2 className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-lg font-medium text-slate-500">No design approvals</p>
                <p className="text-sm mt-1">Create approval requests for clients to review designs</p>
              </div>
            ) : (
              approvals.map((approval) => (
                <Card key={approval.approval_id} className="border-0 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{approval.title}</p>
                          <Badge className={approvalStatusColors[approval.status] || "bg-zinc-100 text-zinc-700"}>
                            {approval.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {approval.project.project_name}
                        </p>
                        {approval.description && (
                          <p className="text-sm text-slate-600 mt-2">{approval.description}</p>
                        )}
                        {approval.client_notes && (
                          <div className="mt-2 rounded-lg bg-slate-50 p-3">
                            <p className="text-xs font-medium text-slate-500 mb-1">Client Notes:</p>
                            <p className="text-sm text-slate-700">{approval.client_notes}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <p>Created: {new Date(approval.created_at).toLocaleDateString()}</p>
                        {approval.responded_at && (
                          <p>Responded: {new Date(approval.responded_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Access Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>Create Portal Access Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Project *</Label>
            <Select
              value={accessForm.project_id}
              onChange={(e) => setAccessForm({ ...accessForm, project_id: e.target.value })}
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.project_name} ({p.client_name})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Client Name *</Label>
            <Input
              value={accessForm.client_name}
              onChange={(e) => setAccessForm({ ...accessForm, client_name: e.target.value })}
              placeholder="e.g. John & Sarah Smith"
            />
          </div>
          <div>
            <Label>Client Email</Label>
            <Input
              type="email"
              value={accessForm.client_email}
              onChange={(e) => setAccessForm({ ...accessForm, client_email: e.target.value })}
              placeholder="client@example.com"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateAccess}
            disabled={!accessForm.project_id || !accessForm.client_name}
          >
            Create Access Link
          </Button>
        </div>
      </Dialog>

      {/* Create Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogHeader>
          <DialogTitle>Create Design Approval Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Project *</Label>
            <Select
              value={approvalForm.project_id}
              onChange={(e) => setApprovalForm({ ...approvalForm, project_id: e.target.value })}
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.project_name} ({p.client_name})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Title *</Label>
            <Input
              value={approvalForm.title}
              onChange={(e) => setApprovalForm({ ...approvalForm, title: e.target.value })}
              placeholder="e.g. Pool Design - Revision 2"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={approvalForm.description}
              onChange={(e) => setApprovalForm({ ...approvalForm, description: e.target.value })}
              placeholder="Describe the design changes for the client to review..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateApproval}
            disabled={!approvalForm.project_id || !approvalForm.title}
          >
            Create Approval Request
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
