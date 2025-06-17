// This file contains all our custom React "hooks" for managing app logic,
// such as authentication, data fetching, and calculations.

import { useState, useEffect, useMemo } from 'react';
import { auth, db, appId } from '../firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { getStoolInfo } from '../utils';

// --- Hook for managing user authentication state ---
export const useAuth = () => {
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        // In a local environment, if there's no user, we always sign in anonymously.
        // The check for __initial_auth_token is removed.
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Anonymous auth failed:", error);
        }
      }
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  return { userId, isAuthReady };
};

// --- Hook for fetching the pet profile ---
export const usePetProfile = (userId, isAuthReady) => {
    const [pet, setPet] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthReady || !userId) {
            setIsLoading(false);
            return;
        }
        const q = query(collection(db, `/artifacts/${appId}/users/${userId}/pets`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const petData = snapshot.docs[0].data();
                setPet({ ...petData, petId: snapshot.docs[0].id, userId });
            } else {
                setPet(null);
            }
            setIsLoading(false);
        }, (err) => {
            console.error(err);
            setIsLoading(false);
        });
        return unsubscribe;
    }, [isAuthReady, userId]);

    return { pet, isLoading };
};

// --- Hook for fetching and managing all logs ---
export const useLogs = (pet) => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        if (!pet) {
            setLogs([]);
            return;
        }
        const q = query(collection(db, `/artifacts/${appId}/users/${pet.userId}/logs`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            logsData.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
            setLogs(logsData);
        }, (err) => console.error(err));
        return unsubscribe;
    }, [pet]);

    return logs;
};

// --- Hook for calculating food statistics ---
export const useFoodStats = (logs) => {
    return useMemo(() => {
        const stats = {};
        const allFoodLogs = logs.filter(l => l.type === 'food' && !l.food.isScavenged);
        const badStoolLogs = logs.filter(l => l.type === 'stool' && getStoolInfo(l.stool.type).isProblem);

        allFoodLogs.forEach(foodLog => {
            const foodName = foodLog.food.name.toLowerCase();
            if (!stats[foodName]) {
                stats[foodName] = { totalCount: 0, weightedBadOutcomeCount: 0 };
            }
            stats[foodName].totalCount++;

            const outcomes = badStoolLogs.filter(stoolLog =>
                stoolLog.timestamp.toMillis() > foodLog.timestamp.toMillis() &&
                stoolLog.timestamp.toMillis() < foodLog.timestamp.toMillis() + 86400000 // 24-hour window
            );

            if (outcomes.length > 0) {
                stats[foodName].weightedBadOutcomeCount += outcomes.reduce((acc, stool) => acc + getStoolInfo(stool.stool.type).severity, 0);
            }
        });
        return stats;
    }, [logs]);
};
