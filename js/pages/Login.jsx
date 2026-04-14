(function () {
  const { GlassCard, Button, Icons, useAuth } = window;
  const { Link, useNavigate, useLocation } = window.Router;
  const { motion } = window.Motion;
  const { useState } = window.React;

  const Login = () => {
    const [email, setEmail] = useState('demo@lifedoc.com');
    const [password, setPassword] = useState('password');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const { login, verifyOtp } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const from = location.state?.from?.pathname || "/dashboard";

    const handleLogin = async (e) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        await login(email, password);
        setStep(2);
      } catch (err) {
        setError(err.response?.data?.error || 'Login failed');
      } finally {
        setLoading(false);
      }
    };

    const handleVerifyOtp = async (e) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        await verifyOtp(email, otp);
        navigate(from, { replace: true });
      } catch (err) {
        setError(err.response?.data?.error || 'OTP verification failed');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh p-6 relative overflow-hidden">
        {/* Glow Effects */}
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
              <h1 className="text-2xl font-display font-bold text-white mb-2">
                {step === 1 ? 'Welcome Back' : 'Verify Identity'}
              </h1>
              <p className="text-slate-400 text-sm">
                {step === 1 ? 'Sign in to access your secure vault' : 'Enter the OTP sent to your email'}
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {step === 1 ? (
              <form className="space-y-5" onSubmit={handleLogin}>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
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
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-300">Password</label>
                    <a href="#" className="text-xs text-cyan-400 hover:text-cyan-300">Forgot password?</a>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" variant="primary" className="w-full mt-4" disabled={loading}>
                  {loading ? 'Authenticating...' : 'Unlock Vault'}
                </Button>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleVerifyOtp}>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">6-Digit OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-center tracking-widest text-lg transition-all"
                    placeholder="000000"
                    required
                  />
                </div>
                <Button type="submit" variant="primary" className="w-full mt-4" disabled={loading}>
                  {loading ? 'Verifying...' : 'Complete Login'}
                </Button>
                <div className="text-center mt-4">
                  <button type="button" onClick={() => setStep(1)} className="text-sm text-slate-400 hover:text-white">
                     ← Back to Login
                  </button>
                </div>
              </form>
            )}

            <p className="mt-8 text-center text-sm text-slate-400">
              Don't have an account? <Link to="/register" className="text-cyan-400 font-medium hover:underline">Create one</Link>
            </p>
          </GlassCard>
        </motion.div>
      </div>
    );
  };

  window.Login = Login;
})();
