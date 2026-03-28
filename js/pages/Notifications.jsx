(function() {
  const { GlassCard, Icons } = window;
  const { motion } = window.Motion;
  const { useState, useEffect } = window.React;
  const api = window.api;

  const Notifications = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchNotifications = async () => {
        try {
          const res = await api.get('/notifications');
          const data = res.data.notifications || [];
          
          if (data.some(n => !n.is_read)) {
            api.put('/notifications/read').catch(console.error);
          }

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
      
      fetchNotifications();
    }, []);

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl space-y-8"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">System Notifications</h1>
          <p className="text-slate-400 mt-1">Alerts, security logs, and updates about your vault.</p>
        </div>

        {loading ? (
          <div className="text-slate-400">Loading notifications...</div>
        ) : alerts.length === 0 ? (
          <div className="text-slate-400">You have no new notifications.</div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, i) => (
              <GlassCard hover key={i} className="p-4 flex items-start space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${alert.bg}`}>
                  {alert.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-white font-medium">{alert.title}</h3>
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
