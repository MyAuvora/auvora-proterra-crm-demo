import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { submitLeadForm } from "@/lib/api";
import { Globe, Facebook, Instagram, Code, CheckCircle2, Copy } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Webhooks() {
  const [testForm, setTestForm] = useState({
    full_name: "", email: "", phone: "", property_address: "",
    project_type: "Pool", source: "website", message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState("");

  const handleTestSubmit = async () => {
    await submitLeadForm(testForm);
    setSubmitted(true);
    setTestForm({
      full_name: "", email: "", phone: "", property_address: "",
      project_type: "Pool", source: "website", message: "",
    });
    setTimeout(() => setSubmitted(false), 3000);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const webhookEndpoints = [
    {
      icon: Globe,
      title: "Website Form",
      description: "Receive leads from your proterradesign.com contact form",
      endpoint: `${API_URL}/api/webhooks/lead`,
      method: "POST",
      color: "bg-blue-500",
    },
    {
      icon: Facebook,
      title: "Facebook Lead Ads",
      description: "Automatically capture leads from Facebook ad campaigns",
      endpoint: `${API_URL}/api/webhooks/facebook`,
      method: "POST",
      color: "bg-blue-600",
    },
    {
      icon: Instagram,
      title: "Instagram Lead Ads",
      description: "Capture leads from Instagram advertising",
      endpoint: `${API_URL}/api/webhooks/instagram`,
      method: "POST",
      color: "bg-pink-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Lead Form Webhooks</h1>
        <p className="text-slate-500 mt-1">
          Connect your website and social media to automatically capture leads
        </p>
      </div>

      {/* Webhook Endpoints */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {webhookEndpoints.map((wh) => (
          <Card key={wh.title} className="border-0 shadow-sm hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${wh.color} text-white shadow-md`}>
                  <wh.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{wh.title}</CardTitle>
                  <CardDescription className="text-xs">{wh.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{wh.method}</Badge>
                  <code className="flex-1 text-xs bg-stone-100 p-2 rounded-lg truncate font-mono">{wh.endpoint}</code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(wh.endpoint, wh.title)}
                    className="h-8 w-8"
                  >
                    {copied === wh.title ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Guide */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-sky-600" />
            <CardTitle className="text-lg">Website Integration</CardTitle>
          </div>
          <CardDescription>Add this form to your website to capture leads automatically</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <pre className="bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 p-4 rounded-xl text-sm overflow-x-auto shadow-inner">
{`<!-- ProTerra Design Lead Capture Form -->
<form id="lead-form">
  <input name="full_name" placeholder="Full Name" required />
  <input name="email" type="email" placeholder="Email" />
  <input name="phone" placeholder="Phone" />
  <input name="property_address" placeholder="Property Address" />
  <select name="project_type">
    <option>Pool</option>
    <option>Outdoor Kitchen</option>
    <option>Patio/Deck</option>
    <option>Full Backyard</option>
  </select>
  <textarea name="message" placeholder="Tell us about your project"></textarea>
  <button type="submit">Get Free Consultation</button>
</form>
<script>
document.getElementById('lead-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  data.source = 'website';
  await fetch('${API_URL}/api/webhooks/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  alert('Thank you! We will contact you shortly.');
});
</script>`}
          </pre>
        </CardContent>
      </Card>

      {/* Test Form */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b border-stone-100 bg-stone-50/50">
          <CardTitle className="text-lg">Test Lead Submission</CardTitle>
          <CardDescription>Send a test lead to verify your webhook is working</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={testForm.full_name} onChange={(e) => setTestForm({ ...testForm, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={testForm.email} onChange={(e) => setTestForm({ ...testForm, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={testForm.phone} onChange={(e) => setTestForm({ ...testForm, phone: e.target.value })} />
            </div>
            <div>
              <Label>Property Address</Label>
              <Input value={testForm.property_address} onChange={(e) => setTestForm({ ...testForm, property_address: e.target.value })} />
            </div>
            <div>
              <Label>Project Type</Label>
              <Select value={testForm.project_type} onChange={(e) => setTestForm({ ...testForm, project_type: e.target.value })}>
                {["Pool", "Outdoor Kitchen", "Patio/Deck", "Landscaping", "Full Backyard", "Other"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Source</Label>
              <Select value={testForm.source} onChange={(e) => setTestForm({ ...testForm, source: e.target.value })}>
                {["website", "facebook", "instagram", "referral"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Message</Label>
              <Textarea value={testForm.message} onChange={(e) => setTestForm({ ...testForm, message: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <Button onClick={handleTestSubmit} disabled={!testForm.full_name}>
              Submit Test Lead
            </Button>
            {submitted && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Lead submitted! Check the Leads page.
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
