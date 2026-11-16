import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const BusinessContext = createContext();

export function BusinessProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const fetchBusinesses = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.get('/business');
      setBusinesses(res.data);
      
      const savedId = localStorage.getItem('active_business_id');
      const matched = res.data.find(b => String(b.id) === String(savedId));
      
      if (matched) {
        setActiveBusiness(matched);
      } else if (res.data.length > 0) {
        setActiveBusiness(res.data[0]);
        localStorage.setItem('active_business_id', res.data[0].id);
      } else {
        setActiveBusiness(null);
        localStorage.removeItem('active_business_id');
      }
    } catch (err) {
      console.error("Failed to fetch businesses", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const selectBusiness = (biz) => {
    setActiveBusiness(biz);
    localStorage.setItem('active_business_id', biz.id);
  };

  const loadDemoData = async () => {
    setDemoLoading(true);
    try {
      const res = await api.post('/demo/load');
      await fetchBusinesses();
      return res.data;
    } finally {
      setDemoLoading(false);
    }
  };

  const resetDemoData = async () => {
    setDemoLoading(true);
    try {
      const res = await api.post('/demo/reset');
      await fetchBusinesses();
      return res.data;
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <BusinessContext.Provider value={{
      businesses,
      activeBusiness,
      loading,
      demoLoading,
      selectBusiness,
      refreshBusinesses: fetchBusinesses,
      loadDemoData,
      resetDemoData
    }}>
      {children}
    </BusinessContext.Provider>
  );
}

export const useBusiness = () => useContext(BusinessContext);
