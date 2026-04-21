/**
 * Admin Dashboard
 * 
 * A privileged interface for system administrators to oversee the platform.
 * Provides statistics, user management (enable/disable), and document moderation (delete).
 */
(function () {
  const { GlassCard, Button, Icons, useToast, useAuth } = window;
  const { motion, AnimatePresence } = window.Motion;
  const { Link } = window.Router;

  const { useState, useEffect } = window.React;
  const api = window.api;

  const AdminDashboard = () => {
    const { showSuccess, showError } = useToast();
    const { user: currentUser } = useAuth();
    // Auth State
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(sessionStorage.getItem('adminToken') === 'true');
    const [adminCode, setAdminCode] = useState('');
    const [authError, setAuthError] = useState('');
    
    // UI State
    const [users, setUsers] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [stats, setStats] = useState({ totalUsers: 0, totalDocuments: 0, totalSize: 0, expiringDocuments: 0 });
    const [loading, setLoading] = useState(true);
    
    // Modal States
    const [confirmDeleteUserId, setConfirmDeleteUserId] = useState(null);
    const [confirmDeleteDocId, setConfirmDeleteDocId] = useState(null);

    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, docsRes, statsRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/documents'),
          api.get('/admin/stats')
        ]);
        console.log("API response:", {
          users: usersRes.data,
          documents: docsRes.data,
          stats: statsRes.data
        });
        setUsers(usersRes.data.users || []);
        setDocuments(docsRes.data.documents || []);
        if (statsRes.data) setStats(statsRes.data);
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (isAdminAuthenticated) {
        fetchData();
      } else {
        setLoading(false);
      }
    }, [isAdminAuthenticated]);

    const handleAdminLogin = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        await api.post('/admin/verify', { code: adminCode });
        sessionStorage.setItem('adminToken', 'true');
        setIsAdminAuthenticated(true);
      } catch (err) {
        setAuthError('Invalid master admin code');
        setLoading(false);
      }
    };

    const handleToggleUser = async (user) => {
      const endpoint = user.is_active ? `/admin/users/${user.id}/disable` : `/admin/users/${user.id}/enable`;
      try {
        await api.put(endpoint);
        fetchData();
        showSuccess('User status updated');
      } catch (e) { showError('Failed to toggle user status'); }
    };

    const handleConfirmDeleteUser = async () => {
      const id = confirmDeleteUserId;
      setConfirmDeleteUserId(null);
      try {
        await api.delete(`/admin/users/${id}`);
        fetchData();
        showSuccess('User completely deleted');
      } catch (e) { showError('Failed to delete user'); }
    };

    const handleConfirmDeleteDoc = async () => {
      const id = confirmDeleteDocId;
      setConfirmDeleteDocId(null);
      try {
        await api.delete(`/admin/documents/${id}`);
        fetchData();
        showSuccess('Document deleted');
      } catch (e) { showError('Failed to delete document'); }
    };

    const formatBytes = (bytes) => {
      if (!bytes) return '0 MB';
      const mb = bytes / (1024 * 1024);
      return mb < 1 ? '< 1 MB' : `${mb.toFixed(1)} MB`;
    };

    if (loading) return <div className="min-h-screen bg-navy-900 text-white p-8">Loading administration panel...</div>;

    if (!isAdminAuthenticated) {
      return (
        <div className="min-h-screen bg-mesh p-8 flex items-center justify-center">
          <GlassCard className="p-8 max-w-sm w-full border-red-500/30">
             <div className="flex justify-center mb-6 text-red-400">
               <Icons.Shield size={48} />
             </div>
             <h2 className="text-2xl font-bold text-white text-center mb-2">Restricted Area</h2>
             <p className="text-slate-400 text-center text-sm mb-6">Enter the master admin code to access system oversight.</p>
             {authError && <p className="text-red-400 text-sm mb-4 text-center">{authError}</p>}
             <form onSubmit={handleAdminLogin}>
               <input
                 type="password"
                 required
                 value={adminCode}
                 onChange={e => setAdminCode(e.target.value)}
                 className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-3 text-white text-center tracking-widest text-xl mb-4 focus:border-red-500 transition-colors"
                 placeholder="••••••"
               />
               <Button type="submit" variant="danger" className="w-full bg-red-500 hover:bg-red-600 text-white border-transparent py-3">Access Console</Button>
               <div className="mt-4 text-center">
                 <Link className="text-slate-500 text-sm hover:text-white transition-colors" to="/dashboard">Return to Dashboard</Link>
               </div>
             </form>
          </GlassCard>
        </div>
      );
    }

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
            <p className="text-indigo-400 font-medium mb-2">Total Users</p>
            <p className="text-4xl font-display font-bold text-white">{stats.totalUsers}</p>
          </GlassCard>
          <GlassCard className="p-6 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <p className="text-slate-400 font-medium mb-2">Total Documents</p>
            <p className="text-4xl font-display font-bold text-cyan-400">{stats.totalDocuments}</p>
          </GlassCard>
          <GlassCard className="p-6">
            <p className="text-slate-400 font-medium mb-2">Expiring Documents</p>
            <p className="text-4xl font-display font-bold text-emerald-400">{stats.expiringDocuments}</p>
          </GlassCard>
          <GlassCard className="p-6">
            <p className="text-slate-400 font-medium mb-2">Total Storage</p>
            <p className="text-4xl font-display font-bold text-white">{formatBytes(stats.totalSize)}</p>
          </GlassCard>
        </motion.div>

        <div className="space-y-8">
          <GlassCard className="p-6">
            <h2 className="text-xl font-display font-bold text-white mb-6">User Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-white/5 text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="p-4 font-medium rounded-tl-lg">ID</th>
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">{u.id}</td>
                      <td className="p-4 text-white">{u.name}</td>
                      <td className="p-4 text-cyan-400">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-md font-medium border ${u.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-4 flex space-x-2">
                        <Button 
                          variant={u.is_active ? "danger" : "primary"} 
                          size="sm" 
                          onClick={() => handleToggleUser(u)}
                          className="py-1 px-3 text-xs"
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        {Number(u.id) !== Number(currentUser.id) && (
                          <button 
                            onClick={() => setConfirmDeleteUserId(u.id)} 
                            className="text-slate-500 hover:text-red-400 transition-colors p-1 bg-white/5 hover:bg-white/10 rounded" 
                            title="Delete User"
                          >
                            <Icons.Trash size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan="5" className="p-4 text-center text-slate-500">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-display font-bold text-white mb-6">Document Moderation</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-white/5 text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="p-4 font-medium rounded-tl-lg">Title</th>
                    <th className="p-4 font-medium">Owner</th>
                    <th className="p-4 font-medium">Size</th>
                    <th className="p-4 font-medium">Date Uploaded</th>
                    <th className="p-4 font-medium rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {documents.map(d => (
                    <tr key={d.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white font-medium">{d.title}</td>
                      <td className="p-4 text-slate-400">{d.user_email}</td>
                      <td className="p-4">{formatBytes(d.file_size)}</td>
                      <td className="p-4">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <button onClick={() => setConfirmDeleteDocId(d.id)} className="text-red-400 hover:text-red-300 transition-colors p-2" title="Delete Document">
                          <Icons.Trash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {documents.length === 0 && (
                    <tr><td colSpan="5" className="p-4 text-center text-slate-500">No documents found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* User Delete Modal */}
        <AnimatePresence>
          {confirmDeleteUserId && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-navy-900/90 backdrop-blur-sm" onClick={() => setConfirmDeleteUserId(null)} />
               <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-sm">
                 <GlassCard className="p-6 border-red-500/30">
                   <h3 className="text-xl font-bold text-white mb-2 flex items-center"><Icons.AlertTriangle className="text-red-400 mr-2" size={20}/> Terminate User?</h3>
                   <p className="text-slate-400 text-sm mb-6">Are you sure you want to PERMANENTLY delete this user? ALL of their documents, reminders, and data will be permanently wiped. This action CANNOT be undone.</p>
                   <div className="flex justify-end space-x-3">
                     <Button variant="secondary" onClick={() => setConfirmDeleteUserId(null)}>Cancel</Button>
                     <Button variant="danger" onClick={handleConfirmDeleteUser} className="bg-red-500 hover:bg-red-600 text-white border-transparent">Terminate User</Button>
                   </div>
                 </GlassCard>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Doc Delete Modal */}
        <AnimatePresence>
          {confirmDeleteDocId && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-navy-900/90 backdrop-blur-sm" onClick={() => setConfirmDeleteDocId(null)} />
               <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-sm">
                 <GlassCard className="p-6 border-red-500/30">
                   <h3 className="text-xl font-bold text-white mb-2 flex items-center"><Icons.AlertTriangle className="text-red-400 mr-2" size={20}/> Admin File Deletion</h3>
                   <p className="text-slate-400 text-sm mb-6">Are you sure you want to force-delete this user's document? It will be removed from their vault permanently.</p>
                   <div className="flex justify-end space-x-3">
                     <Button variant="secondary" onClick={() => setConfirmDeleteDocId(null)}>Cancel</Button>
                     <Button variant="danger" onClick={handleConfirmDeleteDoc} className="bg-red-500 hover:bg-red-600 text-white border-transparent">Force Delete</Button>
                   </div>
                 </GlassCard>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  window.AdminDashboard = AdminDashboard;
})();
