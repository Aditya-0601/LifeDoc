(function () {
  const { NavLink } = window.Router;
  const { Icons } = window;

  const Sidebar = () => {
    const defaultClasses = "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5";
    const activeClasses = "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";

    const navItems = [
      { name: "Dashboard", icon: Icons.Dashboard, path: "/dashboard", exact: true },
      { name: "Documents", icon: Icons.FileText, path: "/dashboard/documents" },
      { name: "Upload", icon: Icons.Plus, path: "/dashboard/upload" },
      { name: "Reminders", icon: Icons.Calendar, path: "/dashboard/reminders" },
      { name: "Family Access", icon: Icons.Users, path: "/dashboard/family" },
      { name: "Notifications", icon: Icons.Bell, path: "/dashboard/notifications" },
    ];

    return (
      <aside className="w-64 border-r border-white/10 bg-navy-900/50 backdrop-blur-xl h-screen flex flex-col fixed left-0 top-0">
        <div className="p-6">
          <NavLink to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-navy-900">
              <Icons.Vault size={20} />
            </div>
            <span className="text-xl font-display font-bold text-white tracking-tight">Life<span className="text-cyan-400">Doc</span></span>
          </NavLink>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => isActive ? activeClasses : defaultClasses}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <NavLink to="/admin" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:text-slate-300 transition-colors">
            <Icons.Settings size={20} />
            <span className="font-medium text-sm">Admin Area</span>
          </NavLink>
        </div>
      </aside>
    );
  };

  window.Sidebar = Sidebar;
})();
