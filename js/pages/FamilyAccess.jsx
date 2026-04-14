/**
 * Family Access Page
 * 
 * Manages trusted emergency contacts. Allows sending invites, approving/rejecting 
 * requested access, and revoking existing access to the vault.
 */
(function () {
  const { GlassCard, Button, Icons, useToast } = window;
  const { motion } = window.Motion;
  const { useState, useEffect } = window.React;
  const api = window.api;

  const FamilyAccess = () => {
    const [members, setMembers] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState('members');
    const { showSuccess, showError } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const fetchMembers = async () => {
      try {
        setLoading(true);
        const [memRes, invRes] = await Promise.all([
          api.get('/family-access'),
          api.get('/family-access/invitations')
        ]);
        setMembers(memRes.data.accesses || []);
        setInvitations(invRes.data.invitations || []);
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

    const handleAcceptInvite = async (id) => {
      try {
        await api.patch(`/family-access/invitations/${id}/accept`);
        fetchMembers();
        showSuccess('Invitation accepted');
      } catch (err) { showError('Failed to accept'); }
    };

    const handleRejectInvite = async (id) => {
      try {
        await api.patch(`/family-access/invitations/${id}/reject`);
        fetchMembers();
        showSuccess('Invitation rejected');
      } catch (err) { showError('Failed to reject'); }
    };

    // Keep handleApprove/Reject for legacy sender-side approvals if needed
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
            
            <div className="flex space-x-2 mt-6">
              <button 
                onClick={() => setActiveTab('members')} 
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${activeTab === 'members' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-white/5 border border-transparent'}`}
              >
                My Trusted Members
              </button>
              <button 
                onClick={() => setActiveTab('invitations')} 
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-all flex items-center ${activeTab === 'invitations' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-white/5 border border-transparent'}`}
              >
                Pending Invitations
                {invitations.length > 0 && (
                  <span className="ml-2 bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">{invitations.length}</span>
                )}
              </button>
            </div>
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
          <div className="text-slate-400 mt-8">Loading access list...</div>
        ) : activeTab === 'members' ? (
          members.length === 0 ? (
            <div className="mt-8 text-center py-16 border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
              <p className="text-slate-500">No family members have been added yet.</p>
            </div>
          ) : (
            <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      {member.status === 'approved' ? 'Accepted' : member.status === 'rejected' ? 'Rejected' : 'Pending Invite'}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white">{member.family_member_name}</h3>
                  <p className="text-sm text-cyan-400 mb-4">{member.family_member_email}</p>
                  <div className="text-xs text-slate-500 font-mono bg-navy-900 p-2 rounded mb-4 text-center select-all">
                     Code: {member.access_code}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <div className="text-sm text-slate-400 font-medium">
                      {member.status === 'approved' ? 'Emergency Contact' : member.status === 'rejected' ? 'Invited Denied' : 'Awaiting Response'}
                    </div>
                    <button onClick={() => handleRevoke(member.id)} className="text-slate-500 hover:text-red-400 transition-colors" title="Revoke Access">
                      <Icons.Trash size={18} />
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )
        ) : (
          <div className="mt-8">
            {invitations.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                <p className="text-slate-500">You have no pending invitations.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {invitations.map((invite) => (
                  <GlassCard key={invite.id} className="p-6 border-indigo-500/30">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-lg font-bold text-white shadow-lg">
                        {invite.sender_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-xs px-2 py-1 rounded-md font-medium border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                        Incoming Invite
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white">{invite.sender_name}</h3>
                    <p className="text-sm text-slate-400 mb-4">{invite.sender_email}</p>
                    <p className="text-xs text-slate-500 mb-6 bg-navy-900 border border-white/5 p-3 rounded-lg">
                      They trust you to be their emergency contact. Do you accept this requested access?
                    </p>

                    <div className="flex space-x-3 pt-4 border-t border-white/5">
                      <Button onClick={() => handleAcceptInvite(invite.id)} className="flex-1 text-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 py-2 font-bold">Accept</Button>
                      <Button onClick={() => handleRejectInvite(invite.id)} className="flex-1 text-sm bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 py-2 font-bold">Reject</Button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  window.FamilyAccess = FamilyAccess;
})();
