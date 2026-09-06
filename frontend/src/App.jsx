import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import WorkPlanning from './pages/WorkPlanning';
import GISMap from './pages/GISMap';
import Conflicts from './pages/Conflicts';
import Coordination from './pages/Coordination';
import RoadMemory from './pages/RoadMemory';
import Impact from './pages/Impact';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/planning" element={<WorkPlanning />} />
          <Route path="/map" element={<GISMap />} />
          <Route path="/conflicts" element={<Conflicts />} />
          <Route path="/coordination" element={<Coordination />} />
          <Route path="/road-memory" element={<RoadMemory />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
