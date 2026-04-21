(function () {
  const { GlassCard, Button, Icons } = window;
  const { motion } = window.Motion;

  const Documents = () => {
    const { useState, useEffect } = window.React;
    const [docs, setDocs] = useState([]);
    const [sharedDocs, setSharedDocs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal and interactive states
    const [lockModalOpen, setLockModalOpen] = useState(false);
    const [unlockModalOpen, setUnlockModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [passcode, setPasscode] = useState('');
    const [modalError, setModalError] = useState('');
    const [modalLoading, setModalLoading] = useState(false);

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/documents', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("DEBUG: Raw API documents response", data);
        if (res.ok) {
          const allDocs = data.documents || [];
          console.log("DEBUG: Mapped docs object looking for isLocked:", allDocs);
          setDocs(allDocs.filter(d => !d.isShared));
          setSharedDocs(allDocs.filter(d => d.isShared));
        }
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchData();
    }, []);

    // Open lock creation modal
    const openLockModal = (e, doc) => {
      e.stopPropagation();
      setSelectedDoc(doc);
      setPasscode('');
      setModalError('');
      setLockModalOpen(true);
    };

    // Execute locking API
    const handleLockDocument = async () => {
      if (!passcode || passcode.length < 4) {
        setModalError('Passcode must be at least 4 characters');
        return;
      }
      setModalLoading(true);
      setModalError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/documents/${selectedDoc.id}/lock`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ passcode })
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to lock document');
        }
        
        // Refresh grid
        setLockModalOpen(false);
        fetchData();
      } catch (err) {
        setModalError(err.message);
      } finally {
        setModalLoading(false);
      }
    };

    // Click Document Logic (Preview or Unlock challenge)
    const handleDocumentClick = (doc) => {
      if (doc.isLocked) {
        setSelectedDoc(doc);
        setPasscode('');
        setModalError('');
        setUnlockModalOpen(true);
      } else {
        // Unlocked -> Open Preview Document
        window.open(doc.fileUrl, '_blank');
      }
    };

    // Execute unlocking verification API
    const handleUnlockSubmit = async () => {
      if (!passcode) {
        setModalError('Please enter the passcode');
        return;
      }
      setModalLoading(true);
      setModalError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/documents/${selectedDoc.id}/unlock`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ passcode })
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Incorrect passcode');
        }
        
        // Verification passed natively:
        setUnlockModalOpen(false);
        // Display Document Preview dynamically without breaking security block
        window.open(selectedDoc.fileUrl, '_blank');
        
      } catch (err) {
        setModalError(err.message);
      } finally {
        setModalLoading(false);
      }
    };

    const renderDocumentCard = (doc, idx, isShared = false) => {
      const fileSizeStr = doc.fileSize ? (doc.fileSize / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown Size';
      const dateStr = new Date(doc.createdAt).toLocaleDateString();

      return (
        <GlassCard hover key={idx} className="p-4 flex flex-col cursor-pointer group relative border border-transparent hover:border-cyan-500/30 transition-all" onClick={() => handleDocumentClick(doc)}>
          {isShared && (
            <div className={`absolute top-2 ${doc.isLocked ? "right-24" : "right-2"} flex items-center space-x-1 text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/20 z-10`}>
              {Icons.Users && <Icons.Users size={12} />}
              <span>Shared</span>
            </div>
          )}
          
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
              {(doc.isLocked && Icons.Lock) ? <Icons.Lock size={20} className="text-rose-400" /> : (Icons.FileText ? <Icons.FileText size={20} /> : <span className="font-bold">📄</span>)}
            </div>

            {/* Action Area for Lock */}
            <div className="flex z-20 space-x-2">
              {doc.isLocked ? (
                <div 
                  className="flex items-center space-x-1 text-xs px-2 py-1.5 bg-rose-500/20 text-rose-400 rounded-md border border-rose-500/20 font-medium"
                  title="Document is Locked"
                >
                  {Icons.Lock && <Icons.Lock size={12} />}
                  <span>Locked</span>
                </div>
              ) : (!isShared && (
                <button 
                  onClick={(e) => openLockModal(e, doc)} 
                  className="flex items-center space-x-1 text-xs px-2 py-1.5 bg-navy-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 rounded-md font-medium transition-colors shadow-sm"
                  title="Lock Document with Passcode"
                >
                  {Icons.Lock ? <Icons.Lock size={12} /> : <span>🔒</span>}
                  <span>Lock</span>
                </button>
              ))}
            </div>
          </div>
          
          <h3 className="font-semibold text-white/90 text-sm truncate mb-1" title={doc.name}>{doc.name}</h3>
          <p className="text-xs font-medium text-cyan-400 mb-3">{doc.category}</p>

          <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center text-[11px] text-slate-500 font-medium tracking-wide">
            <span>{dateStr}</span>
            <span>{fileSizeStr}</span>
          </div>
        </GlassCard>
      );
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight text-gradient block">My Documents</h1>
            <p className="text-slate-400 mt-1">{loading ? 'Loading...' : `${docs.length + sharedDocs.length} files stored securely.`}</p>
          </div>
          <Button variant="primary" className="h-10 px-4 text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Icons.Plus size={16} className="mr-2" /> Upload New
          </Button>
        </div>

        {/* Existing search and UI elements */}
        {loading ? (
          <div className="text-slate-500 text-center py-12">Loading your vault...</div>
        ) : docs.length === 0 && sharedDocs.length === 0 ? (
          <div className="text-slate-500 text-center py-12 border-2 border-dashed border-white/10 rounded-xl bg-navy-800/20">
            <Icons.FolderOpen size={48} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-lg text-white font-medium mb-1">Your vault is empty</h3>
            <p className="text-sm">No documents found. Upload your first document to securely store it.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {docs.length > 0 && (
              <div>
                <h2 className="text-lg font-display font-medium text-white mb-4">My Files</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {docs.map((doc, idx) => renderDocumentCard(doc, idx, false))}
                </div>
              </div>
            )}

            {sharedDocs.length > 0 && (
              <div>
                <h2 className="text-lg font-display font-medium text-white mb-4 flex items-center gap-2">
                  <Icons.Users size={18} className="text-emerald-400" />
                  Shared with Me
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sharedDocs.map((doc, idx) => renderDocumentCard(doc, idx, true))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODALS OVERLAYS */}
        
        {/* Set Lock Modal */}
        {lockModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm rounded-2xl bg-navy-900 border border-white/10 p-6 shadow-2xl relative">
              <button onClick={() => setLockModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                <Icons.X size={20} />
              </button>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                  <Icons.Lock size={28} className="text-rose-400" />
                </div>
                <h3 className="text-xl font-bold font-display text-white mb-1">Lock Document</h3>
                <p className="text-sm text-slate-400">"{selectedDoc?.name}"</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Set Secure Passcode</label>
                  <input 
                    type="password" 
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter 4+ characters"
                    className="w-full bg-navy-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50"
                  />
                  {modalError && <p className="text-rose-400 text-xs mt-2">{modalError}</p>}
                </div>
                <Button variant="primary" className="w-full h-11 bg-rose-500 hover:bg-rose-600 text-white font-medium" onClick={handleLockDocument} disabled={modalLoading}>
                  {modalLoading ? "Securing..." : "Confirm & Lock"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Unlock Challenge Modal */}
        {unlockModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-sm rounded-2xl bg-navy-900 border border-rose-500/30 p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full height-1 bg-gradient-to-r from-rose-500/50 to-orange-500/50"></div>
              <button onClick={() => setUnlockModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                <Icons.X size={20} />
              </button>
              
              <div className="text-center mb-6">
                <Icons.Shield size={36} className="text-rose-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold font-display text-white mb-1">Vault File Protected</h3>
                <p className="text-sm text-slate-400">Passcode required for: <br/><strong>{selectedDoc?.name}</strong></p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <input 
                    type="password" 
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter Passcode..."
                    className="w-full bg-navy-800 border border-rose-500/30 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500 text-center tracking-widest text-lg"
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlockSubmit()}
                    autoFocus
                  />
                  {modalError && <p className="text-rose-400 text-xs mt-2 text-center font-medium bg-rose-500/10 py-1 rounded inline-block w-full">{modalError}</p>}
                </div>
                <Button variant="primary" className="w-full h-11 bg-rose-500 hover:bg-rose-600 text-white font-medium" onClick={handleUnlockSubmit} disabled={modalLoading}>
                  {modalLoading ? "Validating..." : "Verify Identity"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

      </motion.div>
    );
  };

  window.Documents = Documents;
})();
