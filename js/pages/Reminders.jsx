(function() {
  const { GlassCard, Icons, Button } = window;
  const { motion, AnimatePresence } = window.Motion;
  const { useState, useEffect } = window.React;
  const api = window.api;

  const Reminders = () => {
    const [reminders, setReminders] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list', 'calendar', 'history'
    const [showModal, setShowModal] = useState(false);

    // Form states
    const [formData, setFormData] = useState({ title: '', deadline_date: '', type: 'Renewal', notes: '' });

    const fetchReminders = async () => {
      try {
        setLoading(true);
        const [remRes, histRes] = await Promise.all([
          api.get('/reminders'),
          api.get('/reminders/history')
        ]);
        setReminders(remRes.data.reminders || []);
        setHistory(histRes.data.history || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => { fetchReminders(); }, []);

    const handleAdd = async (e) => {
      e.preventDefault();
      try {
        await api.post('/reminders', {
          title: formData.title,
          deadline_date: formData.deadline_date,
          category: formData.type,
          description: formData.notes
        });
        setShowModal(false);
        setFormData({ title: '', deadline_date: '', type: 'Renewal', notes: '' });
        fetchReminders();
      } catch(err) { alert('Failed to add reminder'); }
    };

    const handleDismiss = async (id, source) => {
      if (source !== 'manual') return alert('Only explicit manual reminders can be dismissed early.');
      try {
        await api.put(`/reminders/${id}/dismiss`);
        fetchReminders();
      } catch(err) { alert('Failed to dismiss'); }
    };

    const groupReminders = () => {
      const groups = { 'Next 30 Days': [], 'Next 90 Days': [], 'Next 180 Days': [], 'Later': [] };
      reminders.forEach(r => {
        if (r.days_remaining <= 30) groups['Next 30 Days'].push(r);
        else if (r.days_remaining <= 90) groups['Next 90 Days'].push(r);
        else if (r.days_remaining <= 180) groups['Next 180 Days'].push(r);
        else groups['Later'].push(r);
      });
      return groups;
    };

    const grouped = groupReminders();
    const urgentItems = reminders.filter(r => r.days_remaining <= 30);

    const CalendarView = () => {
      // Simple visual timeline mapping instead of heavy imported calendar libs
      return (
        <div className="space-y-4">
           {reminders.length === 0 && <p className="text-slate-400">No upcoming dates to plot.</p>}
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
             {reminders.map(r => (
               <GlassCard key={r.id + r.source} className="p-4 text-center border-t-2 bg-white/5 hover:bg-white/10 transition-colors" style={{ borderTopColor: r.status_badge === 'Urgent' ? '#f87171' : r.status_badge === 'Approaching' ? '#fbbf24' : '#34d399' }}>
                 <p className="text-xs text-slate-400 mb-2 font-medium bg-navy-900/50 py-1 rounded inline-block px-2">{new Date(r.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</p>
                 <p className="text-sm font-semibold text-white line-clamp-2 mt-2" title={r.document_name}>{r.document_name}</p>
                 <p className="text-xs mt-3 font-bold bg-navy-900/50 py-1 rounded" style={{ color: r.status_badge === 'Urgent' ? '#f87171' : r.status_badge === 'Approaching' ? '#fbbf24' : '#34d399' }}>
                    {r.days_remaining} days left
                 </p>
               </GlassCard>
             ))}
           </div>
        </div>
      )
    };

    return (
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="pl-4 border-l-4 border-indigo-500">
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Expiry Radar</h1>
            <p className="text-slate-400 mt-1">Stay ahead of crucial deadlines and document renewals.</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="flex items-center space-x-2 shrink-0">
            <Icons.Plus size={18} /><span>Add Reminder</span>
          </Button>
        </div>

        {/* Smart Warning Alerts */}
        {urgentItems.length > 0 && view !== 'history' && (
          <motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 flex items-start space-x-4 shadow-[0_0_20px_rgba(248,113,113,0.1)]">
            <div className="text-red-400 mt-1 bg-red-500/20 p-2 rounded-lg"><Icons.AlertTriangle size={24} /></div>
            <div>
              <h3 className="text-red-400 font-bold mb-2">Action Required</h3>
              <ul className="text-sm text-red-300/80 space-y-2">
                {urgentItems.map(u => (
                  <li key={u.id + u.source} className="flex flex-col sm:flex-row sm:items-center">
                    <span className="font-semibold text-white mr-2">{"\u2022"} {u.document_name}</span> 
                    <span>expires in <span className="text-red-400 font-bold">{u.days_remaining} days</span>. <span className="opacity-75 md:inline hidden ml-1">Renewal processing may take weeks.</span></span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Controls Layout */}
        <div className="flex space-x-2 bg-navy-900/50 p-1.5 rounded-xl border border-white/5 w-fit">
          <button onClick={() => setView('list')} className={`text-sm font-medium px-5 py-2 rounded-lg transition-all duration-300 ${view === 'list' ? 'bg-cyan-500 text-navy-900 shadow-md transform scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>List View</button>
          <button onClick={() => setView('calendar')} className={`text-sm font-medium px-5 py-2 rounded-lg transition-all duration-300 ${view === 'calendar' ? 'bg-cyan-500 text-navy-900 shadow-md transform scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Timeline Grid</button>
          <button onClick={() => setView('history')} className={`text-sm font-medium px-5 py-2 rounded-lg transition-all duration-300 ${view === 'history' ? 'bg-cyan-500 text-navy-900 shadow-md transform scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>History</button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
            <div className="text-cyan-400 animate-pulse font-medium tracking-widest text-sm uppercase">Scanning radar...</div>
          </div>
        ) : view === 'history' ? (
          <div className="space-y-4 max-w-4xl">
            {history.length === 0 ? (
               <div className="text-center py-16 border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                 <p className="text-slate-500">No history recorded yet.</p>
               </div>
            ) : history.map((h, i) => (
              <GlassCard key={i} className="p-5 flex justify-between items-center opacity-75 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
                    <Icons.Check size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-lg">{h.document_name}</h3>
                    <p className="text-sm text-slate-500">{new Date(h.expiry_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-semibold text-slate-400 tracking-wider">
                  {h.status_badge.toUpperCase()}
                </div>
              </GlassCard>
            ))}
          </div>
        ) : view === 'calendar' ? (
          <CalendarView />
        ) : (
          reminders.length === 0 ? (
            <div className="text-center py-24 px-4 border border-dashed border-white/10 rounded-2xl bg-gradient-to-b from-transparent to-navy-900/30">
              <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(52,211,153,0.15)] animate-pulse">
                <Icons.Check size={36} />
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-2">No upcoming reminders yet</h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">Your radar is perfectly clear! Enjoy the peace of mind. Add a manual reminder or upload a document with an expiry date to see it tracked here.</p>
              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <Button onClick={() => setShowModal(true)}>Create Manual Reminder</Button>
                <Button variant="secondary" onClick={() => window.location.hash = "#/dashboard/upload"}>Upload Document</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-12 max-w-5xl">
              {['Next 30 Days', 'Next 90 Days', 'Next 180 Days', 'Later'].map(groupName => {
                if (grouped[groupName].length === 0) return null;
                return (
                  <div key={groupName} className="relative">
                    <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center">
                      <span className="bg-indigo-500/20 text-indigo-400 p-1.5 rounded-lg mr-3"><Icons.Calendar size={18}/></span>
                      {groupName}
                      <span className="ml-3 px-2 py-0.5 rounded-full bg-white/10 text-xs text-slate-400 font-medium">{grouped[groupName].length}</span>
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-5 pl-4 sm:pl-0">
                      {grouped[groupName].map(r => (
                        <GlassCard key={r.id + r.source} className="p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors duration-300">
                          {/* Accent Line */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${r.status_badge === 'Urgent' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : r.status_badge === 'Approaching' ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]'}`}></div>
                          
                          <div className="flex justify-between items-start pl-4">
                            <div className="flex-1 pr-4">
                              <div className="flex flex-wrap gap-2 mb-2">
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md border ${r.status_badge === 'Urgent' ? 'bg-red-500/10 text-red-400 border-red-500/20' : r.status_badge === 'Approaching' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                  {r.status_badge}
                                </span>
                                {r.source === 'auto' && <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md border bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Auto Gen</span>}
                              </div>
                              <h3 className="text-xl font-bold text-white mt-2 leading-tight group-hover:text-cyan-400 transition-colors">{r.document_name}</h3>
                              <p className="text-sm text-slate-400 mt-2 flex items-center bg-navy-900/50 w-fit px-2 py-1 rounded border border-white/5"><Icons.Calendar size={14} className="mr-2 text-indigo-400"/> {new Date(r.expiry_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                              {r.notes && <p className="text-sm text-slate-500 mt-3 pt-3 border-t border-white/5 italic">"{r.notes}"</p>}
                            </div>
                            
                            <div className="text-right flex flex-col items-end shrink-0">
                              <div className="p-3 bg-navy-900/50 rounded-xl border border-white/5 text-center min-w-[80px]">
                                <div className="text-3xl font-display font-bold text-white leading-none">{r.days_remaining}</div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-1">days</div>
                              </div>
                              
                              {r.source === 'manual' && (
                                <button onClick={() => handleDismiss(r.id, r.source)} className="mt-4 px-3 py-1.5 text-xs font-semibold text-slate-400 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-lg transition-all duration-300 flex items-center border border-transparent hover:border-emerald-500/30 opacity-60 group-hover:opacity-100">
                                  <Icons.Check size={14} className="mr-1.5"/> Dismiss
                                </button>
                              )}
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Modal Overlay */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-navy-900/90 backdrop-blur-sm cursor-pointer" onClick={() => setShowModal(false)} />
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="w-full max-w-md relative z-10">
                <GlassCard className="p-8 border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.15)] ring-1 ring-white/10">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                    <h2 className="text-2xl font-display font-bold text-white flex items-center"><Icons.Bell className="mr-3 text-cyan-400"/> New Reminder</h2>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white bg-white/5 hover:bg-red-500/20 hover:text-red-400 p-2 rounded-full transition-colors"><Icons.Plus className="rotate-45" size={20}/></button>
                  </div>
                  
                  <form onSubmit={handleAdd} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Title / Subject</label>
                      <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600" placeholder="e.g. Passport Renewal Tracker" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Target Expiry Date</label>
                      <input type="date" required value={formData.deadline_date} onChange={e => setFormData({...formData, deadline_date: e.target.value})} className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Category Filter</label>
                      <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all">
                        <option value="Renewal">Legal Renewal</option>
                        <option value="Payment">Payment Required</option>
                        <option value="Review">Periodic Review</option>
                        <option value="Action">Action Required</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Internal Notes (Optional)</label>
                      <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all min-h-[100px] resize-none placeholder:text-slate-600" placeholder="Add serial numbers, links, or instructions..." />
                    </div>
                    <div className="pt-6 flex space-x-4">
                      <Button type="submit" className="flex-1 py-3 text-lg font-bold">Track Deadline</Button>
                    </div>
                  </form>
                </GlassCard>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  window.Reminders = Reminders;
})();
