(function () {
  const { motion } = window.Motion;

  const Button = ({ children, variant = "primary", className = "", ...props }) => {
    const baseStyle = "inline-flex items-center justify-center font-medium transition-all duration-300 rounded-lg px-6 py-3";

    const variants = {
      primary: "bg-cyan-500 hover:bg-cyan-400 text-navy-900 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]",
      secondary: "bg-navy-800 border border-white/10 text-white hover:bg-navy-700 hover:border-cyan-500/50",
      ghost: "hover:bg-white/5 text-slate-300 hover:text-white"
    };

    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`${baseStyle} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </motion.button>
    );
  };

  window.Button = Button;
})();
