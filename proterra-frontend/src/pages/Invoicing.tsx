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
  getInvoices,
  getInvoice,
  createInvoice,
  deleteInvoice,
  recordPayment,
  getPaymentSchedules,
  createPaymentSchedule,
  getInvoiceSummary,
} from "@/lib/api";
import { getProjects } from "@/lib/api";
import {
  FileText,
  Plus,
  Trash2,
  DollarSign,
  CreditCard,
  Calendar,
  ChevronDown,
  ChevronUp,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface InvoiceLineItem {
  item_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface Payment {
  payment_id: string;
  amount: number;
  method: string;
  notes: string;
  paid_at: string;
}

interface Invoice {
  invoice_id: string;
  project_id: string;
  invoice_number: string;
  title: string;
  description: string;
  amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  notes: string;
  created_at: string;
  project: {
    project_id: string;
    project_name: string;
    client_name: string;
  };
  line_items?: InvoiceLineItem[];
  payments?: Payment[];
}

interface PaymentScheduleItem {
  schedule_id: string;
  project_id: string;
  milestone: string;
  percentage: number;
  amount: number;
  due_date: string | null;
  status: string;
  invoice_id: string | null;
  project: {
    project_id: string;
    project_name: string;
  };
}

interface Summary {
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  total_overdue: number;
  by_status: Record<string, number>;
}

interface Project {
  project_id: string;
  project_name: string;
  client_name: string;
  estimated_value: number;
}

const statusColors: Record<string, string> = {
  Draft: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200",
  Sent: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  Paid: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  Overdue: "bg-red-100 text-red-700 ring-1 ring-red-200",
  Cancelled: "bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200",
};

const scheduleStatusColors: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  Invoiced: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  Paid: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
};

export default function Invoicing() {
  const [tab, setTab] = useState("invoices");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [schedules, setSchedules] = useState<PaymentScheduleItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<Record<string, Invoice>>({});
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [invoiceForm, setInvoiceForm] = useState({
    project_id: "",
    title: "",
    description: "",
    tax_rate: 0,
    due_date: "",
    notes: "",
    line_items: [{ description: "", quantity: 1, unit_price: 0 }],
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: "check",
    notes: "",
  });

  const [scheduleForm, setScheduleForm] = useState({
    project_id: "",
    milestone: "Deposit",
    percentage: 30,
    amount: 0,
    due_date: "",
  });

  const loadData = async () => {
    try {
      const [inv, sched, sum, proj] = await Promise.all([
        getInvoices(filterStatus || undefined),
        getPaymentSchedules(),
        getInvoiceSummary(),
        getProjects(),
      ]);
      setInvoices(inv);
      setSchedules(sched);
      setSummary(sum);
      setProjects(proj);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const toggleExpand = async (invoiceId: string) => {
    if (expandedInvoice === invoiceId) {
      setExpandedInvoice(null);
    } else {
      setExpandedInvoice(invoiceId);
      if (!invoiceDetails[invoiceId]) {
        const detail = await getInvoice(invoiceId);
        setInvoiceDetails((prev) => ({ ...prev, [invoiceId]: detail }));
      }
    }
  };

  const addLineItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      line_items: [...invoiceForm.line_items, { description: "", quantity: 1, unit_price: 0 }],
    });
  };

  const removeLineItem = (idx: number) => {
    setInvoiceForm({
      ...invoiceForm,
      line_items: invoiceForm.line_items.filter((_, i) => i !== idx),
    });
  };

  const updateLineItem = (idx: number, field: string, value: string | number) => {
    const items = [...invoiceForm.line_items];
    items[idx] = { ...items[idx], [field]: value };
    setInvoiceForm({ ...invoiceForm, line_items: items });
  };

  const lineItemsTotal = invoiceForm.line_items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const handleCreateInvoice = async () => {
    await createInvoice({
      ...invoiceForm,
      due_date: invoiceForm.due_date || null,
    });
    setInvoiceDialogOpen(false);
    setInvoiceForm({
      project_id: "",
      title: "",
      description: "",
      tax_rate: 0,
      due_date: "",
      notes: "",
      line_items: [{ description: "", quantity: 1, unit_price: 0 }],
    });
    loadData();
  };

  const handleRecordPayment = async () => {
    await recordPayment({
      invoice_id: paymentInvoiceId,
      ...paymentForm,
    });
    setPaymentDialogOpen(false);
    setPaymentForm({ amount: 0, method: "check", notes: "" });
    setPaymentInvoiceId("");
    // Refresh the invoice detail
    if (expandedInvoice) {
      const detail = await getInvoice(expandedInvoice);
      setInvoiceDetails((prev) => ({ ...prev, [expandedInvoice]: detail }));
    }
    loadData();
  };

  const handleCreateSchedule = async () => {
    await createPaymentSchedule({
      ...scheduleForm,
      due_date: scheduleForm.due_date || null,
    });
    setScheduleDialogOpen(false);
    setScheduleForm({
      project_id: "",
      milestone: "Deposit",
      percentage: 30,
      amount: 0,
      due_date: "",
    });
    loadData();
  };

  const handleDeleteInvoice = async (id: string) => {
    if (confirm("Delete this invoice?")) {
      await deleteInvoice(id);
      loadData();
    }
  };

  const openPaymentDialog = (invoiceId: string, outstanding: number) => {
    setPaymentInvoiceId(invoiceId);
    setPaymentForm({ amount: outstanding, method: "check", notes: "" });
    setPaymentDialogOpen(true);
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
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-transparent" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Invoicing & Payments</h1>
            <p className="text-slate-300 mt-1">
              Generate invoices, track payments, and manage schedules
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <Receipt className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Invoiced</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ${summary.total_invoiced.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Paid</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ${summary.total_paid.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Outstanding</p>
                  <p className="text-2xl font-bold text-amber-600">
                    ${summary.total_outstanding.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-lg">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${summary.total_overdue.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-red-500 to-rose-500" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="schedules">Payment Schedules</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 flex-wrap">
              <Button variant={filterStatus === "" ? "default" : "outline"} size="sm" onClick={() => setFilterStatus("")}>All</Button>
              {["Draft", "Sent", "Paid", "Overdue", "Cancelled"].map((s) => (
                <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(s)}>{s}</Button>
              ))}
            </div>
            <Button onClick={() => setInvoiceDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Invoice
            </Button>
          </div>

          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-lg font-medium text-slate-500">No invoices yet</p>
                <p className="text-sm mt-1">Create an invoice to get started</p>
              </div>
            ) : (
              invoices.map((invoice) => {
                const isExpanded = expandedInvoice === invoice.invoice_id;
                const detail = invoiceDetails[invoice.invoice_id];
                const totalPaid = detail?.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                const outstanding = invoice.total - totalPaid;

                return (
                  <Card key={invoice.invoice_id} className="border-0 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg">{invoice.title}</CardTitle>
                            <Badge className={statusColors[invoice.status] || "bg-zinc-100 text-zinc-700"}>
                              {invoice.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            {invoice.invoice_number} &bull; {invoice.project.project_name} &bull; {invoice.project.client_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-bold text-slate-900">${invoice.total.toLocaleString()}</p>
                          <Button variant="ghost" size="icon" onClick={() => toggleExpand(invoice.invoice_id)}>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && detail && (
                      <CardContent>
                        <div className="border-t pt-4 space-y-4">
                          {/* Line Items */}
                          {detail.line_items && detail.line_items.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Line Items</h4>
                              <div className="rounded-lg border">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b bg-stone-50">
                                      <th className="p-2 text-left font-medium text-slate-600">Description</th>
                                      <th className="p-2 text-right font-medium text-slate-600">Qty</th>
                                      <th className="p-2 text-right font-medium text-slate-600">Unit Price</th>
                                      <th className="p-2 text-right font-medium text-slate-600">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {detail.line_items.map((item) => (
                                      <tr key={item.item_id} className="border-b last:border-0">
                                        <td className="p-2 text-slate-700">{item.description}</td>
                                        <td className="p-2 text-right text-slate-600">{item.quantity}</td>
                                        <td className="p-2 text-right text-slate-600">${item.unit_price.toLocaleString()}</td>
                                        <td className="p-2 text-right font-medium text-slate-900">${item.amount.toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="border-t bg-stone-50">
                                      <td colSpan={3} className="p-2 text-right font-medium text-slate-600">Subtotal</td>
                                      <td className="p-2 text-right font-medium text-slate-900">${detail.amount.toLocaleString()}</td>
                                    </tr>
                                    {detail.tax_amount > 0 && (
                                      <tr className="bg-stone-50">
                                        <td colSpan={3} className="p-2 text-right font-medium text-slate-600">Tax ({detail.tax_rate}%)</td>
                                        <td className="p-2 text-right font-medium text-slate-900">${detail.tax_amount.toLocaleString()}</td>
                                      </tr>
                                    )}
                                    <tr className="bg-slate-900 text-white">
                                      <td colSpan={3} className="p-2 text-right font-bold">Total</td>
                                      <td className="p-2 text-right font-bold">${detail.total.toLocaleString()}</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Payments */}
                          {detail.payments && detail.payments.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Payments Received</h4>
                              <div className="space-y-2">
                                {detail.payments.map((p) => (
                                  <div key={p.payment_id} className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
                                    <div>
                                      <p className="text-sm font-medium text-emerald-800">${p.amount.toLocaleString()} via {p.method}</p>
                                      {p.notes && <p className="text-xs text-emerald-600">{p.notes}</p>}
                                    </div>
                                    <p className="text-xs text-emerald-600">{new Date(p.paid_at).toLocaleDateString()}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-2 border-t">
                            {invoice.status !== "Paid" && invoice.status !== "Cancelled" && (
                              <Button size="sm" onClick={() => openPaymentDialog(invoice.invoice_id, outstanding > 0 ? outstanding : invoice.total)}>
                                <CreditCard className="mr-1 h-3 w-3" /> Record Payment
                              </Button>
                            )}
                            {invoice.due_date && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Due: {new Date(invoice.due_date).toLocaleDateString()}
                              </span>
                            )}
                            <div className="flex-1" />
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteInvoice(invoice.invoice_id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Payment Schedules Tab */}
        <TabsContent value="schedules">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setScheduleDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Payment Schedule
            </Button>
          </div>
          <div className="space-y-3">
            {schedules.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <Calendar className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-lg font-medium text-slate-500">No payment schedules</p>
                <p className="text-sm mt-1">Create milestone-based payment schedules for projects</p>
              </div>
            ) : (
              schedules.map((sched) => (
                <Card key={sched.schedule_id} className="border-0 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
                          <CheckCircle2 className="h-5 w-5 text-sky-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{sched.milestone}</p>
                            <Badge className={scheduleStatusColors[sched.status] || "bg-zinc-100 text-zinc-700"}>
                              {sched.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500">
                            {sched.project.project_name} &bull; {sched.percentage}% &bull; ${sched.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {sched.due_date && (
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(sched.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Project *</Label>
              <Select
                value={invoiceForm.project_id}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, project_id: e.target.value })}
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
                value={invoiceForm.title}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, title: e.target.value })}
                placeholder="e.g. Pool Construction - Phase 1"
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={invoiceForm.description}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
              placeholder="Invoice description..."
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Line Items</Label>
              <Button variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="mr-1 h-3 w-3" /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {invoiceForm.line_items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    {idx === 0 && <Label className="text-xs">Description</Label>}
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                      placeholder="e.g. Materials"
                    />
                  </div>
                  <div className="w-20">
                    {idx === 0 && <Label className="text-xs">Qty</Label>}
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(idx, "quantity", Number(e.target.value))}
                    />
                  </div>
                  <div className="w-28">
                    {idx === 0 && <Label className="text-xs">Unit Price</Label>}
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(idx, "unit_price", Number(e.target.value))}
                    />
                  </div>
                  <div className="w-24 text-right text-sm font-medium text-slate-700 pb-2">
                    ${(item.quantity * item.unit_price).toLocaleString()}
                  </div>
                  {invoiceForm.line_items.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeLineItem(idx)}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="text-right mt-2 font-semibold text-slate-900">
              Subtotal: ${lineItemsTotal.toLocaleString()}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                value={invoiceForm.tax_rate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, tax_rate: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={invoiceForm.due_date}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={invoiceForm.notes}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
              placeholder="Payment terms, notes for the client..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateInvoice}
            disabled={!invoiceForm.project_id || !invoiceForm.title || invoiceForm.line_items.every((i) => !i.description)}
          >
            Create Invoice
          </Button>
        </div>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Amount *</Label>
            <Input
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Payment Method</Label>
            <Select
              value={paymentForm.method}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
            >
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="stripe">Stripe</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              placeholder="e.g. Check #1234"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRecordPayment} disabled={paymentForm.amount <= 0}>
            Record Payment
          </Button>
        </div>
      </Dialog>

      {/* Create Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogHeader>
          <DialogTitle>Create Payment Schedule</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Project *</Label>
            <Select
              value={scheduleForm.project_id}
              onChange={(e) => setScheduleForm({ ...scheduleForm, project_id: e.target.value })}
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.project_name} (${p.estimated_value.toLocaleString()})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Milestone *</Label>
            <Select
              value={scheduleForm.milestone}
              onChange={(e) => setScheduleForm({ ...scheduleForm, milestone: e.target.value })}
            >
              <option value="Deposit">Deposit</option>
              <option value="Design Approval">Design Approval</option>
              <option value="Midpoint">Midpoint</option>
              <option value="Rough Completion">Rough Completion</option>
              <option value="Final Completion">Final Completion</option>
              <option value="Punch List">Punch List</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Percentage (%)</Label>
              <Input
                type="number"
                value={scheduleForm.percentage}
                onChange={(e) => setScheduleForm({ ...scheduleForm, percentage: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Amount ($)</Label>
              <Input
                type="number"
                value={scheduleForm.amount}
                onChange={(e) => setScheduleForm({ ...scheduleForm, amount: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <Label>Due Date</Label>
            <Input
              type="date"
              value={scheduleForm.due_date}
              onChange={(e) => setScheduleForm({ ...scheduleForm, due_date: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateSchedule}
            disabled={!scheduleForm.project_id || scheduleForm.amount <= 0}
          >
            Create Schedule
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
