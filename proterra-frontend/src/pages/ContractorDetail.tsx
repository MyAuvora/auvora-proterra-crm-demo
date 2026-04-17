import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getContractor, updateContractor, deleteContractor } from "@/lib/api";
import DocumentPanel from "@/components/DocumentPanel";
import {
  ArrowLeft, Mail, Phone, Star, Award, Calendar,
  Trash2, Save, Edit3, HardHat, Shield, BarChart3,
} from "lucide-react";

interface Contractor {
  contractor_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  specialty: string;
  license_number: string;
  insurance_expiry: string;
  rating: number;
  status: string;
  notes: string;
  total_bids: number;
  won_bids: number;
  win_rate: number;
  created_at: string;
  updated_at: string;
}

const SPECIALTIES = [
  "Pool Construction", "Hardscaping", "Landscaping", "Outdoor Kitchen",
  "Electrical", "Plumbing", "General Contractor", "Fencing",
  "Concrete/Masonry", "Irrigation", "Lighting", "Other",
];

export default function ContractorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});

  const loadContractor = () => {
    if (!id) return;
    getContractor(id)
      .then((data: Contractor) => {
        setContractor(data);
        setForm({
          company_name: data.company_name,
          contact_name: data.contact_name,
          email: data.email,
          phone: data.phone,
          specialty: data.specialty,
          license_number: data.license_number,
          insurance_expiry: data.insurance_expiry,
          rating: data.rating,
          notes: data.notes || "",
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadContractor(); }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateContractor(id, form);
      loadContractor();
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!id || !contractor) return;
    const newStatus = contractor.status === "Active" ? "Inactive" : "Active";
    await updateContractor(id, { status: newStatus });
    loadContractor();
  };

  const handleDelete = async () => {
    if (!id || !confirm("Delete this contractor permanently?")) return;
    await deleteContractor(id);
    navigate("/contractors");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-sky-200 border-t-sky-600" />
      </div>
    );

  if (!contractor) return <p className="text-red-500 p-8">Contractor not found</p>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/contractors")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{contractor.company_name}</h1>
            <Badge variant={contractor.status === "Active" ? "default" : "secondary"}>
              {contractor.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {contractor.contact_name} &bull; {contractor.specialty}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" /> Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => { setEditing(false); if (contractor) { setForm({ company_name: contractor.company_name, contact_name: contractor.contact_name, email: contractor.email, phone: contractor.phone, specialty: contractor.specialty, license_number: contractor.license_number, insurance_expiry: contractor.insurance_expiry, rating: contractor.rating, notes: contractor.notes || '' }); } }}>
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
        {/* Main Content */}
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
                    <Label>Company Name</Label>
                    <Input value={String(form.company_name || "")} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Contact Name</Label>
                    <Input value={String(form.contact_name || "")} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={String(form.email || "")} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={String(form.phone || "")} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <HardHat className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700 font-medium">{contractor.contact_name}</span>
                  </div>
                  {contractor.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <a href={`mailto:${contractor.email}`} className="text-sky-600 hover:underline">{contractor.email}</a>
                    </div>
                  )}
                  {contractor.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <a href={`tel:${contractor.phone}`} className="text-sky-600 hover:underline">{contractor.phone}</a>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credentials */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="text-lg">Credentials & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {editing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Specialty</Label>
                    <Select value={String(form.specialty || "")} onChange={(e) => setForm({ ...form, specialty: e.target.value })}>
                      {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>License Number</Label>
                    <Input value={String(form.license_number || "")} onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
                  </div>
                  <div>
                    <Label>Insurance Expiry</Label>
                    <Input type="date" value={String(form.insurance_expiry || "")} onChange={(e) => setForm({ ...form, insurance_expiry: e.target.value })} />
                  </div>
                  <div>
                    <Label>Rating (1-5)</Label>
                    <Input type="number" min={0} max={5} value={String(form.rating || 0)} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <HardHat className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Specialty:</span>
                    <span className="text-slate-700">{contractor.specialty}</span>
                  </div>
                  {contractor.license_number && (
                    <div className="flex items-center gap-3">
                      <Award className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">License:</span>
                      <span className="text-slate-700">{contractor.license_number}</span>
                    </div>
                  )}
                  {contractor.insurance_expiry && (
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">Insurance Expiry:</span>
                      <span className="text-slate-700">{new Date(contractor.insurance_expiry).toLocaleDateString()}</span>
                    </div>
                  )}
                  {/* Rating Stars */}
                  <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= contractor.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"}`}
                        />
                      ))}
                      <span className="text-xs text-slate-400 ml-1">({contractor.rating}/5)</span>
                    </div>
                  </div>
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
                  value={String(form.notes || "")}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={5}
                />
              ) : (
                <p className="text-slate-600 whitespace-pre-wrap">
                  {contractor.notes || "No notes yet."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <DocumentPanel
            entityType="contractor"
            entityId={contractor.contractor_id}
            categories={["contract", "insurance", "permit", "quote", "other"]}
            title="Contracts & Insurance"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bid Performance */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-sky-600" />
                <CardTitle className="text-lg">Bid Performance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-2xl font-bold text-slate-900">{contractor.total_bids}</p>
                  <p className="text-xs text-slate-500">Total Bids</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3">
                  <p className="text-2xl font-bold text-emerald-700">{contractor.won_bids}</p>
                  <p className="text-xs text-slate-500">Won</p>
                </div>
                <div className="rounded-lg bg-sky-50 p-3">
                  <p className="text-2xl font-bold text-sky-700">{((contractor.win_rate || 0) * 100).toFixed(0)}%</p>
                  <p className="text-xs text-slate-500">Win Rate</p>
                </div>
              </div>
              {contractor.total_bids > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">Win Rate</span>
                    <span className="text-xs font-medium text-slate-700">{((contractor.win_rate || 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all"
                      style={{ width: `${(contractor.win_rate || 0) * 100}%` }}
                    />
                  </div>
                </div>
              )}
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
                <span className="text-slate-500">Added:</span>
                <span className="text-slate-700">{new Date(contractor.created_at).toLocaleDateString()}</span>
              </div>
              {contractor.updated_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">Updated:</span>
                  <span className="text-slate-700">{new Date(contractor.updated_at).toLocaleDateString()}</span>
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
              <Button className="w-full" variant="outline" onClick={handleStatusToggle}>
                {contractor.status === "Active" ? "Deactivate" : "Activate"} Contractor
              </Button>
              <Button variant="destructive" className="w-full" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete Contractor
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
