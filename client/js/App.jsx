// Immediately Invoked Function Expression (IIFE) to avoid polluting the global namespace
(function () {
  // Extract React Router components attached to the global window object (loaded via CDN typically)
  const { HashRouter, Routes, Route, Navigate } = window.Router;
  // Extract all the local React components (pages & layouts) available globally
  const {
    Landing, Login, Register, DashboardLayout, DashboardIndex, Documents, UploadDocument, Reminders, FamilyAccess, Notifications, AdminDashboard
  } = window;

  // ==========================================
  // LocalStorage Cleanup
  // ==========================================
  // Cleanup potentially corrupted local storage data from previous runs to prevent app crashes
  try {
    const user = localStorage.getItem('user');
    // If the user object is exactly the string 'undefined' or it doesn't look like valid JSON
    if (user === 'undefined' || (user && !user.startsWith('{'))) {
      localStorage.removeItem('user');  // Remove invalid user data
      localStorage.removeItem('token'); // Remove auth token to force a fresh login
    }
  } catch (e) {
    // If any parsing error occurs, clear everything as a safety net
    localStorage.clear();
  }

  // ==========================================
  // Main Application Component
  // ==========================================
  // App component is the root component that sets up routing for the entire application
  const App = () => {
    return (
      // HashRouter is used to handle routing based on the hash portion of the URL (e.g., #/dashboard)
      <HashRouter>
        {/* Routes is the container for all defined Route paths */}
        <Routes>
          {/* Public Routes for Marketing & Authentication */}
          <Route path="/" element={<Landing />} />          {/* Home/Landing page */}
          <Route path="/login" element={<Login />} />       {/* User Login page */}
          <Route path="/register" element={<Register />} /> {/* User Registration page */}

          {/* Secure User Application Routes (Nested inside the Dashboard Layout) */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            {/* The index route renders when the user navigates exactly to /dashboard */}
            <Route index element={<DashboardIndex />} />
            {/* Child routes for specific application features */}
            <Route path="documents" element={<Documents />} />         {/* Manage documents */}
            <Route path="upload" element={<UploadDocument />} />       {/* Upload new documents */}
            <Route path="reminders" element={<Reminders />} />         {/* Set/view radar reminders */}
            <Route path="family" element={<FamilyAccess />} />         {/* Manage family sharing */}
            <Route path="notifications" element={<Notifications />} /> {/* View incoming alerts */}
          </Route>

          {/* Secure Admin Application Route */}
          {/* Separate view for system administrators to manage overall platform */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Fallback Route (Catch all) */}
          {/* If the user types a URL that doesn't match any of the above, redirect them to the landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    );
  };

  // ==========================================
  // React Application Rendering
  // ==========================================
  // Find the HTML element with id="root" and inject our React application into it
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
})();
