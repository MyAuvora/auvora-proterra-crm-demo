import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Projects from "./pages/Projects";
import Contractors from "./pages/Contractors";
import Bidding from "./pages/Bidding";
import Webhooks from "./pages/Webhooks";
import AskAuvora from "./pages/AskAuvora";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/contractors" element={<Contractors />} />
        <Route path="/bidding" element={<Bidding />} />
        <Route path="/webhooks" element={<Webhooks />} />
        <Route path="/ai" element={<AskAuvora />} />
      </Route>
    </Routes>
  );
}

export default App;
