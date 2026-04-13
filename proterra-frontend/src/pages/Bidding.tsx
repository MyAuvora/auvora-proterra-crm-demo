import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getBidPackages, createBidPackage, getProjects, getContractors,
  inviteContractors, compareBids, createBid, awardBid,
} from "@/lib/api";
import { Plus, Trophy, BarChart3, DollarSign, Calendar, Users, Gavel } from "lucide-react";

interface BidPackage {
  package_id: string;
  project_id: string;
  title: string;
  description: string;
  scope_of_work: string;
  deadline: string;
  status: string;
  created_at: string;
}

interface Comparison {
  package: BidPackage;
  bids: Array<{
    bid_id: string;
    contractor_id: string;
    company_name: string;
    total_price: number;
    timeline_weeks: number;
    proposal_notes: string;
    status: string;
    submitted_at: string;
  }>;
  summary: {
    total_bids: number;
    lowest_price: number;
    highest_price: number;
    average_price: number;
  };
}

interface Project {
  project_id: string;
  project_name: string;
}

interface Contractor {
  contractor_id: string;
  company_name: string;
}

export default function Bidding() {
  const [packages, setPackages] = useState<BidPackage[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("packages");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [selectedContractors, setSelectedContractors] = useState<string[]>([]);

  const [packageForm, setPackageForm] = useState({
    project_id: "", title: "", description: "", scope_of_work: "", deadline: "",
  });
  const [bidForm, setBidForm] = useState({
    package_id: "", contractor_id: "", total_price: 0, timeline_weeks: 0, proposal_notes: "",
  });

  const loadData = async () => {
    try {
      const [pkgs, projs, cons] = await Promise.all([
        getBidPackages(),
        getProjects(),
        getContractors(),
      ]);
      setPackages(pkgs);
      setProjects(projs);
      setContractors(cons);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreatePackage = async () => {
    await createBidPackage(packageForm);
    setCreateDialogOpen(false);
    setPackageForm({ project_id: "", title: "", description: "", scope_of_work: "", deadline: "" });
    loadData();
  };

  const handleInvite = async () => {
    if (selectedPackage && selectedContractors.length > 0) {
      await inviteContractors(selectedPackage, selectedContractors);
      setInviteDialogOpen(false);
      setSelectedContractors([]);
      loadData();
    }
  };

  const handleSubmitBid = async () => {
    await createBid(bidForm);
    setBidDialogOpen(false);
    setBidForm({ package_id: "", contractor_id: "", total_price: 0, timeline_weeks: 0, proposal_notes: "" });
    loadData();
  };

  const handleCompare = async (packageId: string) => {
    const data = await compareBids(packageId);
    setComparison(data);
    setCompareDialogOpen(true);
  };

  const handleAward = async (bidId: string) => {
    if (confirm("Award this bid? This will mark other bids as rejected.")) {
      await awardBid(bidId);
      setCompareDialogOpen(false);
      loadData();
    }
  };

  const toggleContractor = (id: string) => {
    setSelectedContractors((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );

  const statusColors: Record<string, string> = {
    draft: "bg-zinc-100 text-zinc-700",
    open: "bg-blue-100 text-blue-700",
    closed: "bg-yellow-100 text-yellow-700",
    awarded: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Controlled Bidding</h1>
          <p className="text-zinc-500 mt-1">Apples-to-apples contractor bidding from finalized designs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            setBidDialogOpen(true);
            setBidForm({ ...bidForm, package_id: packages[0]?.package_id || "" });
          }}>
            Submit Bid
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Bid Package
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="packages">Bid Packages</TabsTrigger>
          <TabsTrigger value="compare">Compare Bids</TabsTrigger>
        </TabsList>

        <TabsContent value="packages">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {packages.map((pkg) => {
              const project = projects.find((p) => p.project_id === pkg.project_id);
              return (
                <Card key={pkg.package_id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{pkg.title}</CardTitle>
                      <Badge className={statusColors[pkg.status] || "bg-zinc-100 text-zinc-700"}>
                        {pkg.status}
                      </Badge>
                    </div>
                    {project && (
                      <p className="text-xs text-zinc-400">Project: {project.project_name}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pkg.description && (
                      <p className="text-sm text-zinc-600">{pkg.description}</p>
                    )}
                    {pkg.deadline && (
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Calendar className="h-3.5 w-3.5" />
                        Deadline: {new Date(pkg.deadline).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedPackage(pkg.package_id);
                          setInviteDialogOpen(true);
                        }}
                      >
                        <Users className="mr-1 h-3.5 w-3.5" /> Invite
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCompare(pkg.package_id)}
                      >
                        <BarChart3 className="mr-1 h-3.5 w-3.5" /> Compare
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {packages.length === 0 && (
            <div className="text-center py-12 text-zinc-400">
              <Gavel className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bid packages yet. Create one to start the bidding process!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="compare">
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">Select a bid package to compare bids side-by-side:</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <Button
                  key={pkg.package_id}
                  variant="outline"
                  className="h-auto p-4 text-left flex flex-col items-start"
                  onClick={() => handleCompare(pkg.package_id)}
                >
                  <span className="font-medium">{pkg.title}</span>
                  <span className="text-xs text-zinc-400">{pkg.status}</span>
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Bid Package Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogHeader>
          <DialogTitle>Create Bid Package</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Project *</Label>
            <Select value={packageForm.project_id} onChange={(e) => setPackageForm({ ...packageForm, project_id: e.target.value })}>
              <option value="">Select project...</option>
              {projects.map((p) => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Title *</Label>
            <Input value={packageForm.title} onChange={(e) => setPackageForm({ ...packageForm, title: e.target.value })} placeholder="e.g. Pool Construction - Phase 1" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={packageForm.description} onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })} />
          </div>
          <div>
            <Label>Scope of Work</Label>
            <Textarea value={packageForm.scope_of_work} onChange={(e) => setPackageForm({ ...packageForm, scope_of_work: e.target.value })} rows={4} placeholder="Detailed scope of work for contractors to bid on..." />
          </div>
          <div>
            <Label>Bid Deadline</Label>
            <Input type="date" value={packageForm.deadline} onChange={(e) => setPackageForm({ ...packageForm, deadline: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreatePackage} disabled={!packageForm.project_id || !packageForm.title}>Create Package</Button>
        </div>
      </Dialog>

      {/* Invite Contractors Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogHeader>
          <DialogTitle>Invite Contractors to Bid</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-96 overflow-auto">
          {contractors.map((c) => (
            <label key={c.contractor_id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-zinc-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedContractors.includes(c.contractor_id)}
                onChange={() => toggleContractor(c.contractor_id)}
                className="rounded"
              />
              <span className="text-sm font-medium">{c.company_name}</span>
            </label>
          ))}
          {contractors.length === 0 && (
            <p className="text-sm text-zinc-400">No contractors available. Add contractors first.</p>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleInvite} disabled={selectedContractors.length === 0}>
            Invite {selectedContractors.length} Contractor{selectedContractors.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </Dialog>

      {/* Submit Bid Dialog */}
      <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
        <DialogHeader>
          <DialogTitle>Submit Bid</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Bid Package *</Label>
            <Select value={bidForm.package_id} onChange={(e) => setBidForm({ ...bidForm, package_id: e.target.value })}>
              <option value="">Select package...</option>
              {packages.filter((p) => p.status === "open").map((p) => (
                <option key={p.package_id} value={p.package_id}>{p.title}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Contractor *</Label>
            <Select value={bidForm.contractor_id} onChange={(e) => setBidForm({ ...bidForm, contractor_id: e.target.value })}>
              <option value="">Select contractor...</option>
              {contractors.map((c) => (
                <option key={c.contractor_id} value={c.contractor_id}>{c.company_name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Total Price ($) *</Label>
            <Input type="number" value={bidForm.total_price} onChange={(e) => setBidForm({ ...bidForm, total_price: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Timeline (weeks)</Label>
            <Input type="number" value={bidForm.timeline_weeks} onChange={(e) => setBidForm({ ...bidForm, timeline_weeks: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Proposal Notes</Label>
            <Textarea value={bidForm.proposal_notes} onChange={(e) => setBidForm({ ...bidForm, proposal_notes: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setBidDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitBid} disabled={!bidForm.package_id || !bidForm.contractor_id || !bidForm.total_price}>Submit Bid</Button>
        </div>
      </Dialog>

      {/* Compare Bids Dialog */}
      <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
        <DialogHeader>
          <DialogTitle>
            Bid Comparison {comparison?.package?.title ? `— ${comparison.package.title}` : ""}
          </DialogTitle>
        </DialogHeader>
        {comparison && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-lg bg-zinc-50 p-3 text-center">
                <p className="text-xs text-zinc-400">Bids</p>
                <p className="text-lg font-bold">{comparison.summary.total_bids}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <p className="text-xs text-green-600">Lowest</p>
                <p className="text-lg font-bold text-green-700">${comparison.summary.lowest_price.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-center">
                <p className="text-xs text-red-600">Highest</p>
                <p className="text-lg font-bold text-red-700">${comparison.summary.highest_price.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <p className="text-xs text-blue-600">Average</p>
                <p className="text-lg font-bold text-blue-700">${comparison.summary.average_price.toLocaleString()}</p>
              </div>
            </div>

            {/* Bid Cards */}
            <div className="space-y-3 max-h-96 overflow-auto">
              {comparison.bids
                .sort((a, b) => a.total_price - b.total_price)
                .map((bid, idx) => (
                  <div
                    key={bid.bid_id}
                    className={`rounded-lg border p-4 ${
                      bid.status === "awarded" ? "border-green-500 bg-green-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {idx === 0 && <Trophy className="h-4 w-4 text-amber-500" />}
                          <span className="font-medium">{bid.company_name}</span>
                          {bid.status === "awarded" && (
                            <Badge className="bg-green-100 text-green-700">Awarded</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-zinc-500">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            ${bid.total_price.toLocaleString()}
                          </span>
                          {bid.timeline_weeks > 0 && (
                            <span>{bid.timeline_weeks} weeks</span>
                          )}
                        </div>
                        {bid.proposal_notes && (
                          <p className="text-sm text-zinc-400 mt-2">{bid.proposal_notes}</p>
                        )}
                      </div>
                      {bid.status === "submitted" && (
                        <Button size="sm" onClick={() => handleAward(bid.bid_id)}>
                          Award
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {comparison.bids.length === 0 && (
              <p className="text-center text-sm text-zinc-400 py-4">
                No bids submitted yet for this package.
              </p>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
