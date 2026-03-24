(function () {
  const { Sidebar, Icons, GlassCard } = window;
  const { Outlet } = window.Router;
  const { motion } = window.Motion;

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
    const { useState, useEffect } = window.React;
    const { Icons, GlassCard } = window;
    
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
      const fetchData = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('http://localhost:5000/api/documents', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.documents) {
            setDocuments(data.documents);
          }
        } catch (error) {
          console.error("Failed to fetch documents:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, []);

    // Calculate total size based on documents (dummy sizes if missing for now)
    const totalBytes = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
    const totalGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
    const maxGB = 50;
    const percentUsed = Math.min((totalGB / maxGB) * 100, 100);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <header className="flex justify-between items-center bg-navy-800/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">Welcome, {user.name?.split(' ')[0] || 'User'}</h1>
            <p className="text-slate-400 text-sm">Your intelligent vault is secure and ready.</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <Icons.Bell size={18} className="text-slate-300" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 border-2 border-navy-900 shadow-lg flex items-center justify-center font-bold">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 font-medium">Total Documents</span>
              <Icons.FileText className="text-cyan-400" size={20} />
            </div>
            <div className="text-4xl font-display font-bold text-white mb-2">{documents.length}</div>
            <div className="mt-auto h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400" style={{ width: `${percentUsed}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">{totalGB} GB of {maxGB} GB used</p>
          </GlassCard>

          <GlassCard className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 font-medium">Expiring Soon</span>
              <Icons.Calendar className="text-red-400" size={20} />
            </div>
            {/* Hardcoded for now until deadlines API is fully hooked up */}
            <div className="text-4xl font-display font-bold pl-1 text-white mb-2">0</div>
            <p className="text-sm text-red-400/80 mt-auto bg-red-500/10 px-3 py-1.5 rounded-lg inline-block self-start">Takes action inside 30 days</p>
          </GlassCard>

          <GlassCard className="flex flex-col relative overflow-hidden text-center justify-center border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
            <Icons.Shield className="w-12 h-12 text-emerald-400 mx-auto mb-3 relative z-10" />
            <h3 className="font-display font-bold text-emerald-400 text-lg relative z-10">Vault Encrypted</h3>
            <p className="text-xs text-slate-400 relative z-10">AES-256 Grade Security active</p>
          </GlassCard>
        </div>

        <div>
          <h2 className="text-lg font-display font-bold text-white mb-4">Recent Documents</h2>
          <GlassCard className="p-0 overflow-hidden text-sm">
            {loading ? (
               <div className="p-4 text-center text-slate-500">Loading documents...</div>
            ) : documents.length === 0 ? (
               <div className="p-4 text-center text-slate-500">No documents uploaded yet.</div>
            ) : documents.slice(0, 5).map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                <div className="flex items-center space-x-3 text-slate-300">
                  <span className="text-slate-500"><Icons.FileText size={16} /></span>
                  <span>{doc.file_name}</span>
                </div>
                <span className="text-slate-500 text-xs">
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </GlassCard>
        </div>
      </motion.div>
    );
  };

  window.DashboardLayout = DashboardLayout;
  window.DashboardIndex = DashboardIndex;
})();
