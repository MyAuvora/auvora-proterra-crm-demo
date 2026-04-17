import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getLead, updateLead, convertLead, deleteLead } from "@/lib/api";
import DocumentPanel from "@/components/DocumentPanel";
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign,
  ArrowRightCircle, Trash2, Save, Clock, Tag, Globe, Edit3,
} from "lucide-react";

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
  updated_at: string;
}

const STATUSES = ["New Lead", "Contacted", "Site Visit Scheduled", "Proposal Sent", "Qualified", "Converted", "Lost"];
const SOURCES = ["website", "facebook", "instagram", "referral", "google", "other"];
const PROJECT_TYPES = ["Pool", "Outdoor Kitchen", "Patio/Deck", "Landscaping", "Full Backyard", "Fire Feature", "Pergola/Pavilion", "Other"];

const statusColors: Record<string, string> = {
  "New Lead": "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  Contacted: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  "Site Visit Scheduled": "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
  "Proposal Sent": "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
  Qualified: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
  Converted: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  Lost: "bg-red-100 text-red-700 ring-1 ring-red-200",
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Lead>>({});

  useEffect(() => {
    if (!id) return;
    getLead(id)
      .then((data: Lead) => {
        setLead(data);
        setForm(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await updateLead(id, form);
      setLead(updated);
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async () => {
    if (!id) return;
    await convertLead(id);
    navigate("/projects");
  };

  const handleDelete = async () => {
    if (!id || !confirm("Delete this lead permanently?")) return;
    await deleteLead(id);
    navigate("/leads");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-sky-200 border-t-sky-600" />
      </div>
    );

  if (!lead) return <p className="text-red-500 p-8">Lead not found</p>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/leads")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{lead.full_name}</h1>
            <Badge className={statusColors[lead.status] || "bg-zinc-100 text-zinc-700"}>
              {lead.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Lead since {new Date(lead.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" /> Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => { setEditing(false); setForm(lead); }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {editing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Source</Label>
                    <Select value={form.source || ""} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                      {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {lead.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <a href={`mailto:${lead.email}`} className="text-sky-600 hover:underline">{lead.email}</a>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <a href={`tel:${lead.phone}`} className="text-sky-600 hover:underline">{lead.phone}</a>
                    </div>
                  )}
                  {lead.source && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-700 capitalize">{lead.source}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property & Project Details */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="text-lg">Property & Project Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {editing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Property Address</Label>
                    <Input value={form.property_address || ""} onChange={(e) => setForm({ ...form, property_address: e.target.value })} />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input value={form.state || ""} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                  </div>
                  <div>
                    <Label>Zip Code</Label>
                    <Input value={form.zip_code || ""} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} />
                  </div>
                  <div>
                    <Label>Project Type</Label>
                    <Select value={form.project_type || ""} onChange={(e) => setForm({ ...form, project_type: e.target.value })}>
                      {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Budget Range</Label>
                    <Input value={form.budget_range || ""} onChange={(e) => setForm({ ...form, budget_range: e.target.value })} />
                  </div>
                  <div>
                    <Label>Timeline</Label>
                    <Input value={form.timeline || ""} onChange={(e) => setForm({ ...form, timeline: e.target.value })} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {(lead.property_address || lead.city) && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-700">
                        {[lead.property_address, lead.city, lead.state, lead.zip_code].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                  {lead.project_type && (
                    <div className="flex items-center gap-3">
                      <Tag className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-700">{lead.project_type}</span>
                    </div>
                  )}
                  {lead.budget_range && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-700">{lead.budget_range}</span>
                    </div>
                  )}
                  {lead.timeline && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-700">{lead.timeline}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {editing ? (
                <Textarea
                  value={form.notes || ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={5}
                />
              ) : (
                <p className="text-slate-600 whitespace-pre-wrap">
                  {lead.notes || "No notes yet."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <DocumentPanel
            entityType="lead"
            entityId={lead.lead_id}
            categories={["contract", "quote", "survey", "photo", "other"]}
            title="Documents & Quotes"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <Select
                value={editing ? (form.status || lead.status) : lead.status}
                onChange={async (e) => {
                  if (editing) {
                    setForm({ ...form, status: e.target.value });
                  } else {
                    await updateLead(lead.lead_id, { status: e.target.value });
                    setLead({ ...lead, status: e.target.value });
                  }
                }}
                className="w-full"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Created:</span>
                <span className="text-slate-700">{new Date(lead.created_at).toLocaleDateString()}</span>
              </div>
              {lead.updated_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">Updated:</span>
                  <span className="text-slate-700">{new Date(lead.updated_at).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {lead.status !== "Converted" && lead.status !== "Lost" && (
                <Button className="w-full" onClick={handleConvert}>
                  <ArrowRightCircle className="h-4 w-4 mr-2" /> Convert to Project
                </Button>
              )}
              <Button variant="destructive" className="w-full" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete Lead
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
