(function () {
  const { GlassCard } = window;
  const { motion } = window.Motion;
  const { Icons } = window;

  const Features = () => {
    const features = [
      {
        icon: Icons.Vault,
        title: "Secure Document Vault",
        desc: "Upload and store important documents like passports, certificates, and property papers in a secure encrypted vault.",
        color: "from-cyan-500/20 to-transparent",
        iconColor: "text-cyan-400"
      },
      {
        icon: Icons.Calendar,
        title: "Smart Expiry Reminders",
        desc: "LifeDoc automatically tracks document expiry dates and reminds you before deadlines approach.",
        color: "from-indigo-500/20 to-transparent",
        iconColor: "text-indigo-400"
      },
      {
        icon: Icons.Users,
        title: "Emergency Family Access",
        desc: "Grant trusted family members secure access to essential documents during critical emergencies.",
        color: "from-emerald-500/20 to-transparent",
        iconColor: "text-emerald-400"
      },
      {
        icon: Icons.Search,
        title: "Instant Document Search",
        desc: "Find documents instantly using smart search, tags, and category filtering parameters.",
        color: "from-violet-500/20 to-transparent",
        iconColor: "text-violet-400"
      }
    ];

    return (
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Built for your <span className="text-gradient">Peace of Mind</span></h2>
            <p className="text-slate-400 text-lg">Intelligent tools to manage your life's paperwork without the headache.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                key={i}
              >
                <GlassCard hover className={`h-full relative overflow-hidden group`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                      <f.icon className={f.iconColor} size={24} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{f.title}</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">{f.desc}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  window.Features = Features;
})();
