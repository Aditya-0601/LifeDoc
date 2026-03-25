(function () {
  const { HashRouter, Routes, Route, Navigate } = window.Router;
  const {
    Landing, Login, Register, DashboardLayout, DashboardIndex, Documents, UploadDocument, Reminders, FamilyAccess, Notifications, AdminDashboard
  } = window;

  // Cleanup potentially corrupted local storage data from previous runs
  try {
    const user = localStorage.getItem('user');
    if (user === 'undefined' || (user && !user.startsWith('{'))) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  } catch (e) {
    localStorage.clear();
  }

  const App = () => {
    return (
      <HashRouter>
        <Routes>
          {/* Marketing & Auth */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User Application */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardIndex />} />
            <Route path="documents" element={<Documents />} />
            <Route path="upload" element={<UploadDocument />} />
            <Route path="reminders" element={<Reminders />} />
            <Route path="family" element={<FamilyAccess />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          {/* Admin Application */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    );
  };

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
})();
