// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { useState, useEffect, useContext, PropsWithChildren, createContext } from 'react';

interface AuthContext {
    isAuthenticated: boolean
    setIsAuthenticated: (loading: boolean) => void
    loading: boolean
    setLoading: (loading: boolean) => void
}

const AuthContext = createContext<AuthContext>({
    isAuthenticated: false,
    setIsAuthenticated: () => {},
    loading: false,
    setLoading: () => {},
});
  
export function AuthContextProvider({ children }: PropsWithChildren) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
  
    useEffect(() => {
      const token = localStorage.getItem('token'); // TODO: remove/change sessionStorage usage, if you change manually the session storage you can navigate within the other web pages
      if (token != null &&  JSON.parse(token)) { // this was just for testing
        setIsAuthenticated(true);
      }
    }, []);
  
    const value = { isAuthenticated, setIsAuthenticated, loading, setLoading };
    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context
}