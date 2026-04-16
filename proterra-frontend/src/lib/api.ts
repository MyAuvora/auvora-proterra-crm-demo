const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

// Leads
export const getLeads = (status?: string) =>
  request(`/api/leads${status ? `?status=${status}` : ""}`);
export const getLead = (id: string) => request(`/api/leads/${id}`);
export const createLead = (data: Record<string, unknown>) =>
  request("/api/leads", { method: "POST", body: JSON.stringify(data) });
export const updateLead = (id: string, data: Record<string, unknown>) =>
  request(`/api/leads/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteLead = (id: string) =>
  request(`/api/leads/${id}`, { method: "DELETE" });
export const convertLead = (id: string) =>
  request(`/api/leads/${id}/convert`, { method: "POST" });

// Projects
export const getProjects = (status?: string) =>
  request(`/api/projects${status ? `?status=${status}` : ""}`);
export const getProject = (id: string) => request(`/api/projects/${id}`);
export const createProject = (data: Record<string, unknown>) =>
  request("/api/projects", { method: "POST", body: JSON.stringify(data) });
export const updateProject = (id: string, data: Record<string, unknown>) =>
  request(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteProject = (id: string) =>
  request(`/api/projects/${id}`, { method: "DELETE" });

// Tasks
export const getTasks = (projectId: string) =>
  request(`/api/projects/${projectId}/tasks`);
export const createTask = (projectId: string, data: Record<string, unknown>) =>
  request(`/api/projects/${projectId}/tasks`, { method: "POST", body: JSON.stringify(data) });
export const updateTask = (projectId: string, taskId: string, data: Record<string, unknown>) =>
  request(`/api/projects/${projectId}/tasks/${taskId}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteTask = (projectId: string, taskId: string) =>
  request(`/api/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" });

// Contractors
export const getContractors = (specialty?: string) =>
  request(`/api/contractors${specialty ? `?specialty=${specialty}` : ""}`);
export const getContractor = (id: string) => request(`/api/contractors/${id}`);
export const createContractor = (data: Record<string, unknown>) =>
  request("/api/contractors", { method: "POST", body: JSON.stringify(data) });
export const updateContractor = (id: string, data: Record<string, unknown>) =>
  request(`/api/contractors/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteContractor = (id: string) =>
  request(`/api/contractors/${id}`, { method: "DELETE" });

// Bidding
export const getBidPackages = (projectId?: string) =>
  request(`/api/bidding/packages${projectId ? `?project_id=${projectId}` : ""}`);
export const getBidPackage = (id: string) => request(`/api/bidding/packages/${id}`);
export const createBidPackage = (data: Record<string, unknown>) =>
  request("/api/bidding/packages", { method: "POST", body: JSON.stringify(data) });
export const updateBidPackage = (id: string, data: Record<string, unknown>) =>
  request(`/api/bidding/packages/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const inviteContractors = (packageId: string, contractorIds: string[]) =>
  request(`/api/bidding/packages/${packageId}/invite`, {
    method: "POST",
    body: JSON.stringify({ contractor_ids: contractorIds }),
  });
export const compareBids = (packageId: string) =>
  request(`/api/bidding/packages/${packageId}/compare`);
export const createBid = (data: Record<string, unknown>) =>
  request("/api/bidding/bids", { method: "POST", body: JSON.stringify(data) });
export const updateBid = (id: string, data: Record<string, unknown>) =>
  request(`/api/bidding/bids/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const awardBid = (id: string) =>
  request(`/api/bidding/bids/${id}/award`, { method: "POST" });

// Dashboard
export const getDashboard = () => request("/api/dashboard");

// AI Assistant
export const askAI = (question: string, context?: string) =>
  request("/api/ai/ask", {
    method: "POST",
    body: JSON.stringify({ question, context }),
  });
export const getAISuggestions = () => request("/api/ai/suggestions");

// Automations
export const getAutomations = () => request("/api/automations");
export const getAutomation = (id: string) => request(`/api/automations/${id}`);
export const createAutomation = (data: Record<string, unknown>) =>
  request("/api/automations", { method: "POST", body: JSON.stringify(data) });
export const updateAutomation = (id: string, data: Record<string, unknown>) =>
  request(`/api/automations/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteAutomation = (id: string) =>
  request(`/api/automations/${id}`, { method: "DELETE" });
export const toggleAutomation = (id: string) =>
  request(`/api/automations/${id}/toggle`, { method: "POST" });
export const getAutomationLogs = (id: string) =>
  request(`/api/automations/${id}/logs`);
export const aiCreateAutomation = (prompt: string) =>
  request("/api/automations/ai/create", { method: "POST", body: JSON.stringify({ prompt }) });
export const getAutomationSuggestions = () =>
  request("/api/automations/ai/suggestions");

// Webhooks (for testing)
export const submitLeadForm = (data: Record<string, unknown>) =>
  request("/api/webhooks/lead", { method: "POST", body: JSON.stringify(data) });
