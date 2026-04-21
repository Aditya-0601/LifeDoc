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
    
    // Fallback native SVG pie implementation exactly matching robust analytics scaling
    const CategoryPieChart = ({ documents }) => {
      // 1. Inspect data and safely break on 0 to avoid zero-division NaN geometry
      if (!documents || documents.length === 0) return (
        <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 py-12">
          <Icons.PieChart size={32} className="mb-2 opacity-20" />
          <p>No documents available for analysis</p>
        </div>
      );

      // 2. Map data shape
      const categories = documents.reduce((acc, doc) => {
        const cat = doc.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      // 3. Confirm expected map array [{name, value}] properties with numbers
      const data = Object.keys(categories).map((name, index) => ({
        name: name,
        value: Number(categories[name]),
        color: ['#06b6d4', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b'][index % 5]
      })).sort((a, b) => b.value - a.value);

      console.log("DEBUG: Final pie chart dataset mapped:", data);

      const total = data.reduce((acc, curr) => acc + curr.value, 0);
      let cumulativePercent = 0;

      const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
      };

      return (
        <div className="flex items-center justify-center space-x-8 h-full p-4">
          <div className="relative">
             <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-36 h-36 transform -rotate-90 drop-shadow-[0_0_15px_rgba(6,182,212,0.1)]">
               {data.map((slice, i) => {
                 const startPercent = cumulativePercent;
                 const slicePercent = slice.value / total;
                 cumulativePercent += slicePercent;
                 const endPercent = cumulativePercent;

                 const [startX, startY] = getCoordinatesForPercent(startPercent);
                 const [endX, endY] = getCoordinatesForPercent(endPercent);

                 const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

                 let pathData;
                 if (slicePercent === 1) { // Render complete perfect circle instead of broken disjoint arc computation natively
                    pathData = `M 1 0 A 1 1 0 1 1 1 -0.001 Z`;
                 } else {
                    pathData = `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;
                 }

                 return (
                   <path
                     key={i}
                     d={pathData}
                     fill={slice.color}
                     className="hover:opacity-80 transition-opacity cursor-pointer stroke-navy-900 stroke-[0.03]"
                   />
                 );
               })}
             </svg>
          </div>
          <div className="flex flex-col space-y-3 justify-center min-w-[120px]">
             {data.map((slice, i) => (
                <div key={i} className="flex items-center text-xs justify-between group">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 shadow-sm group-hover:scale-110 transition-transform" style={{ backgroundColor: slice.color }}></div>
                    <span className="text-slate-300 w-20 truncate" title={slice.name}>{slice.name}</span>
                  </div>
                  <span className="text-white font-bold bg-white/5 px-2 py-0.5 rounded ml-2">{slice.value}</span>
                </div>
             ))}
          </div>
        </div>
      );
    }

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

    // Calculate total size based on documents safely
    const totalBytes = documents.reduce((sum, doc) => sum + Number(doc.fileSize || doc.file_size || 0), 0);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
    const totalGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
    const displayStorage = totalBytes < (1024 * 1024 * 1024) ? `${totalMB} MB` : `${totalGB} GB`;
    const maxGB = 50;
    const percentUsed = Math.max(0.5, Math.min((totalBytes / (maxGB * 1024 * 1024 * 1024)) * 100, 100)); // ensure a slight sliver is visible so it's clearly active

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
            <p className="text-xs text-slate-500 mt-2">{displayStorage} of {maxGB} GB used</p>
          </GlassCard>

          <GlassCard className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 font-medium">Expiring Soon</span>
              <Icons.Calendar className="text-red-400" size={20} />
            </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-display font-bold text-white mb-4">Recent Documents</h2>
            <GlassCard className="p-0 overflow-hidden text-sm h-[300px] flex flex-col">
              <div className="overflow-y-auto flex-1 p-2">
                {loading ? (
                  <div className="p-4 text-center text-slate-500">Loading documents...</div>
                ) : documents.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">No documents found. Dashboard is empty.</div>
                ) : documents.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors rounded-lg mx-2 my-1">
                    <div className="flex items-center space-x-3 text-slate-300">
                      <span className="text-cyan-500 bg-cyan-500/10 p-2 rounded-lg"><Icons.FileText size={16} /></span>
                      <span className="font-medium truncate max-w-[200px]" title={doc.name || doc.file_name}>{doc.name || doc.file_name}</span>
                    </div>
                    <span className="text-slate-500 text-xs">
                      {new Date(doc.createdAt || doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <div>
             <h2 className="text-lg font-display font-bold text-white mb-4">Category Distribution</h2>
             <GlassCard className="p-0 text-sm h-[300px] flex items-center justify-center">
                {loading ? (
                   <div className="p-4 text-center text-slate-500">Aggregating statistics...</div>
                ) : (
                   <CategoryPieChart documents={documents} />
                )}
             </GlassCard>
          </div>
        </div>
      </motion.div>
    );
  };

  window.DashboardLayout = DashboardLayout;
  window.DashboardIndex = DashboardIndex;
})();
