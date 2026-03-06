import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { featuresAPI } from '../services/api';
import { LayoutDashboard, MessageSquare, Briefcase, Users, UserCircle, LogOut, Search, Bell, Menu, X, Moon, Sun, FileText, GraduationCap, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children }) => {
  const { user, logout, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (token) {
      featuresAPI.notifications()
        .then(res => setNotifications(res.data.data || []))
        .catch(err => console.error(err));
    }
  }, [token]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Q&A', path: '/questions', icon: Search },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Network', path: '/alumni', icon: Users },
    { name: 'Jobs', path: '/jobs', icon: Briefcase },
    { name: 'Resume', path: '/resume', icon: FileText },
    { name: 'Mentors', path: '/mentors', icon: GraduationCap },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Profile', path: '/profile', icon: UserCircle }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <span className="font-bold text-xl text-primary font-heading">AlumniNet</span>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-muted-foreground hover:text-foreground">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 768) && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col ${isSidebarOpen ? 'block' : 'hidden md:flex'}`}
          >
            <div className="p-6 hidden md:flex justify-between items-center">
              <span className="font-extrabold text-2xl tracking-tight text-primary font-heading">AlumniNet</span>
            </div>
            
            <nav className="flex-1 px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    <Icon size={20} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-border space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                    {user?.name?.charAt(0)}
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <button onClick={toggleTheme} className="text-sm font-medium flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted">
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} Toggle Theme
                </button>
              </div>

              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 font-medium transition-colors"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto bg-background transition-colors duration-300">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold capitalize hidden md:block">
            {location.pathname.substring(1) || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4 ml-auto">
            {/* Search */}
            <div className="relative hidden lg:block text-muted-foreground">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} />
              <input type="text" placeholder="Search..." className="bg-muted border border-border rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm w-64 text-foreground" />
            </div>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Bell size={20} />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card"></span>
                )}
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-border bg-muted/30 flex justify-between items-center">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      <button className="text-xs text-primary hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-border text-sm ${!n.isRead ? 'bg-primary/5' : ''}`}>
                          <p className="text-foreground">{n.text}</p>
                          <span className="text-xs text-muted-foreground mt-1 block">Just now</span>
                        </div>
                      )) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <div className="p-6 md:p-8 flex-1 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
