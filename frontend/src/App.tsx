import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Versions from '@/pages/Versions';
import Analytics from '@/pages/Analytics';
import { NotificationDemo } from '@/components/ui/NotificationDemo';
import '@/styles/global.css';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/versions" element={<Versions />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/notification-demo" element={<NotificationDemo />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;