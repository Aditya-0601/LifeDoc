(function () {
  const { GlassCard, Button, Icons } = window;
  const { motion } = window.Motion;

  const Documents = () => {
    const docs = [
      { name: "US Passport - Jane Doe", category: "Identity", date: "Oct 12, 2025", size: "2.4 MB" },
      { name: "Property Deed - NYC", category: "Property", date: "Sep 01, 2025", size: "5.1 MB" },
      { name: "Medical History 2025", category: "Medical", date: "Aug 15, 2025", size: "1.2 MB" },
      { name: "Car Insurance Policy", category: "Insurance", date: "Jul 22, 2025", size: "840 KB" },
      { name: "Birth Certificate", category: "Identity", date: "May 10, 2025", size: "3.5 MB" }
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight text-gradient block">My Documents</h1>
            <p className="text-slate-400 mt-1">24 files stored securely.</p>
          </div>
          <Button variant="primary" className="h-10 px-4 text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Icons.Plus size={16} className="mr-2" /> Upload New
          </Button>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search documents by name, category, or tags..."
              className="w-full bg-navy-800/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-navy-800 transition-all"
            />
          </div>
          <select className="bg-navy-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50">
            <option>All Categories</option>
            <option>Identity</option>
            <option>Medical</option>
            <option>Property</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {docs.map((doc, idx) => (
            <GlassCard hover key={idx} className="p-4 flex flex-col cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
                <Icons.FileText size={20} />
              </div>
              <h3 className="font-semibold text-white/90 text-sm truncate mb-1">{doc.name}</h3>
              <p className="text-xs font-medium text-cyan-400 mb-3">{doc.category}</p>

              <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center text-[11px] text-slate-500 font-medium tracking-wide">
                <span>{doc.date}</span>
                <span>{doc.size}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      </motion.div>
    );
  };

  window.Documents = Documents;
})();
