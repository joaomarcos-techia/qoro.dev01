
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getUserAccessInfo } from '@/ai/flows/user-management';
import { AppPermissions } from '@/ai/schemas';

type PlanContextType = {
  planId: 'free' | 'growth' | 'performance' | null;
  permissions: AppPermissions | null;
  role: 'admin' | 'member' | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

const PlanContext = createContext<PlanContextType>({
  planId: null,
  permissions: null,
  role: null,
  isLoading: true,
  error: null,
  refetch: () => {},
});

export const PlanProvider = ({ children }: { children: React.ReactNode }) => {
  const [planId, setPlanId] = useState<'free' | 'growth' | 'performance' | null>(null);
  const [permissions, setPermissions] = useState<AppPermissions | null>(null);
  const [role, setRole] = useState<'admin' | 'member' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  const fetchPlan = useCallback(async (user: FirebaseUser) => {
    setIsLoading(true);
    try {
        // Force refresh the ID token to get the latest custom claims
        await user.getIdToken(true);
        
        const accessInfo = await getUserAccessInfo({ actor: user.uid });
        if (accessInfo) {
            setPlanId(accessInfo.planId);
            setPermissions(accessInfo.permissions);
            setRole(accessInfo.role);
            setError(null);
        } else {
           // This indicates the user document is not yet created/synced.
           // The onSnapshot listener will eventually catch it.
           throw new Error("User data not ready");
        }
    } catch (err) {
        console.error("Failed to fetch plan info:", err);
        setError("USER_DATA_NOT_FOUND");
    } finally {
        setIsLoading(false);
    }
  }, []);

  // Effect to get current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
       if (!user) {
        setIsLoading(false);
        setPlanId(null);
        setPermissions(null);
        setRole(null);
        setError(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Effect to listen for backend changes and refetch data
  useEffect(() => {
    if (!currentUser) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    const userDocRef = doc(db, 'users', currentUser.uid);
    
    // onSnapshot listens for any changes to the user's document
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        console.log("Real-time update detected for user document.");
        if (docSnap.exists()) {
            // When a change is detected (e.g., by the webhook), re-fetch the plan info.
            // This ensures claims are refreshed and UI is updated.
            fetchPlan(currentUser);
        } else {
             // This might happen during initial signup before the doc is created
             console.log("User document does not exist yet, waiting for creation...");
        }
    }, (err) => {
        console.error("Error listening to user document:", err);
        setError("Não foi possível sincronizar os dados da sua conta.");
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, fetchPlan]);

  const refetch = useCallback(() => {
    if (currentUser) {
      fetchPlan(currentUser);
    }
  }, [currentUser, fetchPlan]);


  return (
    <PlanContext.Provider value={{ planId, permissions, role, isLoading, error, refetch }}>
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
