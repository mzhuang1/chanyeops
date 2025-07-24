import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        const loggedOut = localStorage.getItem('logged_out');
        const stored = localStorage.getItem('demo_user');
        
        if (loggedOut === 'true') {
          setUser(null);
        } else if (stored) {
          const parsedUser = JSON.parse(stored);
          setUser(parsedUser);
        } else {
          // Create demo user if none exists
          const demoUser = {
            id: 'demo_user_' + Date.now(),
            username: 'Demo User',
            email: 'demo@example.com',
            role: 'user'
          };
          localStorage.setItem('demo_user', JSON.stringify(demoUser));
          setUser(demoUser);
        }
      } catch (error) {
        console.error('Auth error:', error);
        // Fallback to demo user
        const demoUser = {
          id: 'demo_user_' + Date.now(),
          username: 'Demo User',
          email: 'demo@example.com',
          role: 'user'
        };
        localStorage.setItem('demo_user', JSON.stringify(demoUser));
        setUser(demoUser);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure DOM is ready
    setTimeout(initAuth, 100);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: () => {
      localStorage.removeItem('demo_user');
      localStorage.setItem('logged_out', 'true');
      setUser(null);
      window.location.reload();
    }
  };
}
