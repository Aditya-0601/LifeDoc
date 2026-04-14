/**
 * GlassCard Component
 * 
 * A reusable UI wrapper that provides a frosted-glass (glassmorphism) style 
 * card container. Supports hover effects and custom class names.
 */
(function() {
  const { motion } = window.Motion;

  const GlassCard = ({ children, className = "", hover = false, ...props }) => {
    return (
      <motion.div 
        className={`glass-panel rounded-2xl p-6 ${hover ? 'glass-panel-hover cursor-pointer' : ''} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  };

  window.GlassCard = GlassCard;
})();
