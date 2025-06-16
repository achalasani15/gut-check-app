import { useState, useEffect, useMemo } from 'react';
import { auth, db, appId, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from '../firebase';
import { 
    doc, 
    collection, 
    onSnapshot, 
    addDoc,
    query,
    Timestamp,
    deleteDoc,
    updateDoc,
    writeBatch,
    getDocs
} from 'firebase/firestore';

// --- Authentication Hook ---
export const useFirebaseAuth = () => {
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                    if (token) {
                        await signInWithCustomToken(auth, token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Authentication failed:", error);
                }
            }
            setIsAuthReady(true);
        });
        return unsubscribe;
    }, []);

    return { userId, isAuthReady };
};


// --- Pet & Log Data Management Hook ---
export const usePetData = (userId) => {
    const [pet, setPet] = useState(null);
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        const q = query(collection(db, `/artifacts/${appId}/users/${userId}/pets`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                setPet({ ...snapshot.docs[0].data(), petId: snapshot.docs[0].id, userId });
            } else {
                setPet(null);
            }
            setIsLoading(false);
        }, (err) => {
            console.error(err);
            setIsLoading(false);
        });
        return unsubscribe;
    }, [userId]);
    
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

    const handleSavePet = async (petData) => {
        if (!userId) return;
        const petCollectionPath = `/artifacts/${appId}/users/${userId}/pets`;
        await addDoc(collection(db, petCollectionPath), { ...petData, userId, createdAt: Timestamp.now() });
    };

    const handleAddLog = async (logData) => {
        if (!pet) return;
        await addDoc(collection(db, `/artifacts/${appId}/users/${pet.userId}/logs`), logData);
    };

    const handleUpdateLog = async (logId, logData) => {
        if (!pet) return;
        await updateDoc(doc(db, `/artifacts/${appId}/users/${pet.userId}/logs/${logId}`), logData);
    };

    const handleDeleteLog = async (logId, callback) => {
        if (!pet || !logId) return;
        await deleteDoc(doc(db, `/artifacts/${appId}/users/${pet.userId}/logs/${logId}`));
        callback('Log deleted!');
    };
    
    const handleRestartJournal = async (callback) => {
        if (!pet) return;
        const logSnapshot = await getDocs(query(collection(db, `/artifacts/${appId}/users/${pet.userId}/logs`)));
        const batch = writeBatch(db);
        logSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        callback('Journal restarted!');
    };
    
    const handleDeletePetAndData = async (callback) => {
        if (!pet) return;
        await handleRestartJournal(() => {}); // Clear logs first
        const petDocRef = doc(db, `/artifacts/${appId}/users/${pet.userId}/pets/${pet.petId}`);
        await deleteDoc(petDocRef);
        callback('Pet profile deleted.');
        setPet(null);
    };
    
    // ... any other data logic can go here ...
    
    return { 
        pet, 
        logs, 
        isLoading, 
        handleSavePet, 
        handleRestartJournal,
        handleDeletePetAndData,
        handleAddLog,
        handleUpdateLog,
        handleDeleteLog
        // foodStats would be calculated in App.js with useMemo
    };
};
