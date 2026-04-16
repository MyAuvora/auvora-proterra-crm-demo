import { useState } from "react";
import { CheckCircle2, MapPin, Phone, Mail, User, TreePine, ArrowRight } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const PROJECT_TYPES = [
  "Pool",
  "Outdoor Kitchen",
  "Patio / Deck",
  "Landscaping",
  "Full Backyard",
  "Pergola / Pavilion",
  "Fire Pit / Fireplace",
  "Retaining Wall",
  "Other",
];

const BUDGET_RANGES = [
  "Under $25,000",
  "$25,000 – $50,000",
  "$50,000 – $100,000",
  "$100,000 – $250,000",
  "$250,000+",
  "Not sure yet",
];

const TIMELINES = [
  "ASAP",
  "1–3 months",
  "3–6 months",
  "6–12 months",
  "Just exploring",
];

interface FormData {
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
  notes: string;
  source: string;
}

export default function LeadIntake() {
  const [form, setForm] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    property_address: "",
    city: "",
    state: "",
    zip_code: "",
    project_type: "",
    budget_range: "",
    timeline: "",
    notes: "",
    source: "intake_form",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/webhooks/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or call us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-6 w-48 rounded-xl bg-white p-4 shadow-xl">
            <img src="/proterra-logo.png" alt="ProTerra Design" className="h-14 w-full object-contain" />
          </div>
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Thank You!</h2>
            <p className="text-slate-600 mb-4">
              Your project inquiry has been received. A member of our team will reach out within 24 hours to discuss your outdoor design vision.
            </p>
            <div className="border-t border-slate-100 pt-4 mt-4">
              <p className="text-sm text-slate-500">
                Questions? Call us at{" "}
                <a href="tel:+18505551234" className="text-sky-600 font-medium hover:underline">
                  (850) 555-1234
                </a>
              </p>
            </div>
          </div>
        </div>
        <p className="mt-8 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} ProTerra Outdoor Design. All rights reserved.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/20 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-6 text-center relative z-10">
          <div className="mx-auto mb-6 w-48 rounded-xl bg-white p-4 shadow-xl">
            <img src="/proterra-logo.png" alt="ProTerra Design" className="h-14 w-full object-contain" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Start Your Outdoor Transformation
          </h1>
          <p className="text-sky-300 text-lg max-w-xl mx-auto">
            Tell us about your dream project and we'll create a custom design plan for your Florida or Alabama Gulf Coast property.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Contact Info */}
          <div className="p-6 md:p-8 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-sky-600" />
              <h2 className="text-lg font-semibold text-slate-800">Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  placeholder="John Smith"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Mail className="h-3.5 w-3.5 inline mr-1" />
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="john@example.com"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Phone className="h-3.5 w-3.5 inline mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="(850) 555-1234"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          {/* Property Info */}
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-sky-600" />
              <h2 className="text-lg font-semibold text-slate-800">Property Location</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Property Address</label>
                <input
                  type="text"
                  value={form.property_address}
                  onChange={(e) => update("property_address", e.target.value)}
                  placeholder="123 Beach Blvd"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Destin"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                <select
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition bg-white"
                >
                  <option value="">—</option>
                  <option value="FL">FL</option>
                  <option value="AL">AL</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  value={form.zip_code}
                  onChange={(e) => update("zip_code", e.target.value)}
                  placeholder="32541"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="p-6 md:p-8 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <TreePine className="h-5 w-5 text-sky-600" />
              <h2 className="text-lg font-semibold text-slate-800">Project Details</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PROJECT_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => update("project_type", type)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        form.project_type === type
                          ? "border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-200"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Estimated Budget</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {BUDGET_RANGES.map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => update("budget_range", range)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        form.budget_range === range
                          ? "border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-200"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">When would you like to start?</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {TIMELINES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update("timeline", t)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        form.timeline === t
                          ? "border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-200"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tell us about your vision
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  rows={3}
                  placeholder="Describe your dream outdoor space — what features, style, or inspiration do you have in mind?"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="p-6 md:p-8 bg-gradient-to-r from-slate-50 to-sky-50/30">
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || !form.full_name || !form.email || !form.project_type}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-6 py-3.5 text-white font-semibold shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
            >
              {submitting ? (
                "Submitting..."
              ) : (
                <>
                  Get Your Free Consultation
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-500 mt-3">
              We'll respond within 24 hours. No spam, ever.
            </p>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} ProTerra Outdoor Design. All rights reserved.
        </p>
      </div>
    </div>
  );
}
