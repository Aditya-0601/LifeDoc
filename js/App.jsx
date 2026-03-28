(function () {
  const { HashRouter, Routes, Route, Navigate } = window.Router;
  const {
    Landing, Login, Register, DashboardLayout, DashboardIndex, Documents, UploadDocument, Reminders, FamilyAccess, Notifications, AdminDashboard, Profile, AuthProvider, ProtectedRoute
  } = window;

  const App = () => {
    return (
      <AuthProvider>
        <HashRouter>
          <Routes>
            {/* Marketing & Auth */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* User Application */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardIndex />} />
              <Route path="documents" element={<Documents />} />
              <Route path="upload" element={<UploadDocument />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="family" element={<FamilyAccess />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Admin Application */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    );
  };

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
})();
