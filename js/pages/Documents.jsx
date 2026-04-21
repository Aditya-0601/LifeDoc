/**
 * Documents Page
 * 
 * Displays a list of all documents stored in the vault. 
 * Allows searching, filtering, previewing, downloading, and deleting documents.
 */
(function () {
  const { GlassCard, Button, Icons, useToast } = window;
  const { motion, AnimatePresence } = window.Motion;
  const { useState, useEffect } = window.React;
  const { Link } = window.Router;
  const api = window.api;

  const Documents = () => {
    const { showSuccess, showError } = useToast();
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All Categories");
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    
    // Deletion Modal State
    const [confirmDeleteDocId, setConfirmDeleteDocId] = useState(null);

    // Share Modal State
    const [shareModalDoc, setShareModalDoc] = useState(null);
    const [shareExpiry, setShareExpiry] = useState("never");
    const [generatedLink, setGeneratedLink] = useState("");
    const [generatingLink, setGeneratingLink] = useState(false);

    // Version Control State
    const [docVersions, setDocVersions] = useState([]);
    const [isVersionsLoading, setIsVersionsLoading] = useState(false);
    const [isUploadingVersion, setIsUploadingVersion] = useState(false);
    const fileInputRef = window.React.useRef(null);

    useEffect(() => {
      setImgError(false);
      if (selectedDocument && !selectedDocument.isShared) {
        fetchVersions(selectedDocument.id);
      } else {
        setDocVersions([]);
      }
    }, [selectedDocument]);

    const fetchVersions = async (id) => {
      try {
        setIsVersionsLoading(true);
        const res = await api.get(`/documents/${id}/versions`);
        setDocVersions(res.data.versions || []);
      } catch (err) {
        console.error("Failed to load versions:", err);
      } finally {
        setIsVersionsLoading(false);
      }
    };

    const handleUploadVersion = async (e) => {
      const file = e.target.files[0];
      if (!file || !selectedDocument) return;

      if (file.size > 10 * 1024 * 1024) {
        showError('File is too large. Maximum size is 10MB.');
        return;
      }

      setIsUploadingVersion(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await api.post(`/documents/${selectedDocument.id}/versions`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showSuccess("New version uploaded securely!");
        setSelectedDocument(res.data.document); // Update preview to new document
        fetchVersions(selectedDocument.id); // Refresh history
        fetchDocuments(); // Refresh backing list
      } catch (err) {
        console.error("Failed to upload new version:", err);
        showError(err.response?.data?.error || "Failed to upload new version.");
      } finally {
        setIsUploadingVersion(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    const handleDownloadVersion = (vid, fileName, e) => {
      e.stopPropagation();
      window.open(`${api.defaults.baseURL}/documents/version/${vid}/download`, '_blank');
    };

    const fetchDocuments = async () => {
      try {
        setLoading(true);
        let url = '/documents';
        if (searchQuery.trim() !== '') {
          url = `/documents/search?q=${encodeURIComponent(searchQuery)}`;
        }
        
        const res = await api.get(url);
        let fetchedDocs = res.data.documents || [];
        
        if (categoryFilter !== "All Categories") {
          fetchedDocs = fetchedDocs.filter(d => 
            (d.category || 'other').toLowerCase() === categoryFilter.toLowerCase()
          );
        }
        
        if (showFavoritesOnly) {
          fetchedDocs = fetchedDocs.filter(d => !!d.isFavorite);
        }
        
        setDocs(fetchedDocs);
      } catch (err) {
        console.error("Failed to fetch documents", err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      const delayFn = setTimeout(() => {
        fetchDocuments();
      }, 300); // 300ms debounce
      return () => clearTimeout(delayFn);
    }, [searchQuery, categoryFilter, showFavoritesOnly]);

    const handleToggleFavorite = async (doc, e) => {
      e.stopPropagation();
      console.log(`[FRONTEND] Toggling favorite for doc ID: ${doc.id}`);
      
      const newStatus = !doc.isFavorite;
      // Optimistic UI Update
      setDocs(currentDocs => 
        currentDocs.map(d => d.id === doc.id ? { ...d, isFavorite: newStatus } : d)
      );
      
      try {
        await api.patch(`/documents/${doc.id}/favorite`);
      } catch (err) {
        console.error("[FRONTEND] Failed to toggle favorite", err);
        showError('Failed to update favorite status');
        // Rollback on failure
        setDocs(currentDocs => 
          currentDocs.map(d => d.id === doc.id ? { ...d, isFavorite: doc.isFavorite } : d)
        );
      }
    };

    const handleDeleteClick = (id, e) => {
      e.stopPropagation();
      setConfirmDeleteDocId(id);
    };

    const confirmDelete = async () => {
      const id = confirmDeleteDocId;
      if (!id) return;
      
      console.log(`[FRONTEND] Confirming deletion for ID: ${id}`);
      setConfirmDeleteDocId(null);
      
      try {
        // Optimistic UI Update using functional form to prevent stale state bugs
        setDocs(currentDocs => {
          const exists = currentDocs.some(d => d.id === id);
          if (!exists) {
            console.warn(`[FRONTEND] Trying to delete ID ${id} but it's not in the visible list.`);
          }
          return currentDocs.filter(d => d.id !== id);
        });

        await api.delete(`/documents/${id}`);
        showSuccess('Document deleted successfully');
      } catch (err) {
        console.error("[FRONTEND] Delete failed:", err);
        const errorMsg = err.response?.data?.error || 'Failed to delete document';
        showError(errorMsg);
        
        // Refetch to ensure UI is in sync with server instead of blindly reverting
        fetchDocuments();
      }
    };

    const formatBytes = (bytes) => {
      if (!bytes) return '0 KB';
      const kb = bytes / 1024;
      if (kb < 1024) return `${Math.round(kb)} KB`;
      return `${(kb / 1024).toFixed(1)} MB`;
    };

    const formatDate = (isoString) => {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handlePreview = (doc, e) => {
      e.stopPropagation();
      setSelectedDocument(doc);
      setIsPreviewOpen(true);
      setImgError(false);
    };

    const handleShareClick = (doc, e) => {
      e.stopPropagation();
      setShareModalDoc(doc);
      setGeneratedLink("");
      setShareExpiry("never");
    };

    const generateShareLink = async () => {
      if (!shareModalDoc) return;
      try {
        setGeneratingLink(true);
        let days = null;
        if (shareExpiry === "1") days = 1;
        if (shareExpiry === "7") days = 7;
        if (shareExpiry === "30") days = 30;

        const res = await api.post(`/documents/${shareModalDoc.id}/share`, { expires_in_days: days });
        setGeneratedLink(res.data.shareUrl);
        showSuccess("Public share link generated!");
      } catch (err) {
        showError("Failed to generate share link.");
        console.error(err);
      } finally {
        setGeneratingLink(false);
      }
    };

    const copyToClipboard = () => {
      if (!generatedLink) return;
      navigator.clipboard.writeText(generatedLink);
      showSuccess("Link copied to clipboard!");
    };

    const handleDownload = (doc, e) => {
      e.stopPropagation();
      // Use the dedicated download endpoint for better filename control
      window.open(`${api.defaults.baseURL}/documents/${doc.id}/download`, '_blank');
    };

    const renderPreview = () => {
      if (!selectedDocument || !selectedDocument.fileUrl) {
        return (
          <div className="w-full flex flex-col items-center justify-center text-slate-500 min-h-[350px]">
            <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-6 border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]">
              <Icons.FileText size={32} className="opacity-50 text-cyan-500" />
            </div>
            <p className="text-xl font-display font-semibold text-slate-300 mb-2">Preview not available</p>
          </div>
        );
      }

      const fileType = selectedDocument.fileType || 'unknown';
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType);
      const isPdf = fileType === 'pdf';

      if (isImage && !imgError) {
        return (
          <div className="flex items-center justify-center h-full w-full bg-navy-900/30 rounded-xl p-4 border border-white/5 min-h-[350px]">
            <img 
              src={selectedDocument.fileUrl} 
              alt={selectedDocument.name || 'Document Preview'} 
              className="max-w-full max-h-[400px] object-contain rounded-lg shadow-lg"
              onError={() => setImgError(true)}
            />
          </div>
        );
      } else if (isPdf) {
        return (
          <div className="flex flex-col items-center justify-center h-full w-full min-h-[500px] bg-navy-900/50 rounded-xl overflow-hidden border border-white/10 group">
            <iframe 
              src={`${selectedDocument.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
              className="w-full h-[500px] border-none"
              title="PDF Preview"
            />
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-navy-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
               <Button variant="secondary" onClick={(e) => handleDownload(selectedDocument, e)} className="w-full flex items-center justify-center backdrop-blur-md">
                 <Icons.FileText size={16} className="mr-2" /> Open Full Document
               </Button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex flex-col items-center justify-center h-full w-full min-h-[350px]">
            <div className="w-24 h-24 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)] border border-cyan-500/20">
              <Icons.FileText size={48} />
            </div>
            <h3 className="text-2xl font-display font-bold text-slate-300 mb-2">
               {isPdf ? "PDF Document" : "Preview not available"}
            </h3>
            <p className="text-slate-400 text-sm text-center max-w-xs">
              {imgError ? "Image failed to load securely." : `The .${fileType} file format is stored safely but cannot be previewed directly.`}
            </p>
          </div>
        );
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight text-gradient block">My Documents</h1>
            <p className="text-slate-400 mt-1">{docs.length} files securely stored.</p>
          </div>
          <Link to="/dashboard/upload">
            <Button variant="primary" className="h-10 px-4 text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center">
              <Icons.Plus size={16} className="mr-2" /> Upload New
            </Button>
          </Link>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by name, category, or tags..."
              className="w-full bg-navy-800/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-navy-800 transition-all"
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-navy-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50 capitalize"
          >
            <option>All Categories</option>
            <option>Identity</option>
            <option>Medical</option>
            <option>Property</option>
            <option>Insurance</option>
            <option>Financial</option>
            <option>Other</option>
          </select>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`border rounded-lg px-4 py-2.5 text-sm transition-all flex items-center space-x-2 ${
              showFavoritesOnly 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                : 'bg-navy-800/50 border-white/10 text-slate-300 hover:border-white/20'
            }`}
          >
            <Icons.Star size={16} className={showFavoritesOnly ? "fill-amber-400" : ""} />
            <span>Favorites</span>
          </button>
        </div>

        {loading ? (
           <div className="text-slate-400">Loading documents...</div>
        ) : docs.length === 0 ? (
           <div className="text-slate-400 py-12 text-center border-2 border-dashed border-slate-700/50 rounded-xl">
             <Icons.FileText className="mx-auto mb-3 text-slate-500" size={32} />
             No documents found.
             <div className="mt-4"><Link to="/dashboard/upload" className="text-cyan-400 hover:text-cyan-300">Upload one</Link></div>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {docs.map((doc) => (
              <GlassCard hover key={doc.id} className="p-4 flex flex-col justify-between group relative h-full">
                <div className="absolute top-4 right-4 flex space-x-2 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div 
                    className="hover:text-cyan-400 cursor-pointer p-1 bg-navy-900/50 rounded"
                    onClick={(e) => handleDownload(doc, e)}
                    title="Download Document"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </div>
                  <div 
                    className={`cursor-pointer p-1 bg-navy-900/50 rounded transition-colors ${doc.isFavorite ? 'text-amber-400 hover:text-amber-300' : 'hover:text-amber-400'}`}
                    onClick={(e) => handleToggleFavorite(doc, e)}
                    title={doc.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <Icons.Star size={16} className={doc.isFavorite ? "fill-amber-400" : ""} />
                  </div>
                  {!doc.isShared && (
                    <>
                      <div 
                        className="hover:text-indigo-400 cursor-pointer p-1 bg-navy-900/50 rounded transition-colors"
                        onClick={(e) => handleShareClick(doc, e)}
                        title="Share Document"
                      >
                        <Icons.Share size={16} />
                      </div>
                      <div 
                        className="hover:text-red-400 cursor-pointer p-1 bg-navy-900/50 rounded transition-colors"
                        onClick={(e) => handleDeleteClick(doc.id, e)}
                        title="Delete Document"
                      >
                        <Icons.Trash size={16} />
                      </div>
                    </>
                  )}
                </div>
                
                <div className="cursor-pointer" onClick={(e) => handlePreview(doc, e)}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all ${
                    doc.fileType === 'pdf' ? 'bg-red-500/10 text-red-400 group-hover:bg-red-500/20' : 
                    ['jpg','jpeg','png'].includes(doc.fileType) ? 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20' :
                    'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20'
                  }`}>
                    <Icons.FileText size={20} />
                  </div>
                  <h3 className="font-semibold text-white/90 text-sm truncate mb-1" title={doc.name}>
                    {doc.isShared && <span className="mr-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 align-middle">SHARED</span>}
                    {doc.name}
                  </h3>
                  <p className="text-xs font-medium text-cyan-400 mb-3 capitalize">
                    {doc.category || 'Other'}
                    {doc.isShared && <span className="ml-1 text-slate-500">by {doc.ownerName}</span>}
                  </p>
                </div>

                <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center text-[11px] text-slate-500 font-medium tracking-wide pointer-events-none">
                  <span>{formatDate(doc.created_at)}</span>
                  <span>{formatBytes(doc.file_size)}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        <AnimatePresence>
          {isPreviewOpen && selectedDocument && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-navy-900/90 backdrop-blur-sm cursor-pointer" 
                onClick={() => setIsPreviewOpen(false)} 
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.95, opacity: 0, y: 20 }} 
                className="w-full max-w-2xl relative z-10"
              >
                <GlassCard className="p-0 border-cyan-500/20 ring-1 ring-white/10 overflow-hidden flex flex-col items-center">
                  <div className="w-full flex justify-between items-center p-6 border-b border-white/10 bg-navy-900/50 shadow-sm">
                    <h2 className="text-xl font-display font-bold text-white flex items-center truncate">
                      <Icons.FileText className={`mr-3 shrink-0 ${selectedDocument.fileType === 'pdf' ? 'text-red-400' : 'text-cyan-400'}`} size={20} /> <span className="truncate">{selectedDocument.name}</span>
                    </h2>
                    <button onClick={() => setIsPreviewOpen(false)} className="text-slate-400 hover:text-white bg-white/5 hover:bg-red-500/20 hover:text-red-400 p-2 rounded-full transition-colors flex-shrink-0">
                      <Icons.Plus className="rotate-45" size={20}/>
                    </button>
                  </div>
                  <div className="p-6 w-full flex flex-col items-center justify-start text-slate-500 min-h-[350px] max-h-[75vh] overflow-y-auto">
                    <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[300px]">
                      {renderPreview()}
                    </div>
                    
                    <div className="w-full mt-6 bg-navy-900/50 p-6 rounded-xl border border-white/5">
                      <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Document Details</h3>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                        <div>
                          <p className="text-slate-500 mb-1 font-medium">Document Name</p>
                          <p className="text-slate-300 font-semibold truncate" title={selectedDocument.name}>{selectedDocument.name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 mb-1 font-medium">Category</p>
                          {selectedDocument.category ? (
                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold capitalize tracking-wide bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 inline-block">
                              {selectedDocument.category}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-semibold">N/A</span>
                          )}
                        </div>
                        <div>
                           <p className="text-slate-500 mb-1 font-medium">Expiry Date</p>
                           <p className="text-slate-300 font-semibold">
                              {selectedDocument.expiryDate ? formatDate(selectedDocument.expiryDate) : "N/A"}
                           </p>
                        </div>
                        <div>
                           <p className="text-slate-500 mb-1 font-medium">Last Modified</p>
                           <p className="text-slate-300 font-semibold">
                              {selectedDocument.createdAt ? formatDate(selectedDocument.createdAt) : "N/A"}
                           </p>
                        </div>
                      </div>

                      {/* Versions History Area */}
                      {!selectedDocument.isShared && (
                        <div className="mt-8 pt-6 border-t border-white/5">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                              <Icons.Clock size={16} className="mr-2 text-indigo-400" />
                              Version History
                            </h3>
                            <div>
                              <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleUploadVersion} 
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                              />
                              <Button 
                                variant="secondary" 
                                className="h-8 px-3 text-xs bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingVersion}
                              >
                                {isUploadingVersion ? "Uploading..." : "Upload New Version"}
                              </Button>
                            </div>
                          </div>

                          {isVersionsLoading ? (
                            <div className="text-xs text-slate-500 flex items-center"><div className="w-3 h-3 rounded-full border border-indigo-500/30 border-t-indigo-500 animate-spin mr-2"></div> Loading...</div>
                          ) : (
                            <div className="space-y-2">
                              {/* Current Version Indicator */}
                              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                                <div className="flex flex-col">
                                  <span className="text-emerald-400 text-xs font-bold uppercase mb-0.5 flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse"></div>LATEST VERSION</span>
                                  <span className="text-slate-400 text-[11px]">Updated on {formatDate(selectedDocument.createdAt)} • {formatBytes(selectedDocument.file_size)}</span>
                                </div>
                              </div>

                              {/* Past Versions List */}
                              {docVersions.length > 0 ? docVersions.map((v, index) => (
                                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-navy-900/80 border border-white/5 hover:border-white/10 transition-colors">
                                  <div className="flex flex-col">
                                    <span className="text-slate-300 text-xs font-semibold mb-0.5">Version {docVersions.length - index}</span>
                                    <span className="text-slate-500 text-[11px]">Logged on {formatDate(v.created_at)} • {formatBytes(v.file_size)}</span>
                                  </div>
                                  <button 
                                    className="p-1.5 bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 rounded-md transition-colors"
                                    onClick={(e) => handleDownloadVersion(v.id, v.file_name, e)}
                                    title="Download Older Version"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                  </button>
                                </div>
                              )) : (
                                <div className="text-xs text-slate-500 py-2 border-l-2 border-dashed border-white/10 pl-3">No previous versions.</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-full p-6 border-t border-white/10 bg-navy-900/30 flex justify-end items-center space-x-4 shrink-0">
                    <Button 
                      variant="secondary" 
                      onClick={() => setIsPreviewOpen(false)} 
                      aria-label="Close Preview Modal"
                      className="transition-transform hover:scale-105"
                    >
                      Close
                    </Button>
                    {selectedDocument && selectedDocument.fileUrl ? (
                      <Button 
                        variant="primary" 
                        onClick={(e) => handleDownload(selectedDocument, e)} 
                        aria-label="Download Document"
                        className="transition-transform hover:scale-105 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]"
                      >
                        Download File
                      </Button>
                    ) : (
                      <Button 
                        variant="secondary" 
                        aria-label="Download Unavailable" 
                        className="opacity-50 cursor-not-allowed"
                        onClick={(e) => e.preventDefault()}
                      >
                        Unavailable
                      </Button>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {confirmDeleteDocId && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-navy-900/90 backdrop-blur-sm" onClick={() => setConfirmDeleteDocId(null)} />
               <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-sm">
                 <GlassCard className="p-6 border-red-500/30">
                   <h3 className="text-xl font-bold text-white mb-2 flex items-center"><Icons.AlertTriangle className="text-red-400 mr-2" size={20}/> Delete Document?</h3>
                   <p className="text-slate-400 text-sm mb-6">Are you sure you want to permanently delete this document? This action cannot be undone.</p>
                   <div className="flex justify-end space-x-3">
                     <Button variant="secondary" onClick={() => setConfirmDeleteDocId(null)}>Cancel</Button>
                     <Button variant="danger" onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white border-transparent">Delete</Button>
                   </div>
                 </GlassCard>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        {/* Share Modal */}
        <AnimatePresence>
          {shareModalDoc && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-navy-900/90 backdrop-blur-sm" onClick={() => setShareModalDoc(null)} />
               <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-md">
                 <GlassCard className="p-6 border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                   <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-bold text-white flex items-center"><Icons.Share className="text-indigo-400 mr-3" size={20}/> Share Document</h3>
                     <button onClick={() => setShareModalDoc(null)} className="text-slate-500 hover:text-white transition-colors">
                       <Icons.Plus className="rotate-45" size={20} />
                     </button>
                   </div>
                   
                   <p className="text-slate-400 text-sm mb-4">Generate a secure public download link for <strong>{shareModalDoc.name}</strong>.</p>
                   
                   {!generatedLink ? (
                     <div className="space-y-4">
                       <div>
                         <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Link Expiry</label>
                         <select 
                           value={shareExpiry}
                           onChange={(e) => setShareExpiry(e.target.value)}
                           className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                         >
                           <option value="never">Never Expire</option>
                           <option value="1">Expire in 24 Hours</option>
                           <option value="7">Expire in 7 Days</option>
                           <option value="30">Expire in 30 Days</option>
                         </select>
                       </div>
                       
                       <Button 
                         variant="primary" 
                         onClick={generateShareLink} 
                         disabled={generatingLink}
                         className="w-full h-11 flex justify-center items-center bg-indigo-500 hover:bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all disabled:opacity-50"
                       >
                         {generatingLink ? <span className="animate-pulse">Generating...</span> : "Generate Secure Link"}
                       </Button>
                     </div>
                   ) : (
                     <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                       <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                         <div className="flex items-center text-emerald-400 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            <span className="font-semibold text-sm">Link Generated successfully</span>
                         </div>
                         <div className="flex flex-col space-y-2">
                           <input 
                             readOnly 
                             value={generatedLink} 
                             className="w-full bg-navy-900/80 border border-white/10 rounded overflow-hidden text-xs text-slate-300 p-2 cursor-pointer font-mono"
                             onClick={(e) => e.target.select()}
                           />
                           <div className="flex space-x-2">
                             <Button onClick={copyToClipboard} className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs h-8 border-transparent transition-colors">
                               Copy Link
                             </Button>
                             <Button onClick={() => setGeneratedLink("")} className="bg-white/5 hover:bg-white/10 text-slate-400 text-xs px-3 h-8 border-transparent">
                               Reset
                             </Button>
                           </div>
                         </div>
                       </div>
                     </div>
                   )}
                 </GlassCard>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  window.Documents = Documents;
})();
