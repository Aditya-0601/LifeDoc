/**
 * Profile Page
 * 
 * Allows users to view and edit their personal information.
 * Additionally provides security settings like changing the account password and global logout.
 */
(function () {
  const { GlassCard, Button, Icons, useAuth, useToast } = window;
  const { motion } = window.Motion;
  const { useState, useEffect } = window.React;
  const { useNavigate } = window.Router;
  const api = window.api;

  const Profile = () => {
    const { user, logout } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', email: '' });
    const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
      const fetchProfile = async () => {
        try {
          const res = await api.get('/auth/me');
          if (res.data.user) {
            setProfile(res.data.user);
            setEditForm({ name: res.data.user.name, email: res.data.user.email });
          }
        } catch (err) {
          console.error("Failed to load profile:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    }, []);

    const handleUpdateProfile = (e) => {
      e.preventDefault();
      // Mock update for now
      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
      showSuccess('Profile updated successfully (UI Mock)');
    };

    const handleChangePassword = (e) => {
      e.preventDefault();
      if (passwordForm.new !== passwordForm.confirm) {
        showError("Passwords do not match");
        return;
      }
      // Mock password change
      setIsChangingPassword(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
      showSuccess('Password changed successfully (UI Mock)');
    };

    const handleLogout = () => {
      logout();
      navigate('/login');
    };

    const formatDate = (isoString) => {
      if (!isoString) return 'N/A';
      return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    };

    if (loading) return <div className="text-white">Loading profile...</div>;
    if (!profile) return <div className="text-white">Profile not found.</div>;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl space-y-8"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Your Profile</h1>
          <p className="text-slate-400 mt-1">Manage your account details and security settings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <GlassCard className="p-6 border-cyan-500/20">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 border-2 border-navy-900 shadow-lg flex items-center justify-center text-white text-2xl font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{profile.name}</h2>
                  <p className="text-slate-400">{profile.email}</p>
                </div>
              </div>

              {!isEditing ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-slate-500 block">Name</span>
                    <span className="text-slate-300">{profile.name}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-500 block">Email Address</span>
                    <span className="text-slate-300">{profile.email}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-500 block">Member Since</span>
                    <span className="text-slate-300">{formatDate(profile.created_at)}</span>
                  </div>
                  <div className="pt-4">
                    <Button variant="secondary" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-400 block mb-1">Name</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-navy-900/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500/50" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400 block mb-1">Email Address</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full bg-navy-900/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500/50" required />
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <Button type="submit">Save Changes</Button>
                    <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                </form>
              )}
            </GlassCard>
            
            <GlassCard className="p-6 border-red-500/10">
              <div className="flex items-center space-x-3 text-red-400 mb-4">
                <Icons.AlertTriangle size={20} />
                <h3 className="font-medium">Danger Zone</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">Logging out will clear your session. Ensure you have saved your work.</p>
              <Button variant="danger" onClick={handleLogout} className="flex items-center space-x-2">
                <Icons.LogOut size={16} />
                <span>Log Out Everything</span>
              </Button>
            </GlassCard>
          </div>

          <div className="space-y-8">
            <GlassCard className="p-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Icons.Shield size={120} className="text-cyan-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-6 relative z-10">Security Settings</h2>
              
              {!isChangingPassword ? (
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between p-4 bg-navy-900/30 rounded-xl border border-white/5">
                    <div>
                      <h4 className="font-medium text-white text-sm">Account Password</h4>
                      <p className="text-xs text-slate-400 mt-1">Change your password to secure your vault.</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setIsChangingPassword(true)}>Change</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-navy-900/30 rounded-xl border border-white/5">
                    <div>
                      <h4 className="font-medium text-white text-sm">Two-Factor Auth</h4>
                      <p className="text-xs text-slate-400 mt-1">OTP relies on email verification for now.</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">Enabled</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4 relative z-10">
                  <div>
                    <label className="text-sm font-medium text-slate-400 block mb-1">Current Password</label>
                    <input type="password" value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} className="w-full bg-navy-900/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500/50" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400 block mb-1">New Password</label>
                    <input type="password" value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} className="w-full bg-navy-900/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500/50" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400 block mb-1">Confirm New Password</label>
                    <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} className="w-full bg-navy-900/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500/50" required />
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <Button type="submit">Update Password</Button>
                    <Button variant="secondary" type="button" onClick={() => setIsChangingPassword(false)}>Cancel</Button>
                  </div>
                </form>
              )}
            </GlassCard>
          </div>
        </div>
      </motion.div>
    );
  };

  window.Profile = Profile;
})();
