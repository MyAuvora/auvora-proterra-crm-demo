import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getContractors, createContractor, updateContractor, deleteContractor } from "@/lib/api";
import { Plus, Trash2, Star, Phone, Mail, HardHat, Award } from "lucide-react";

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
}

const SPECIALTIES = [
  "Pool Construction", "Hardscaping", "Landscaping", "Outdoor Kitchen",
  "Electrical", "Plumbing", "General Contractor", "Fencing",
  "Concrete/Masonry", "Irrigation", "Lighting", "Other",
];

export default function Contractors() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [form, setForm] = useState({
    company_name: "", contact_name: "", email: "", phone: "",
    specialty: "General Contractor", license_number: "",
    insurance_expiry: "", rating: 0, notes: "",
  });

  const loadContractors = () => {
    getContractors(specialtyFilter || undefined)
      .then(setContractors)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadContractors(); }, [specialtyFilter]);

  const handleCreate = async () => {
    await createContractor(form);
    setDialogOpen(false);
    setForm({
      company_name: "", contact_name: "", email: "", phone: "",
      specialty: "General Contractor", license_number: "",
      insurance_expiry: "", rating: 0, notes: "",
    });
    loadContractors();
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    await updateContractor(id, { status: newStatus });
    loadContractors();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this contractor?")) {
      await deleteContractor(id);
      loadContractors();
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-sky-200 border-t-sky-600" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Contractor Database</h1>
          <p className="text-slate-500 mt-1">{contractors.length} contractors</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Contractor
        </Button>
      </div>

      {/* Specialty Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={specialtyFilter === "" ? "default" : "outline"} size="sm" onClick={() => setSpecialtyFilter("")}>All</Button>
        {SPECIALTIES.map((s) => (
          <Button key={s} variant={specialtyFilter === s ? "default" : "outline"} size="sm" onClick={() => setSpecialtyFilter(s)}>{s}</Button>
        ))}
      </div>

      {/* Contractor Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {contractors.map((c) => (
          <Card key={c.contractor_id} className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{c.company_name}</CardTitle>
                  <p className="text-sm text-slate-500">{c.contact_name}</p>
                </div>
                <Badge variant={c.status === "Active" ? "default" : "secondary"}>
                  {c.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <HardHat className="h-3.5 w-3.5 text-slate-400" />
                <span>{c.specialty}</span>
              </div>
              {c.email && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> {c.email}
                </div>
              )}
              {c.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> {c.phone}
                </div>
              )}
              {c.license_number && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Award className="h-3.5 w-3.5 text-slate-400" /> License: {c.license_number}
                </div>
              )}

              {/* Rating */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= c.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"}`}
                  />
                ))}
                <span className="text-xs text-slate-400 ml-1">({c.rating}/5)</span>
              </div>

              {/* Bid Stats */}
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-stone-100">
                <span>Bids: {c.total_bids}</span>
                <span>Won: {c.won_bids}</span>
                <span>Win Rate: {(c.win_rate * 100).toFixed(0)}%</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleStatusToggle(c.contractor_id, c.status)}
                >
                  {c.status === "Active" ? "Deactivate" : "Activate"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(c.contractor_id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {contractors.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <HardHat className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-lg font-medium text-slate-500">No contractors yet</p>
          <p className="text-sm mt-1">Add your first contractor!</p>
        </div>
      )}

      {/* Add Contractor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>Add Contractor</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Company Name *</Label>
            <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          </div>
          <div>
            <Label>Contact Name *</Label>
            <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
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
            <Label>Specialty</Label>
            <Select value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}>
              {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            <Label>License Number</Label>
            <Input value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
          </div>
          <div>
            <Label>Insurance Expiry</Label>
            <Input type="date" value={form.insurance_expiry} onChange={(e) => setForm({ ...form, insurance_expiry: e.target.value })} />
          </div>
          <div>
            <Label>Rating (1-5)</Label>
            <Input type="number" min={0} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!form.company_name || !form.contact_name}>Add Contractor</Button>
        </div>
      </Dialog>
    </div>
  );
}
