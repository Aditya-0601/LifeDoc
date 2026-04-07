(function () {
  const { motion, AnimatePresence } = window.Motion;
  const { useEffect } = window.React;
  const { Icons, GlassCard } = window;

  const DocumentPreviewModal = ({ isOpen, onClose, document }) => {
    // Handle ESC key press
    useEffect(() => {
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      if (isOpen) {
        window.addEventListener('keydown', handleEsc);
      }
      return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy-900/80 backdrop-blur-sm"
              onClick={onClose}
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl h-[80vh] z-10 flex flex-col"
            >
              <GlassCard className="flex flex-col h-full overflow-hidden border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-navy-800/50">
                  <h2 className="text-lg font-semibold text-white truncate pr-4">
                    {document?.title || 'Document Preview'}
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Icons.X size={20} />
                  </button>
                </div>
                
                {/* Body - empty for now */}
                <div className="flex-1 p-6 relative bg-navy-900/50">
                   <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                     <p>Preview content will be implemented here.</p>
                   </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  window.DocumentPreviewModal = DocumentPreviewModal;
})();
