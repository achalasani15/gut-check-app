import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, usePetProfile, useLogs, useFoodStats } from './hooks';
import { db, appId } from './firebase';
import { addDoc, collection, doc, updateDoc, deleteDoc, writeBatch, getDocs, query } from 'firebase/firestore';

// Import all components
import Loader from './components/Loader';
import PetProfileSetup from './components/PetProfileSetup';
import Timeline from './components/Timeline';
import SettingsPage from './components/SettingsPage';
import HealthDashboard from './components/HealthDashboard';
import LogForm from './components/LogForm';
import ConfirmationModal from './components/ConfirmationModal';

// This is the main component that orchestrates the entire application.
// It's designed to be more robust and avoid the loading bugs.
export default function App() {
    // 1. First, handle authentication
    const { userId, isAuthReady } = useAuth();
    
    // If we're still waiting for authentication to figure itself out, show the first loader.
    if (!isAuthReady) {
        return <Loader message="Authenticating..." />;
    }

    // If authentication is ready but we somehow don't have a user ID, show an error.
    if (!userId) {
        return <Loader message="Could not authenticate. Please refresh." />;
    }

    // 2. Once authenticated, we can manage the rest of the app's state.
    // We pass the confirmed userId to a new component to handle everything else.
    return <JournalManager userId={userId} />;
}


