(function () {
  const { Sidebar, Icons, GlassCard, Button, useAuth } = window;
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
    const [upcomingExpiries, setUpcomingExpiries] = useState([]);
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

          // Get top 5 recent uploads
          setRecentUploads(docs.slice(0, 5));

          // Filter and compute upcoming expiry dates from documents
          const docsWithExpiry = docs.filter(d => d.expiry_date);
          docsWithExpiry.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
          setUpcomingExpiries(docsWithExpiry.slice(0, 5));
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

        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/dashboard/upload" className="flex-1">
             <Button variant="primary" className="w-full flex justify-center items-center h-12 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                <Icons.Plus size={18} className="mr-2" /> Upload Document
             </Button>
          </Link>
          <Link to="/dashboard/reminders" className="flex-1">
             <Button variant="secondary" className="w-full flex justify-center items-center h-12 border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all">
                <Icons.Calendar size={18} className="mr-2" /> Add Reminder
             </Button>
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="flex flex-col hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Total Documents</span>
              <Icons.FileText className="text-cyan-400" size={20} />
            </div>
            <div className="text-4xl font-display font-bold text-white mb-2">{stats.totalDocs}</div>
            <div className="mt-auto h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-400" 
                style={{ width: `${Math.min((stats.usedBytes / (50 * 1024 * 1024 * 1024)) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">{formatBytes(stats.usedBytes)} of 50 GB used</p>
          </GlassCard>

          <GlassCard className="flex flex-col hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Expiring Soon</span>
              <Icons.Calendar className="text-red-400" size={20} />
            </div>
            <div className="text-4xl font-display font-bold pl-1 text-white mb-2">{stats.expiringSoon}</div>
            {stats.expiringSoon > 0 ? (
              <p className="text-sm text-red-400/80 mt-auto bg-red-500/10 px-3 py-1.5 rounded-lg inline-block self-start">Takes action soon</p>
            ) : (
              <p className="text-sm text-emerald-400/80 mt-auto bg-emerald-500/10 px-3 py-1.5 rounded-lg inline-block self-start">All good</p>
            )}
          </GlassCard>

          <GlassCard className="flex flex-col relative overflow-hidden text-center justify-center border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            <Icons.Shield className="w-12 h-12 text-emerald-400 mx-auto mb-3 relative z-10 group-hover:scale-110 transition-transform" />
            <h3 className="font-display font-bold text-emerald-400 text-lg relative z-10">Vault Encrypted</h3>
            <p className="text-xs text-slate-400 relative z-10 font-medium">AES-256 Grade Security active</p>
          </GlassCard>
        </motion.div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2"></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-display font-extrabold text-white tracking-tight">Recent Activity</h2>
            <button onClick={() => window.location.hash = "#/dashboard/documents"} className="text-sm text-cyan-400 hover:text-cyan-300">View All →</button>
          </div>
          
          <GlassCard className="p-0 overflow-hidden">
            {recentUploads.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-white/5 m-4 rounded-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-16 h-16 bg-navy-900 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <Icons.Activity size={24} className="text-slate-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">No recent activity yet</h3>
                <p className="text-slate-400 text-sm max-w-sm mb-6">Your vault is currently empty. Upload your first document to start tracking its security status.</p>
                <Link to="/dashboard/upload">
                  <Button variant="primary" className="shadow-[0_0_20px_rgba(6,182,212,0.2)]">Upload Document</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentUploads.map((doc, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: i * 0.05 }}
                    key={doc.id} 
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 hover:bg-white/[0.02] transition-colors duration-300 relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                        <Icons.FileText size={18} />
                      </div>
                      <div>
                        <h4 className="text-white font-medium truncate max-w-[200px] sm:max-w-md group-hover:text-cyan-400 transition-colors">{doc.title}</h4>
                        <div className="flex items-center text-xs text-slate-500 mt-1">
                          <span className="bg-white/5 px-2 py-0.5 rounded text-slate-400 font-medium mr-2">Uploaded</span>
                          <span className="capitalize">{doc.category || 'Other'} Document</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-500 text-xs mt-3 sm:mt-0 ml-14 sm:ml-0 font-medium bg-navy-900/50 px-3 py-1.5 rounded-lg border border-white/5">
                      <Icons.Clock size={12} className="text-indigo-400" />
                      <span>{formatDate(doc.created_at)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
          </div>

          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-display font-extrabold text-white tracking-tight">Upcoming Expiry</h2>
              <button onClick={() => window.location.hash = "#/dashboard/reminders"} className="text-sm text-cyan-400 hover:text-cyan-300">View All →</button>
            </div>
            
            <GlassCard className="p-0 overflow-hidden">
              {upcomingExpiries.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-white/5 m-4 rounded-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="w-16 h-16 bg-navy-900 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <Icons.Shield size={24} className="text-emerald-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">No upcoming expiries</h3>
                  <p className="text-slate-400 text-sm max-w-sm mb-6">All your tracked documents are currently safe. Upload documents with expiry dates to track them here.</p>
                  <Link to="/dashboard/reminders">
                    <Button variant="secondary">Add Manual Reminder</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {upcomingExpiries.map((doc, i) => {
                    const daysDiff = Math.ceil((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                    let statusColor = 'emerald';
                    let statusLabel = 'Safe';
                    if (daysDiff < 0) {
                      statusColor = 'red';
                      statusLabel = 'Expired';
                    } else if (daysDiff <= 30) {
                      statusColor = 'amber';
                      statusLabel = 'Expiring Soon';
                    }

                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ delay: i * 0.05 }}
                        key={'exp_'+doc.id} 
                        className="group flex items-center justify-between p-4 px-6 hover:bg-white/[0.02] transition-colors duration-300 relative overflow-hidden"
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity ${statusColor === 'red' ? 'bg-red-500' : statusColor === 'amber' ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-lg bg-${statusColor}-500/10 text-${statusColor}-400 flex items-center justify-center shrink-0 border border-${statusColor}-500/20 group-hover:scale-110 transition-transform`}>
                            <Icons.Calendar size={18} />
                          </div>
                          <div>
                            <h4 className={`text-white font-medium truncate max-w-[150px] sm:max-w-[250px] transition-colors group-hover:text-${statusColor}-400`}>{doc.title}</h4>
                            <div className="flex items-center text-xs text-slate-500 mt-1">
                              <span>Expires: {formatDate(doc.expiry_date)}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`text-xs ml-4 shrink-0 font-bold px-2.5 py-1 rounded-md border ${statusColor === 'red' ? 'bg-red-500/10 text-red-500 border-red-500/20' : statusColor === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                          {statusLabel}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  window.DashboardLayout = DashboardLayout;
  window.DashboardIndex = DashboardIndex;
})();
