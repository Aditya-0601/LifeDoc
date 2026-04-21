(function () {
  const { GlassCard, Button, Icons } = window;
  const { motion } = window.Motion;

  const FamilyAccess = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Family Access</h1>
            <p className="text-slate-400 mt-1">Manage trusted individuals who can access documents in an emergency.</p>
          </div>
          <Button variant="primary">Add Member</Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: "Michael Doe", relationship: "Spouse", docs: 12, status: "Active User" },
            { name: "Sarah Doe", relationship: "Daughter", docs: 3, status: "Pending Invite" }
          ].map((member, i) => (
            <GlassCard key={i} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-lg font-bold text-white shadow-lg">
                  {member.name.charAt(0)}
                </div>
                <div className={`text-xs px-2 py-1 rounded-md font-medium border ${member.status === 'Active User' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                  {member.status}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white">{member.name}</h3>
              <p className="text-sm text-cyan-400 mb-4">{member.relationship}</p>

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="text-sm text-slate-400 font-medium">
                  {member.docs} documents shared
                </div>
                <button className="text-slate-500 hover:text-white transition-colors">
                  <Icons.Settings size={18} />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      </motion.div>
    );
  };

  window.FamilyAccess = FamilyAccess;
})();