// This new component ONLY runs after we are sure we have a userId.
// This prevents the race condition bug that was causing the app to get stuck.
function JournalManager({ userId }) {
    // --- State Management ---
    const { pet, isLoading: isPetLoading } = usePetProfile(userId);
    const allLogs = useLogs(pet);
    const foodStats = useFoodStats(allLogs);
    
    // UI State
    const [currentView, setCurrentView] = useState('timeline');
    const [logToEdit, setLogToEdit] = useState(null);
    const [isLogFormOpen, setIsLogFormOpen] = useState(false);
    
    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [filteredLogs, setFilteredLogs] = useState([]);

    // Modals & Messages State
    const [showSuccessMessage, setShowSuccessMessage] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRestartModal, setShowRestartModal] = useState(false);
    const [showDeletePetModal, setShowDeletePetModal] = useState(false);
    const [logToDelete, setLogToDelete] = useState(null);
    
    // Navigation & Interaction State
    const [highlightedLogId, setHighlightedLogId] = useState(null);
    const [scrollToLogId, setScrollToLogId] = useState(null);
    const [lastLogType, setLastLogType] = useState('stool');
    
    // --- Logic and Effects ---

    // Effect for filtering logs whenever the search term, filter, or logs change
    useEffect(() => {
        let logsByType = allLogs;
        if (activeFilter !== 'all') {
            logsByType = allLogs.filter(log => log.type === activeFilter);
        }
        
        const term = searchTerm.toLowerCase();
        if (!term) {
            setFilteredLogs(logsByType);
            return;
        }

        const results = logsByType.filter(log => 
            (log.type.toLowerCase().includes(term)) ||
            (log.food?.name?.toLowerCase().includes(term)) ||
            (log.symptoms?.[0]?.toLowerCase().includes(term)) ||
            (log.generalNotes?.toLowerCase().includes(term)) ||
            (log.stool?.type && `type ${log.stool.type}`.includes(term))
        );
        setFilteredLogs(results);
    }, [searchTerm, allLogs, activeFilter]);

    // Effect to handle scrolling to a specific log (e.g., from the report)
    useEffect(() => {
        if (scrollToLogId && currentView === 'timeline') {
            setTimeout(() => {
                const element = document.getElementById(`log-${scrollToLogId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setHighlightedLogId(scrollToLogId);
                    setTimeout(() => setHighlightedLogId(null), 2000);
                }
                setScrollToLogId(null);
            }, 150);
        }
    }, [scrollToLogId, currentView]);

    // --- Action Handlers ---

    const triggerSuccessMessage = (message) => {
        setShowSuccessMessage(message);
        setTimeout(() => setShowSuccessMessage(''), 3000);
    };

    const handleDeleteRequest = (logId) => {
        setLogToDelete(logId);
        setShowDeleteModal(true);
    };

    const handleEditRequest = (log) => {
        setLogToEdit(log);
        setIsLogFormOpen(true);
    };

    const openLogForm = () => {
        setLogToEdit(null);
        setIsLogFormOpen(true);
    };

    const closeLogForm = () => {
        setIsLogFormOpen(false);
        setLogToEdit(null);
    };

    const handleViewLog = (logId) => {
        setCurrentView('timeline');
        setScrollToLogId(logId);
    };

    // --- Database Actions ---

    const confirmDelete = async () => {
        if (!pet || !logToDelete) return;
        try {
            await deleteDoc(doc(db, `/artifacts/${appId}/users/${pet.userId}/logs/${logToDelete}`));
            triggerSuccessMessage('Log deleted!');
        } catch (error) {
            console.error("Error deleting log:", error);
        } finally {
            setShowDeleteModal(false);
            setLogToDelete(null);
        }
    };

    const handleRestartJournal = async () => {
        if (!pet) return;
        const logCollectionRef = collection(db, `/artifacts/${appId}/users/${pet.userId}/logs`);
        const logSnapshot = await getDocs(query(logCollectionRef));
        const batch = writeBatch(db);
        logSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        try {
            await batch.commit();
            triggerSuccessMessage('Journal restarted!');
        } catch (error) {
            console.error("Error restarting journal:", error);
        } finally {
            setShowRestartModal(false);
        }
    };
    
    const handleDeletePetAndData = async () => {
        if (!pet) return;
        // First delete all logs
        const logCollectionRef = collection(db, `/artifacts/${appId}/users/${pet.userId}/logs`);
        const logSnapshot = await getDocs(query(logCollectionRef));
        const logBatch = writeBatch(db);
        logSnapshot.docs.forEach(logDoc => logBatch.delete(logDoc.ref));
        await logBatch.commit();

        // Then delete the pet
        const petDocRef = doc(db, `/artifacts/${appId}/users/${pet.userId}/pets/${pet.petId}`);
        await deleteDoc(petDocRef);

        triggerSuccessMessage('Pet profile deleted.');
        setCurrentView('timeline');
        setShowDeletePetModal(false);
    };
    
    // --- Render Logic ---

    // If we have a userId but are still waiting for the pet profile to load
    if (isPetLoading) {
        return <Loader message="Fetching your journal..." />;
    }

    // If loading is done and there's still no pet, show the setup screen
    if (!pet) {
        return <PetProfileSetup userId={userId} />;
    }
    
    const getFilterButtonClass = (filterType) => `px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeFilter === filterType ? 'bg-emerald-600 text-white shadow' : 'bg-white text-zinc-700 hover:bg-zinc-100'}`;

    // Main render for the app once everything is loaded
    return (
        <div className="bg-zinc-50 min-h-screen font-sans text-zinc-800">
            <main className="max-w-2xl mx-auto p-4">
                 {currentView === 'timeline' && (
                    <div className="animate-fade-in">
                        <header className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <span className="text-5xl">🐾</span>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold">{pet.name}'s Journal</h1>
                                    <p className="text-zinc-500">Welcome back!</p>
                                </div>
                            </div>
                             <div className="flex items-center space-x-2">
                                <button onClick={() => setCurrentView('report')} className="p-2 rounded-full hover:bg-zinc-200 transition-colors text-2xl" title="Health Dashboard">📊</button>
                                <button onClick={() => setCurrentView('settings')} className="p-2 rounded-full hover:bg-zinc-200 transition-colors text-2xl" title="Settings">⚙️</button>
                             </div>
                        </header>
                        <div className="mb-6 space-y-4">
                            <input type="text" placeholder="Search logs (e.g., stool, chicken...)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full input-style" />
                            <div className="flex space-x-2">
                                 <button onClick={() => setActiveFilter('all')} className={getFilterButtonClass('all')}>All</button>
                                 <button onClick={() => setActiveFilter('food')} className={getFilterButtonClass('food')}>Food</button>
                                 <button onClick={() => setActiveFilter('stool')} className={getFilterButtonClass('stool')}>Stool</button>
                                 <button onClick={() => setActiveFilter('symptom')} className={getFilterButtonClass('symptom')}>Symptoms</button>
                                 <button onClick={() => setActiveFilter('note')} className={getFilterButtonClass('note')}>Notes</button>
                            </div>
                        </div>
                        <Timeline logs={filteredLogs} allLogs={allLogs} onEdit={handleEditRequest} onDelete={handleDeleteRequest} highlightedLogId={highlightedLogId} setHighlightedLogId={setHighlightedLogId} onOpenLogForm={openLogForm} foodStats={foodStats} />
                    </div>
                )}
                {currentView === 'settings' && (<SettingsPage pet={pet} onBack={() => setCurrentView('timeline')} onRestart={() => setShowRestartModal(true)} onDeletePet={() => setShowDeletePetModal(true)} />)}
                {currentView === 'report' && (<HealthDashboard allLogs={allLogs} foodStats={foodStats} onBack={() => setCurrentView('timeline')} onViewLog={handleViewLog} />)}
            </main>
            
            {currentView === 'timeline' && (
                <button onClick={openLogForm} title="Add new log" className="fixed bottom-6 right-6 bg-emerald-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-4xl shadow-lg hover:bg-emerald-700 transition-all transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-emerald-300">
                    +
                </button>
            )}

            {isLogFormOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={closeLogForm}>
                     <LogForm pet={pet} allLogs={allLogs} logToEdit={logToEdit} onDoneEditing={closeLogForm} onCancel={closeLogForm} onLogAdded={(type) => { triggerSuccessMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} logged!`); closeLogForm(); setLastLogType(type); }} onLogUpdated={(msg) => { triggerSuccessMessage(msg); closeLogForm(); }} defaultLogType={lastLogType === 'food' ? 'stool' : 'food'} />
                </div>
            )}
            
            {showSuccessMessage && (<div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-fade-in-up">{showSuccessMessage}</div>)}
            <ConfirmationModal isOpen={showDeleteModal} message="Are you sure you want to permanently delete this log?" onConfirm={confirmDelete} onCancel={() => setShowDeleteModal(false)} />
            <ConfirmationModal isOpen={showRestartModal} message={`Are you sure you want to delete ALL logs for ${pet.name}? This cannot be undone.`} onConfirm={handleRestartJournal} onCancel={() => setShowRestartModal(false)} confirmText="Yes, Restart" />
            <ConfirmationModal isOpen={showDeletePetModal} message={`This will permanently delete ${pet.name}'s profile and all data. Are you sure?`} onConfirm={handleDeletePetAndData} onCancel={() => setShowDeletePetModal(false)} confirmText="Yes, Delete Everything" />
        </div>
    );
}

