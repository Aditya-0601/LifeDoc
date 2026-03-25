(function () {
  const { GlassCard, Button, Icons } = window;
  const { motion } = window.Motion;
  const { Link } = window.Router;

  const AdminDashboard = () => {
    return (
      <div className="min-h-screen bg-mesh p-8">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3 text-cyan-400">
            <Icons.Settings size={28} />
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Admin Overview</h1>
          </div>
          <Link to="/dashboard">
            <Button variant="secondary">Back to User App</Button>
          </Link>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-4 gap-6 mb-8"
        >
          <GlassCard className="p-6 bg-indigo-500/10 border-indigo-500/20">
            <p className="text-indigo-400 font-medium mb-2">Total MRR</p>
            <p className="text-4xl font-display font-bold text-white">$45,200</p>
            <p className="text-sm text-indigo-400/80 mt-2">+12% from last month</p>
          </GlassCard>
          <GlassCard className="p-6 text-center shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <p className="text-slate-400 font-medium mb-2">Active Vaults</p>
            <p className="text-4xl font-display font-bold text-cyan-400">12,450</p>
          </GlassCard>
          <GlassCard className="p-6 text-center">
            <p className="text-slate-400 font-medium mb-2">Documents Secured</p>
            <p className="text-4xl font-display font-bold text-white">1.2M</p>
          </GlassCard>
          <GlassCard className="p-6 text-center">
            <p className="text-slate-400 font-medium mb-2">Total Storage</p>
            <p className="text-4xl font-display font-bold text-emerald-400">45 TB</p>
          </GlassCard>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-2 p-6">
            <h2 className="text-xl font-display font-bold text-white mb-6">Recent Server Activity</h2>
            <div className="space-y-4">
              {[
                { label: "US-East-1 Node Sync", status: "Success", time: "2 mins ago" },
                { label: "Database Encryption Key Rotation", status: "Success", time: "1 hr ago" },
                { label: "Failed Login Spike (IP Blocked)", status: "Alert", time: "4 hrs ago", isAlert: true }
              ].map((log, i) => (
                <div key={i} className="flex justify-between items-center bg-white/5 border border-white/5 p-4 rounded-xl">
                  <span className="text-slate-300 font-medium text-sm">{log.label}</span>
                  <div className="flex items-center space-x-4">
                    <span className={`text-xs px-2 py-1 rounded border ${log.isAlert ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {log.status}
                    </span>
                    <span className="text-xs text-slate-500">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-display font-bold text-white mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <Button variant="secondary" className="w-full justify-start text-sm">Force Sync Backups</Button>
              <Button variant="secondary" className="w-full justify-start text-sm">Manage API Keys</Button>
              <Button variant="secondary" className="w-full justify-start text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30">Emergency Lockdown</Button>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  };

  window.AdminDashboard = AdminDashboard;
})();
