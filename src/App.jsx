import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LeadsTable from './components/LeadsTable';
import WarmLeads from './components/WarmLeads';
import HotLeads from './components/HotLeads';
import ColdLeads from './components/ColdLeads';
import EnrolledLeads from './components/EnrolledLeads';
import Dashboard from './components/Dashboard'; 


function App() {
  return (
    <Router>
      <Routes>
       <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<LeadsTable />} />
        <Route path="/all-leads" element={<LeadsTable />} />
        <Route path="/warm" element={<WarmLeads />} />
        <Route path="/hot" element={<HotLeads />} />
        <Route path="/cold" element={<ColdLeads />} />
        <Route path="/enrolled" element={<EnrolledLeads />} />
      </Routes>
    </Router>
  );
}

export default App;