'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserAccessInfo } from '@/ai/flows/user-management';
import { AppPermissions } from '@/ai/schemas';
import { getAdminAndOrg } from '@/services/utils';

type PlanContextType = {
  planId: 'free' | 'growth' | 'performance' | null;
  permissions: AppPermissions | null;
  role: 'admin' | 'member' | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  organizationId: string | null;
};

const PlanContext = createContext<PlanContextType>({
  planId: null,
  permissions: null,
  role: null,
  isLoading: true,
  error: null,
  refetch: () => {},
  organizationId: null,
});

export const PlanProvider = ({ children }: { children: React.ReactNode }) => {
  const [planId, setPlanId] = useState<'free' | 'growth' | 'performance' | null>(null);
  const [permissions, setPermissions] = useState<AppPermissions | null>(null);
  const [role, setRole] = useState<'admin' | 'member' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const fetchPlan = useCallback(async (user: FirebaseUser) => {
    setIsLoading(true);
    setError(null);
    try {
        await user.getIdToken(true); // Garante que as custom claims estão atualizadas
        
        const accessInfo = await getUserAccessInfo({ actor: user.uid });
        const adminOrgData = await getAdminAndOrg(user.uid);
        
        if (accessInfo && adminOrgData) {
            setPlanId(accessInfo.planId);
            setPermissions(accessInfo.permissions);
            setRole(accessInfo.role);
            setOrganizationId(adminOrgData.organizationId);
        } else {
           throw new Error("User data not ready");
        }
    } catch (err) {
        setError("USER_DATA_NOT_FOUND");
    } finally {
        setIsLoading(false);
    }
  }, []);

  // Effect to get current user and fetch initial data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchPlan(user);
      } else {
        setIsLoading(false);
        setPlanId(null);
        setPermissions(null);
        setRole(null);
        setError(null);
        setOrganizationId(null);
      }
    });
    return () => unsubscribe();
  }, [fetchPlan]);

  const refetch = useCallback(() => {
    if (currentUser) {
      fetchPlan(currentUser);
    }
  }, [currentUser, fetchPlan]);


  return (
    <PlanContext.Provider value={{ planId, permissions, role, isLoading, error, refetch, organizationId }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};
