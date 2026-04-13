import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getLeads, createLead, updateLead, deleteLead, convertLead } from "@/lib/api";
import { Plus, Trash2, ArrowRightCircle, Phone, Mail, MapPin, Users } from "lucide-react";

interface Lead {
  lead_id: string;
  full_name: string;
  email: string;
  phone: string;
  property_address: string;
  city: string;
  state: string;
  zip_code: string;
  project_type: string;
  budget_range: string;
  timeline: string;
  source: string;
  status: string;
  notes: string;
  created_at: string;
}

const STATUSES = ["New Lead", "Contacted", "Site Visit Scheduled", "Proposal Sent", "Qualified", "Converted", "Lost"];
const SOURCES = ["website", "facebook", "instagram", "referral", "google", "other"];
const PROJECT_TYPES = ["Pool", "Outdoor Kitchen", "Patio/Deck", "Landscaping", "Full Backyard", "Fire Feature", "Pergola/Pavilion", "Other"];

const statusColors: Record<string, string> = {
  "New Lead": "bg-blue-100 text-blue-700",
  Contacted: "bg-yellow-100 text-yellow-700",
  "Site Visit Scheduled": "bg-purple-100 text-purple-700",
  "Proposal Sent": "bg-orange-100 text-orange-700",
  Qualified: "bg-emerald-100 text-emerald-700",
  Converted: "bg-green-100 text-green-700",
  Lost: "bg-red-100 text-red-700",
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", property_address: "",
    city: "", state: "FL", zip_code: "", project_type: "Pool",
    budget_range: "", timeline: "", source: "website", notes: "",
  });

  const loadLeads = () => {
    getLeads(filter || undefined)
      .then(setLeads)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadLeads(); }, [filter]);

  const handleCreate = async () => {
    await createLead(form);
    setDialogOpen(false);
    setForm({
      full_name: "", email: "", phone: "", property_address: "",
      city: "", state: "FL", zip_code: "", project_type: "Pool",
      budget_range: "", timeline: "", source: "website", notes: "",
    });
    loadLeads();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateLead(id, { status });
    loadLeads();
  };

  const handleConvert = async (id: string) => {
    await convertLead(id);
    loadLeads();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this lead?")) {
      await deleteLead(id);
      loadLeads();
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
          <h1 className="text-3xl font-bold">Lead Pipeline</h1>
          <p className="text-zinc-500 mt-1">{leads.length} leads total</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === "" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("")}
        >
          All
        </Button>
        {STATUSES.map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      {/* Kanban-style columns */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
        {leads.map((lead) => (
          <Card key={lead.lead_id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{lead.full_name}</CardTitle>
                <Badge className={statusColors[lead.status] || "bg-zinc-100 text-zinc-700"}>
                  {lead.status}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400">
                {lead.project_type} &bull; {new Date(lead.created_at).toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {lead.email && (
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Mail className="h-3.5 w-3.5" /> {lead.email}
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Phone className="h-3.5 w-3.5" /> {lead.phone}
                </div>
              )}
              {lead.property_address && (
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <MapPin className="h-3.5 w-3.5" /> {lead.property_address}
                </div>
              )}
              {lead.budget_range && (
                <p className="text-sm text-zinc-500">Budget: {lead.budget_range}</p>
              )}
              {lead.notes && (
                <p className="text-sm text-zinc-400 truncate">{lead.notes}</p>
              )}

              <div className="flex items-center gap-2 pt-2 border-t">
                <Select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(lead.lead_id, e.target.value)}
                  className="h-8 text-xs flex-1"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
                {lead.status !== "Converted" && lead.status !== "Lost" && (
                  <Button size="sm" variant="outline" onClick={() => handleConvert(lead.lead_id)} title="Convert to Project">
                    <ArrowRightCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => handleDelete(lead.lead_id)} title="Delete">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {leads.length === 0 && (
        <div className="text-center py-12 text-zinc-400">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No leads found. Create one or check your lead forms!</p>
        </div>
      )}

      {/* Create Lead Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Full Name *</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label>Property Address</Label>
            <Input value={form.property_address} onChange={(e) => setForm({ ...form, property_address: e.target.value })} />
          </div>
          <div>
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <Label>State</Label>
            <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div>
            <Label>Project Type</Label>
            <Select value={form.project_type} onChange={(e) => setForm({ ...form, project_type: e.target.value })}>
              {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div>
            <Label>Budget Range</Label>
            <Input value={form.budget_range} onChange={(e) => setForm({ ...form, budget_range: e.target.value })} placeholder="e.g. $50,000 - $100,000" />
          </div>
          <div>
            <Label>Timeline</Label>
            <Input value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} placeholder="e.g. 3-6 months" />
          </div>
          <div>
            <Label>Source</Label>
            <Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!form.full_name}>Create Lead</Button>
        </div>
      </Dialog>
    </div>
  );
}
