/**
 * Landing Page
 * 
 * The default entry point of the application for unauthenticated users. 
 * Combines the Hero section, Features showcase, and a mock Product Demo.
 */
(function () {
  const { Hero, Features, GlassCard, Button, Icons } = window;
  const { motion } = window.Motion;
  const { Link } = window.Router;

  // Mini component: Product Demo Mockup
  const ProductDemo = () => (
    <section id="how-it-works" className="py-24">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">Intelligent Tracking at a Glance</h2>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full max-w-4xl relative"
        >
          {/* Dashboard Frame */}
          <div className="rounded-2xl border border-white/10 bg-navy-900 shadow-2xl overflow-hidden glass-panel">
            <div className="flex items-center px-4 py-3 border-b border-white/10 bg-navy-800/50">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                <div className="w-3 h-3 rounded-full bg-slate-600"></div>
              </div>
            </div>

            <div className="p-8 grid md:grid-cols-3 gap-6 bg-gradient-to-b from-navy-900 to-navy-800">
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-white font-semibold mb-4">Upcoming Expiries</h3>

                {[
                  { name: "US Passport", category: "Identity", time: "in 6 months", status: "text-amber-400" },
                  { name: "Health Insurance", category: "Medical", time: "in 30 days", status: "text-red-400" },
                  { name: "Apartment Lease", category: "Property", time: "in 8 months", status: "text-emerald-400" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-lg bg-navy-700 flex justify-center items-center text-slate-300">
                        <Icons.FileText size={20} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${item.status}`}>Expires {item.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-white font-semibold mb-4">Quick Stats</h3>
                <GlassCard className="p-4 text-center">
                  <p className="text-4xl font-display font-bold text-cyan-400 mb-1">12</p>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Total Docs</p>
                </GlassCard>
                <GlassCard className="p-4 text-center">
                  <p className="text-4xl font-display font-bold text-emerald-400 mb-1">100%</p>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Encrypted</p>
                </GlassCard>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );

  const Header = () => (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md border-b border-white/5 bg-navy-900/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icons.Vault className="text-cyan-500" />
          <span className="font-display font-bold text-xl tracking-tight text-white">Life<span className="text-cyan-500">Doc</span></span>
        </div>
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
        </nav>
        <div className="flex items-center justify-end space-x-4">
          <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white hidden md:block">Sign In</Link>
          <Link to="/register">
            <Button variant="primary" className="py-2 px-4 shadow-none">Open Vault</Button>
          </Link>
        </div>
      </div>
    </header>
  );

  const Footer = () => (
    <footer className="border-t border-white/5 py-12 mt-20 text-center text-slate-500">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center space-x-2 opacity-50 mb-6">
          <Icons.Vault />
          <span className="font-display font-bold text-xl tracking-tight">LifeDoc</span>
        </div>
        <div className="flex justify-center space-x-6 text-sm mb-8">
          <a href="#" className="hover:text-white">Privacy</a>
          <a href="#" className="hover:text-white">Terms</a>
          <a href="#" className="hover:text-white">Security</a>
        </div>
        <p className="text-sm">&copy; 2026 LifeDoc SaaS. All rights secured.</p>
      </div>
    </footer>
  );

  const Landing = () => {
    return (
      <div className="min-h-screen bg-mesh">
        <Header />
        <main>
          <Hero />
          <div className="relative z-10">
            <Features />
            <ProductDemo />

            <section id="security" className="py-24 text-center max-w-3xl mx-auto px-6">
              <Icons.Shield className="w-16 h-16 text-cyan-400 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl font-display font-bold mb-6">Bank-Grade Trust</h2>
              <p className="text-slate-400 text-lg mb-8 text-balance">We employ end-to-end AES-256 encryption. Your keys never leave your devices, meaning even we cannot access your stored life documents.</p>
              <Link to="/register">
                <Button className="relative z-20 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)] px-8 py-4">Secure Your Documents Now</Button>
              </Link>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    );
  };

  window.Landing = Landing;
})();
