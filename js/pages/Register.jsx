/**
 * Register Page
 * 
 * Handles new user registration. Captures name, email, and master password
 * to provision a new secure vault account.
 */
(function () {
  const { GlassCard, Button, Icons, useAuth } = window;
  const { Link, useNavigate } = window.Router;
  const { motion } = window.Motion;
  const { useState } = window.React;

  const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleRegister = async (e) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        await register(name, email, password);
        navigate("/dashboard", { replace: true });
      } catch (err) {
        setError(err.response?.data?.error || 'Registration failed');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-700/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-700/20 rounded-full blur-[120px] pointer-events-none" />

        <Link to="/" className="absolute top-8 left-8 flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
          <Icons.Vault className="text-cyan-500 w-6 h-6" />
          <span className="font-display font-bold text-xl tracking-tight text-white hidden md:block">Life<span className="text-cyan-500">Doc</span></span>
        </Link>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <GlassCard className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-display font-bold text-white mb-2">Create your Vault</h1>
              <p className="text-slate-400 text-sm">Setup your secure end-to-end encrypted account</p>
            </div>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleRegister}>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  placeholder="Jane Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Master Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" variant="primary" className="w-full mt-6" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Secure Keys'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account? <Link to="/login" className="text-cyan-400 font-medium hover:underline">Sign in</Link>
            </p>
          </GlassCard>
        </motion.div>
      </div>
    );
  };

  window.Register = Register;
})();
