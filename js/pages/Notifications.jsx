/**
 * Notifications Page
 * 
 * Central hub for system alerts, security logs, and updates about the vault.
 * Automatically marks unread notifications as read when viewed.
 */
(function() {
  const { GlassCard, Icons, useToast, Button } = window;
  const { motion } = window.Motion;
  const { useState, useEffect } = window.React;
  const api = window.api;

  const Notifications = () => {
    const { showSuccess, showError } = useToast();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await api.get('/notifications');
        const data = res.data.notifications || [];
        
        // Removed automatic mark-as-read so user has manual control

          const decorated = data.map(item => {
            if (item.type === 'reminder') {
               return { ...item, icon: <Icons.Calendar className="text-red-400" size={18} />, bg: "bg-red-500/10 border-red-500/20" };
            } else if (item.type === 'family') {
               return { ...item, icon: <Icons.Users className="text-emerald-400" size={18} />, bg: "bg-emerald-500/10 border-emerald-500/20" };
            }
            return { ...item, icon: <Icons.Bell className="text-cyan-400" size={18} />, bg: "bg-cyan-500/10 border-cyan-500/20" };
          });

          setAlerts(decorated);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchNotifications();
    }, []);

    const handleMarkAllRead = async () => {
      try {
        await api.put('/notifications/read');
        setAlerts(alerts.map(a => ({ ...a, is_read: true })));
        showSuccess("All notifications marked as read");
      } catch (err) {
        showError("Failed to update notifications");
      }
    };

    const hasUnread = alerts.some(a => !a.is_read);

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl space-y-8"
      >
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">System Notifications</h1>
            <p className="text-slate-400 mt-1">Alerts, security logs, and updates about your vault.</p>
          </div>
          {alerts.length > 0 && hasUnread && (
            <Button variant="secondary" onClick={handleMarkAllRead} className="text-sm py-2">
              <Icons.Check size={16} className="mr-2" /> Mark all read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-slate-400">Loading notifications...</div>
        ) : alerts.length === 0 ? (
          <div className="text-slate-400">You have no new notifications.</div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, i) => (
              <GlassCard hover key={i} className={`p-4 flex items-start space-x-4 transition-colors ${!alert.is_read ? 'bg-white/5 border-l-4 border-l-cyan-500' : 'opacity-70'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${alert.bg}`}>
                  {alert.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-medium ${!alert.is_read ? 'text-white' : 'text-slate-300'}`}>
                      {alert.title}
                      {!alert.is_read && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-cyan-500 align-middle shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>}
                    </h3>
                    <span className="text-xs font-semibold text-slate-500 bg-white/5 py-1 px-2 rounded-md">{alert.time}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{alert.desc}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  window.Notifications = Notifications;
})();
