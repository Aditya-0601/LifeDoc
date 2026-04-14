(function () {
  const { GlassCard, Button, Icons, useToast } = window;
  const { motion } = window.Motion;
  const { useState, useEffect } = window.React;
  const api = window.api;

  const FamilyAccess = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const { showSuccess, showError } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const fetchMembers = async () => {
      try {
        setLoading(true);
        const res = await api.get('/family-access');
        setMembers(res.data.accesses || []);
      } catch (err) {
        console.error("Failed to fetch family members:", err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchMembers();
    }, []);

    const handleAddMember = async (e) => {
      e.preventDefault();
      try {
        await api.post('/family-access/request', { family_member_name: name, family_member_email: email });
        setShowForm(false);
        setName('');
        setEmail('');
        fetchMembers();
        showSuccess('Invite sent successfully');
      } catch (err) {
        showError(err.response?.data?.error || 'Failed to add member');
      }
    };

    const handleRevoke = async (id) => {
      if(confirm('Are you sure you want to revoke access?')) {
        try {
          await api.delete(`/family-access/${id}`);
          fetchMembers();
          showSuccess('Access revoked');
        } catch (err) {
          showError('Failed to revoke access');
        }
      }
    };

    const handleApprove = async (id) => {
      try {
        await api.put(`/family-access/${id}/approve`);
        fetchMembers();
      } catch (err) { console.error('Failed to approve'); }
    };

    const handleReject = async (id) => {
      try {
        await api.put(`/family-access/${id}/reject`);
        fetchMembers();
      } catch (err) { console.error('Failed to reject'); }
    };

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
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Member'}
          </Button>
        </div>

        {showForm && (
           <GlassCard className="p-6 mb-8 border border-cyan-500/30">
             <h3 className="text-lg font-bold text-white mb-4">Add Trusted Contact</h3>
             <form onSubmit={handleAddMember} className="flex gap-4 items-end">
               <div className="flex-1">
                 <label className="block text-sm text-slate-300 mb-1">Full Name</label>
                 <input
                   required
                   type="text"
                   value={name}
                   onChange={e => setName(e.target.value)}
                   className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-slate-600 focus:border-cyan-500"
                   placeholder="e.g. Michael Doe"
                 />
               </div>
               <div className="flex-1">
                 <label className="block text-sm text-slate-300 mb-1">Email</label>
                 <input
                   required
                   type="email"
                   value={email}
                   onChange={e => setEmail(e.target.value)}
                   className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-slate-600 focus:border-cyan-500"
                   placeholder="michael@example.com"
                 />
               </div>
               <Button variant="primary" type="submit" className="h-10 px-6">Send Invite</Button>
             </form>
           </GlassCard>
        )}

        {loading ? (
          <div className="text-slate-400">Loading access list...</div>
        ) : members.length === 0 ? (
          <div className="text-slate-400">No family members have been added yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <GlassCard key={member.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-lg font-bold text-white shadow-lg">
                    {member.family_member_name.charAt(0).toUpperCase()}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-md font-medium border ${
                    member.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    member.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {member.status === 'approved' ? 'Approved' : member.status === 'rejected' ? 'Rejected' : 'Request Pending'}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white">{member.family_member_name}</h3>
                <p className="text-sm text-cyan-400 mb-4">{member.family_member_email}</p>
                <div className="text-xs text-slate-500 font-mono bg-navy-900 p-2 rounded mb-4 text-center select-all">
                   Code: {member.access_code}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <div className="text-sm text-slate-400 font-medium">
                    {member.status === 'pending' ? (
                      <div className="flex space-x-2">
                        <button onClick={() => handleApprove(member.id)} className="text-xs px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors">Approve</button>
                        <button onClick={() => handleReject(member.id)} className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors">Reject</button>
                      </div>
                    ) : (
                      member.status === 'approved' ? 'Emergency Contact' : 'Access Denied'
                    )}
                  </div>
                  <button onClick={() => handleRevoke(member.id)} className="text-slate-500 hover:text-red-400 transition-colors" title="Revoke Access">
                    <Icons.Trash size={18} />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  window.FamilyAccess = FamilyAccess;
})();
