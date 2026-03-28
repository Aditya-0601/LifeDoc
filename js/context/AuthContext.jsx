(function () {
  const { createContext, useState, useEffect, useContext } = window.React;
  const { Navigate, useLocation } = window.Router;
  const api = window.api;

  const AuthContext = createContext(null);

  const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchUser = async () => {
        if (!token) {
          setLoading(false);
          return;
        }
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          console.error('Failed to fetch user:', err);
          logout();
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }, [token]);

    const login = async (email, password) => {
      const res = await api.post('/auth/login', { email, password });
      return res.data; 
    };

    const verifyOtp = async (email, otp) => {
      const res = await api.post('/auth/verify-otp', { email, otp });
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      return res.data;
    };

    const register = async (name, email, password) => {
      const res = await api.post('/auth/register', { name, email, password });
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      return res.data;
    };

    const logout = () => {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    };

    return (
      <AuthContext.Provider value={{ user, token, loading, login, verifyOtp, register, logout }}>
        {children}
      </AuthContext.Provider>
    );
  };

  const useAuth = () => useContext(AuthContext);

  const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
      return (
         <div className="min-h-screen bg-navy-900 flex items-center justify-center">
            <div className="flex flex-col items-center">
               <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
               <p className="mt-4 text-cyan-400 font-display">Decrypting Vault...</p>
            </div>
         </div>
      );
    }

    if (!user) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
  };

  window.AuthProvider = AuthProvider;
  window.useAuth = useAuth;
  window.ProtectedRoute = ProtectedRoute;
})();
