(function () {
  const { GlassCard, Button, Icons } = window;
  const { motion } = window.Motion;

  const FamilyAccess = () => {
    const { useState, useEffect } = window.React;
    const { useToast } = window;
    const api = window.api;

    const [activeTab, setActiveTab] = useState('members');
    const [members, setMembers] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showSuccess, showError } = useToast();

    // Invite Modal State
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');

    const fetchData = async () => {
      try {
        setLoading(true);
        // Load active connections
        const resMem = await api.get('/family-access');
        setMembers(resMem.data.accesses || []);

        // Load pending incoming requests
        const resInv = await api.get('/family-access/invitations');
        setInvitations(resInv.data.invitations || []);
      } catch (err) {
        console.error("Failed to load family access:", err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchData();
    }, []);

    const handleSendInvite = async (e) => {
      e.preventDefault();
      try {
        await api.post('/family-access/request', {
          family_member_name: inviteName,
          family_member_email: inviteEmail
        });
        showSuccess('Invitation sent successfully!');
        setIsInviteModalOpen(false);
        setInviteName('');
        setInviteEmail('');
        fetchData();
      } catch (err) {
        showError(err.response?.data?.error || 'Failed to send invite');
      }
    };

    const handleAction = async (id, action) => {
      try {
        await api.patch(`/family-access/invitations/${id}/${action}`);
        showSuccess(`Invitation ${action}ed`);
        fetchData();
      } catch (err) {
        showError(err.response?.data?.error || `Failed to ${action} invitation`);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight text-gradient">Family & Emergency Access</h1>
            <p className="text-slate-400 mt-1">Manage trusted individuals who can access documents in an emergency.</p>
          </div>
          <Button variant="primary" onClick={() => setIsInviteModalOpen(true)}>
            <Icons.Plus size={16} className="mr-2" />
            Add Trusted Member
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-6 border-b border-white/10 mb-6">
          <button 
            className={`pb-3 font-semibold transition-colors ${activeTab === 'members' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setActiveTab('members')}
          >
            My Trusted Contacts
          </button>
          <button 
            className={`pb-3 font-semibold transition-colors flex items-center ${activeTab === 'invitations' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setActiveTab('invitations')}
          >
            Pending Invitations 
            {invitations.length > 0 && (
              <span className="ml-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{invitations.length}</span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="text-slate-400">Loading access parameters...</div>
        ) : (
          <>
            {activeTab === 'members' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.length === 0 && <p className="text-slate-500">No trusted members configured yet.</p>}
                {members.map((member, i) => (
                  <GlassCard key={i} className="p-6 relative group overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-lg font-bold text-cyan-400 shadow-lg border border-cyan-500/20">
                        {member.family_member_name.charAt(0).toUpperCase()}
                      </div>
                      <div className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-bold border ${member.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : member.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                        {member.status}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white/90 truncate">{member.family_member_name}</h3>
                    <p className="text-xs text-slate-400 mb-4 truncate" title={member.family_member_email}>{member.family_member_email}</p>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5 opacity-50 group-hover:opacity-100 transition-opacity">
                      <div className="text-xs text-slate-500">Since {new Date(member.created_at).toLocaleDateString()}</div>
                      <button className="text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500 rounded p-1.5 transition-colors" title="Revoke Access">
                        <Icons.Trash size={14} />
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}

            {activeTab === 'invitations' && (
              <div className="space-y-4 max-w-3xl">
                {invitations.length === 0 && <p className="text-slate-500">You have no pending invitations.</p>}
                {invitations.map((inv) => (
                  <GlassCard key={inv.id} className="p-5 flex items-center justify-between border border-emerald-500/10 bg-gradient-to-r from-emerald-500/5 to-transparent">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <Icons.Users size={18} />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{inv.sender_name}</h4>
                        <p className="text-xs text-slate-400">{inv.sender_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                       <Button variant="primary" size="sm" onClick={() => handleAction(inv.id, 'accept')} className="bg-emerald-500 border-emerald-400 hover:bg-emerald-400 text-white shadow-emerald-500/20">
                          Accept Access
                       </Button>
                       <Button variant="secondary" size="sm" onClick={() => handleAction(inv.id, 'reject')} className="hover:text-rose-400 border-white/5 hover:border-rose-500/30">
                          Decline
                       </Button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </>
        )}

        {/* Create Invite Modal */}
        {window.Motion.AnimatePresence && (
          <window.Motion.AnimatePresence>
            {isInviteModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-navy-900/90 backdrop-blur-sm" onClick={() => setIsInviteModalOpen(false)} />
                <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="w-full max-w-md relative z-10">
                  <GlassCard className="p-6 border-cyan-500/20 ring-1 ring-white/10">
                    <h2 className="text-xl font-display font-bold text-white tracking-tight mb-2">Request Emergency Access</h2>
                    <p className="text-sm text-slate-400 mb-6">Invite someone to be your trusted emergency contact.</p>
                    <form onSubmit={handleSendInvite} className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block uppercase font-semibold">Contact Name</label>
                        <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)} required className="w-full bg-navy-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" placeholder="E.g. Sarah Connor" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block uppercase font-semibold">Contact Email</label>
                        <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required className="w-full bg-navy-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" placeholder="sarah@example.com" />
                      </div>
                      <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Send Invitation</Button>
                      </div>
                    </form>
                  </GlassCard>
                </motion.div>
              </div>
            )}
          </window.Motion.AnimatePresence>
        )}
      </motion.div>
    );
  };

  window.FamilyAccess = FamilyAccess;
})();
