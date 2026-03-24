(function() {
  const { GlassCard, Icons } = window;
  const { motion } = window.Motion;

  const Reminders = () => {
    const reminders = [
      { doc: "US Passport", date: "Expires in 42 days", exact: "Nov 15, 2026", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
      { doc: "Health Insurance", date: "Expires in 12 days", exact: "Oct 15, 2026", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
      { doc: "Driver's License", date: "Expires in 8 months", exact: "Jun 20, 2027", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" }
    ];

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8 pl-4 border-l-4 border-indigo-500">
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Expiry Radar</h1>
          <p className="text-slate-400 mt-1">Stay ahead of crucial deadlines.</p>
        </div>

        <div className="space-y-4 max-w-4xl pt-4 relative before:absolute before:inset-y-0 before:left-6 before:w-[2px] before:bg-white/5">
          {reminders.map((r, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative pl-14"
            >
              <div className={`absolute left-4 top-5 w-4 h-4 rounded-full border-4 border-navy-900 ${r.bg.replace('/10', '')} z-10 shadow-[0_0_10px_currentColor] ${r.color}`}></div>
              <GlassCard hover className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{r.doc}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Icons.Calendar size={14} className="text-slate-500" />
                    <span className="text-sm font-medium text-slate-400">{r.exact}</span>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-lg border font-medium text-sm ${r.color} ${r.bg} ${r.border}`}>
                  {r.date}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  window.Reminders = Reminders;
})();
