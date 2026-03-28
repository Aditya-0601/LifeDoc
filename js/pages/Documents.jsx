(function () {
  const { GlassCard, Button, Icons } = window;
  const { motion } = window.Motion;
  const { useState, useEffect } = window.React;
  const { Link } = window.Router;
  const api = window.api;

  const Documents = () => {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All Categories");

    const fetchDocuments = async () => {
      try {
        setLoading(true);
        let url = '/documents';
        if (searchQuery.trim() !== '') {
          url = `/documents/search?q=${encodeURIComponent(searchQuery)}`;
        }
        
        const res = await api.get(url);
        let fetchedDocs = res.data.documents || [];
        
        if (categoryFilter !== "All Categories") {
          fetchedDocs = fetchedDocs.filter(d => 
            (d.category || 'other').toLowerCase() === categoryFilter.toLowerCase()
          );
        }
        
        setDocs(fetchedDocs);
      } catch (err) {
        console.error("Failed to fetch documents", err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      const delayFn = setTimeout(() => {
        fetchDocuments();
      }, 300); // 300ms debounce
      return () => clearTimeout(delayFn);
    }, [searchQuery, categoryFilter]);

    const handleDelete = async (id, e) => {
      e.stopPropagation();
      if(confirm('Are you sure you want to delete this document?')) {
        try {
          await api.delete(`/documents/${id}`);
          fetchDocuments(); // refresh list
        } catch (err) {
          alert('Failed to delete document');
        }
      }
    };

    const formatBytes = (bytes) => {
      if (!bytes) return '0 KB';
      const kb = bytes / 1024;
      if (kb < 1024) return `${Math.round(kb)} KB`;
      return `${(kb / 1024).toFixed(1)} MB`;
    };

    const formatDate = (isoString) => {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleDownload = (path, e) => {
      e.stopPropagation();
      // Simple link to download
      window.open(`http://localhost:5000${path}`, '_blank');
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight text-gradient block">My Documents</h1>
            <p className="text-slate-400 mt-1">{docs.length} files securely stored.</p>
          </div>
          <Link to="/dashboard/upload">
            <Button variant="primary" className="h-10 px-4 text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center">
              <Icons.Plus size={16} className="mr-2" /> Upload New
            </Button>
          </Link>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by name, category, or tags..."
              className="w-full bg-navy-800/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-navy-800 transition-all"
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-navy-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50 capitalize"
          >
            <option>All Categories</option>
            <option>Identity</option>
            <option>Medical</option>
            <option>Property</option>
            <option>Insurance</option>
            <option>Financial</option>
            <option>Other</option>
          </select>
        </div>

        {loading ? (
           <div className="text-slate-400">Loading documents...</div>
        ) : docs.length === 0 ? (
           <div className="text-slate-400 py-12 text-center border-2 border-dashed border-slate-700/50 rounded-xl">
             <Icons.FileText className="mx-auto mb-3 text-slate-500" size={32} />
             No documents found.
             <div className="mt-4"><Link to="/dashboard/upload" className="text-cyan-400 hover:text-cyan-300">Upload one</Link></div>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {docs.map((doc) => (
              <GlassCard hover key={doc.id} className="p-4 flex flex-col justify-between group relative h-full">
                <div 
                  className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                  onClick={(e) => handleDelete(doc.id, e)}
                  title="Delete Document"
                >
                  <Icons.Trash size={16} />
                </div>
                
                <div className="cursor-pointer" onClick={(e) => handleDownload(doc.file_path, e)}>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
                    <Icons.FileText size={20} />
                  </div>
                  <h3 className="font-semibold text-white/90 text-sm truncate mb-1" title={doc.title}>{doc.title}</h3>
                  <p className="text-xs font-medium text-cyan-400 mb-3 capitalize">{doc.category || 'Other'}</p>
                </div>

                <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center text-[11px] text-slate-500 font-medium tracking-wide pointer-events-none">
                  <span>{formatDate(doc.created_at)}</span>
                  <span>{formatBytes(doc.file_size)}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  window.Documents = Documents;
})();
