/**
 * ToastContext
 * 
 * Provides a global notification system (toasts) across the application. 
 * Allows triggering success, error, and info messages which appear overlaid on the screen.
 */
(function () {
  const { createContext, useState, useContext, useCallback, useRef } = window.React;
  const { motion, AnimatePresence } = window.Motion;
  const { Icons } = window;

  const ToastContext = createContext(null);

  const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    
    // Using a ref to track IDs
    const nextId = useRef(0);

    const removeToast = useCallback((id) => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message, type = 'info', duration = 4000) => {
      const id = nextId.current++;
      setToasts(prev => [...prev, { id, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    }, [removeToast]);

    const showSuccess = useCallback((message) => showToast(message, 'success'), [showToast]);
    const showError = useCallback((message) => showToast(message, 'error'), [showToast]);
    const showInfo = useCallback((message) => showToast(message, 'info'), [showToast]);

    return (
      <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo }}>
        {children}
        
        {/* Toast Container */}
        <div className="fixed top-4 right-4 z-[9999] flex flex-col space-y-3 pointer-events-none max-w-sm w-full">
          <AnimatePresence>
            {toasts.map((toast) => {
              // Styling based on type
              let bg = 'bg-navy-800';
              let border = 'border-white/10';
              let text = 'text-white';
              let Icon = Icons.Bell;
              let iconColor = 'text-cyan-400';

              if (toast.type === 'success') {
                bg = 'bg-emerald-500/10 backdrop-blur-md';
                border = 'border-emerald-500/30';
                text = 'text-emerald-100';
                Icon = Icons.Check;
                iconColor = 'text-emerald-400';
              } else if (toast.type === 'error') {
                bg = 'bg-red-500/10 backdrop-blur-md';
                border = 'border-red-500/30';
                text = 'text-red-100';
                Icon = Icons.AlertTriangle;
                iconColor = 'text-red-400';
              } else {
                bg = 'bg-navy-800/80 backdrop-blur-md';
                border = 'border-cyan-500/30';
                text = 'text-cyan-100';
                Icon = Icons.Bell;
                iconColor = 'text-cyan-400';
              }

              return (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, x: 50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  layout
                  className={`flex items-start p-4 rounded-xl shadow-2xl border pointer-events-auto ${bg} ${border}`}
                >
                  <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                    <Icon size={18} />
                  </div>
                  <div className={`flex-1 ml-3 mr-2 font-medium text-sm leading-snug ${text}`}>
                    {toast.message}
                  </div>
                  <button 
                    onClick={() => removeToast(toast.id)}
                    className="shrink-0 text-white/50 hover:text-white transition-colors"
                  >
                    <Icons.Plus size={18} className="rotate-45" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ToastContext.Provider>
    );
  };

  const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
      throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
  };

  window.ToastProvider = ToastProvider;
  window.useToast = useToast;
})();
