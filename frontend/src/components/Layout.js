import React, { useState, useEffect } from 'react';
import { Link, useLocation, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
      <header className="bg-white shadow-md">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <NavLink to="/" className="text-2xl font-bold text-gray-800">
            MovieRecs
          </NavLink>
          <div className="flex items-center space-x-4">
            <NavLink to="/" className="text-gray-600 hover:text-blue-600">Home</NavLink>
            <NavLink to="/recommendations" className="text-gray-600 hover:text-blue-600">Recommendations</NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/history" className="text-gray-600 hover:text-blue-600">My History</NavLink>
                <span className="text-gray-700 font-medium">Welcome, {user.name}!</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
                  Login
                </NavLink>
                <NavLink to="/register" className="text-gray-600 hover:text-blue-600">
                  Register
                </NavLink>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-grow container mx-auto px-6 py-8">
        <Outlet />
      </main>
      <footer className="bg-white mt-auto py-4">
        <div className="container mx-auto px-6 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} MovieRecs. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 