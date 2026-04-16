import { Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import Layout from "./components/Layout";
import { SignInPage } from "./components/SignInPage";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Projects from "./pages/Projects";
import Contractors from "./pages/Contractors";
import Bidding from "./pages/Bidding";
import Webhooks from "./pages/Webhooks";
import AskAuvora from "./pages/AskAuvora";
import Automations from "./pages/Automations";
import ClientPortal from "./pages/ClientPortal";
import Invoicing from "./pages/Invoicing";
import Reports from "./pages/Reports";

function App() {
  return (
    <>
      <SignedOut>
        <SignInPage />
      </SignedOut>
      <SignedIn>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contractors" element={<Contractors />} />
            <Route path="/bidding" element={<Bidding />} />
            <Route path="/webhooks" element={<Webhooks />} />
            <Route path="/ai" element={<AskAuvora />} />
            <Route path="/automations" element={<Automations />} />
            <Route path="/client-portal" element={<ClientPortal />} />
            <Route path="/invoicing" element={<Invoicing />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Routes>
      </SignedIn>
    </>
  );
}

export default App;
