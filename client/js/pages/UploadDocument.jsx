(function () {
  const { GlassCard, Button, Icons } = window;
  const { motion } = window.Motion;

  const UploadDocument = () => {
    const { useState, useRef } = window.React;
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        setFile(e.target.files[0]);
      }
    };

    const handleUpload = async () => {
      if (!file) return;
      setUploading(true);
      setMessage('');

      const formData = new FormData();
      formData.append('file', file);
      // Hardcode category and title for now, or you can add inputs later
      formData.append('category', 'General');
      formData.append('title', file.name);

      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/documents/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Upload failed');

        setMessage('File uploaded successfully!');
        setFile(null);
      } catch (err) {
        setMessage('Error: ' + err.message);
      } finally {
        setUploading(false);
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
          <p className="text-slate-400 mt-1">Files are securely sent to the local backend and Postgres DB.</p>
        </div>

        {message && (
          <div className="mb-4 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 rounded-lg p-3 text-sm">
            {message}
          </div>
        )}

        <GlassCard
          className="p-10 border-dashed border-2 border-slate-600/50 hover:border-cyan-500/50 hover:bg-navy-800/80 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[400px]"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            onClick={(e) => e.stopPropagation()}
          />

          <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
            <Icons.Plus size={32} className="text-cyan-400" />
          </div>
          <h3 className="text-xl font-display font-semibold text-white mb-2">
            {file ? file.name : "Click to select your files here"}
          </h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs text-center">Supports PDF, JPG, PNG, DOCX up to 50MB per file.</p>

          {file ? (
            <Button variant="primary" onClick={(e) => { e.stopPropagation(); handleUpload(); }} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Confirm Upload'}
            </Button>
          ) : (
            <Button variant="secondary" className="pointer-events-none">Browse Files</Button>
          )}
        </GlassCard>

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
