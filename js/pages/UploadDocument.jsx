/**
 * Upload Document Page
 * 
 * Interface for securely uploading new files to the vault.
 * Supports drag-and-drop, captures metadata like title and category,
 * and shows upload progress.
 */
(function () {
  const { GlassCard, Button, Icons } = window;
  const { motion } = window.Motion;
  const { useState, useRef } = window.React;
  const { useNavigate } = window.Router;
  const api = window.api;

  const UploadDocument = () => {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('identity');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleFileSelect = (e) => {
      if (e.target.files && e.target.files[0]) {
        validateAndSetFile(e.target.files[0]);
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        validateAndSetFile(e.dataTransfer.files[0]);
      }
    };

    const validateAndSetFile = (selectedFile) => {
      setError('');
const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Only PDF, JPG, PNG, DOC, or DOCX files are supported.');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File too large. Maximum allowed size is 10MB.');
        return;
      }
      setFile(selectedFile);
      if(!title) setTitle(selectedFile.name);
    };

    const handleUpload = async () => {
      if (!file) return;
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('category', category);

      try {
        await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || 1;
            const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
            setProgress(percentCompleted);
          }
        });
        
        // redirect to documents
        navigate('/dashboard/documents');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to upload document.');
        setUploading(false);
        setProgress(0);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Upload Document</h1>
          <p className="text-slate-400 mt-1">All files are encrypted client-side before touching our servers.</p>
        </div>

        {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400 text-sm flex items-start">
              <Icons.AlertCircle size={18} className="mr-3 shrink-0" />
              <div>
                <p className="font-bold mb-1">Upload failed</p>
                <p className="opacity-80">{error}</p>
                <p className="text-[10px] mt-2 text-slate-500 italic">Tip: Ensure you are logged in and the server is running on port 5000.</p>
              </div>
            </div>
        )}

        {!file ? (
          <GlassCard 
            className="p-10 border-dashed border-2 border-slate-600/50 hover:border-cyan-500/50 hover:bg-navy-800/80 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[400px]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
              <Icons.Plus size={32} className="text-cyan-400" />
            </div>
            <h3 className="text-xl font-display font-semibold text-white mb-2">Drag & drop your files here</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-xs text-center">Supports PDF, JPG, PNG up to 10MB per file.</p>
            <Button variant="secondary" className="pointer-events-none">Browse Files</Button>
          </GlassCard>
        ) : (
          <GlassCard className="p-8">
            <div className="flex items-center space-x-4 mb-8 p-4 bg-navy-900 border border-white/5 rounded-xl">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Icons.FileText size={24} />
              </div>
              <div className="flex-1 truncate">
                <p className="text-white font-medium truncate">{file.name}</p>
                <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              {!uploading && (
                <button onClick={() => setFile(null)} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                  <Icons.Trash size={18} />
                </button>
              )}
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Document Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                  disabled={uploading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  disabled={uploading}
                >
                  <option value="identity">Identity</option>
                  <option value="medical">Medical</option>
                  <option value="property">Property</option>
                  <option value="insurance">Insurance</option>
                  <option value="financial">Financial</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {uploading ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-cyan-400 font-medium">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-navy-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <Button onClick={handleUpload} variant="primary" className="w-full">
                <Icons.Upload size={16} className="mr-2" />
                Upload Document
              </Button>
            )}
          </GlassCard>
        )}

        <div className="mt-8 flex items-start space-x-3 bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-indigo-300 text-sm">
          <Icons.Shield size={20} className="shrink-0 text-indigo-400" />
          <p>
            <strong className="text-indigo-200">End-to-end Encrypted.</strong> We use AES-256-GCM encryption.
            Your private key remains on your device. We never see the contents of what you upload.
          </p>
        </div>
      </motion.div>
    );
  };

  window.UploadDocument = UploadDocument;
})();
