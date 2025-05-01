'use client'

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
// No apiClient import needed

const AuthContext = createContext();
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ccbe.onrender.com'; // Use environment variable or fallback

// Helper function for consistent 401 handling
const handleUnauthorized = (router) => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  toast.error("Session expired or invalid. Please log in again.");
  if (typeof window !== 'undefined') { // Ensure router push happens client-side
    router.push('/login');
  }
  // Return null or specific state to signal logout in context
  return { user: null, token: null, visibleMenuItems: [] }; 
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [visibleMenuItems, setVisibleMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const router = useRouter();

  // Load user from localStorage on initial load
  useEffect(() => {
    let isMounted = true;
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    
    if (isMounted) {
        setLoading(false);
    }

    return () => { isMounted = false; };
  }, []);

  // Fetch visible menu items when token changes
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (token) {
        setMenuLoading(true);
        try {
          const response = await fetch(`${BASE_URL}/api/auth/me/visible-menu-items/`, {
            method: 'GET',
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.status === 401) {
             const { user: u, token: t, visibleMenuItems: v } = handleUnauthorized(router);
             setUser(u);
             setToken(t);
             setVisibleMenuItems(v);
             return; // Stop execution after handling 401
          }

          if (!response.ok) {
             const errorData = await response.json().catch(() => ({})); // Graceful error parsing
             throw new Error(errorData.message || `HTTP error ${response.status}`);
          }

          const data = await response.json();
          setVisibleMenuItems(data || []); 
        } catch (error) { // Catches fetch errors and non-ok response errors
          if (error.message.includes('401')) { // Avoid double handling if already caught
             console.log("401 already handled.")
          } else {
            console.error('Error fetching menu items:', error);
            toast.error(`Could not load navigation items: ${error.message}`);
            setVisibleMenuItems([]); // Clear menu items on error
          }
        } finally {
          setMenuLoading(false);
        }
      } else {
        setVisibleMenuItems([]);
      }
    };

    fetchMenuItems();
  }, [token, router]); // Add router as dependency for handleUnauthorized

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json(); // Try parsing JSON regardless of status for error messages

      if (!response.ok) {
        throw new Error(data.message || data.detail || 'Login failed');
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
      
      toast.success('Login successful');
      return true; 
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    const currentToken = token; // Capture token before clearing state
    // Clear local state immediately for faster UI update
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null); // This triggers useEffect to clear menu items
    setVisibleMenuItems([]);

    if (currentToken) {
      try {
        await fetch(`${BASE_URL}/api/auth/logout/`, {
            method: 'POST',
            headers: {
              'Authorization': `Token ${currentToken}`,
              'Content-Type': 'application/json'
            }
        });
        // No need to check response status extensively, local cleanup is primary
      } catch (error) {
         console.error('Logout API call failed:', error);
         // Optional: Inform user differently? toast.info('Local logout complete, server notification failed.');
      }
    }
    
    toast.success('Logged out successfully');
    router.push('/login'); // Redirect after clearing state and attempting API call
  };

  // Check if user is authenticated
  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated, 
      loading, // Initial auth check loading
      visibleMenuItems, 
      menuLoading // Menu specific loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext; 