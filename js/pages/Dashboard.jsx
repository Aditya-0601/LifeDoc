(function () {
  const { Sidebar, Icons, GlassCard, useAuth } = window;
  const { Outlet, Link } = window.Router;
  const { motion } = window.Motion;
  const { useState, useEffect } = window.React;
  const api = window.api;

  const DashboardLayout = () => {
    return (
      <div className="min-h-screen bg-mesh flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    );
  };

  const DashboardIndex = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ totalDocs: 0, expiringSoon: 0, usedBytes: 0 });
    const [recentUploads, setRecentUploads] = useState([]);
    const [hasUnread, setHasUnread] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchDashboardData = async () => {
        try {
          const [docsRes, deadlinesRes, notifRes] = await Promise.all([
            api.get('/documents'),
            api.get('/deadlines?upcoming=true'),
            api.get('/notifications')
          ]);

          const docs = docsRes.data.documents || [];
          const deadlines = deadlinesRes.data.deadlines || [];
          const notifications = notifRes.data.notifications || [];

          setHasUnread(notifications.some(n => !n.is_read));

          // Compute total storage
          const totalBytes = docs.reduce((acc, doc) => acc + (doc.file_size || 0), 0);
          
          setStats({
            totalDocs: docs.length,
            expiringSoon: deadlines.length,
            usedBytes: totalBytes
          });

          // Get top 3 recent uploads
          setRecentUploads(docs.slice(0, 3));
        } catch (error) {
          console.error("Failed to load dashboard data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }, []);

    const formatBytes = (bytes) => {
      if (!bytes) return '0 MB';
      const mb = bytes / (1024 * 1024);
      return mb < 1 ? '< 1 MB' : `${mb.toFixed(1)} MB`;
    };

    const formatDate = (isoString) => {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (loading) {
      return <div className="text-white">Loading dashboard...</div>;
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <header className="flex justify-between items-center bg-navy-800/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">Welcome, {user?.name?.split(' ')[0] || 'User'}</h1>
            <p className="text-slate-400 text-sm">Your intelligent vault is secure and ready.</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              className="relative w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              onClick={() => window.location.hash = "#/dashboard/notifications"}
            >
              <Icons.Bell size={18} className="text-slate-300" />
              {hasUnread && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
              )}
            </button>
            <Link 
              to="/dashboard/profile"
              className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 border-2 border-navy-900 shadow-lg flex items-center justify-center text-white font-bold hover:scale-105 transition-transform"
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 font-medium">Total Documents</span>
              <Icons.FileText className="text-cyan-400" size={20} />
            </div>
            <div className="text-4xl font-display font-bold text-white mb-2">{stats.totalDocs}</div>
            <div className="mt-auto h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-400" 
                style={{ width: `${Math.min((stats.usedBytes / (50 * 1024 * 1024 * 1024)) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">{formatBytes(stats.usedBytes)} of 50 GB used</p>
          </GlassCard>

          <GlassCard className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 font-medium">Expiring Soon</span>
              <Icons.Calendar className="text-red-400" size={20} />
            </div>
            <div className="text-4xl font-display font-bold pl-1 text-white mb-2">{stats.expiringSoon}</div>
            {stats.expiringSoon > 0 ? (
              <p className="text-sm text-red-400/80 mt-auto bg-red-500/10 px-3 py-1.5 rounded-lg inline-block self-start">Takes action soon</p>
            ) : (
              <p className="text-sm text-emerald-400/80 mt-auto bg-emerald-500/10 px-3 py-1.5 rounded-lg inline-block self-start">All good</p>
            )}
          </GlassCard>

          <GlassCard className="flex flex-col relative overflow-hidden text-center justify-center border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
            <Icons.Shield className="w-12 h-12 text-emerald-400 mx-auto mb-3 relative z-10" />
            <h3 className="font-display font-bold text-emerald-400 text-lg relative z-10">Vault Encrypted</h3>
            <p className="text-xs text-slate-400 relative z-10">AES-256 Grade Security active</p>
          </GlassCard>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-display font-bold text-white">Recent Uploads</h2>
            <button onClick={() => window.location.hash = "#/dashboard/documents"} className="text-sm text-cyan-400 hover:text-cyan-300">View All →</button>
          </div>
          
          <GlassCard className="p-0 overflow-hidden text-sm">
            {recentUploads.length === 0 ? (
              <div className="p-6 text-center text-slate-400">No documents uploaded yet.</div>
            ) : (
              recentUploads.map((doc, i) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <div className="flex items-center space-x-3 text-slate-300">
                    <span className="text-slate-500"><Icons.FileText size={16} /></span>
                    <span className="truncate max-w-[200px] sm:max-w-md">{doc.title}</span>
                  </div>
                  <span className="text-slate-500 text-xs">{formatDate(doc.created_at)}</span>
                </div>
              ))
            )}
          </GlassCard>
        </div>
      </motion.div>
    );
  };

  window.DashboardLayout = DashboardLayout;
  window.DashboardIndex = DashboardIndex;
})();
