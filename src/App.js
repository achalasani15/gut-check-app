import React, { useState, useEffect } from 'react';
import { useAuth, usePetProfile, useLogs, useFoodStats } from './hooks';
import Loader from './components/Loader';
import PetProfileSetup from './components/PetProfileSetup';
import Timeline from './components/Timeline';
import SettingsPage from './components/SettingsPage';
import HealthDashboard from './components/HealthDashboard';
import LogForm from './components/LogForm';
import ConfirmationModal from './components/ConfirmationModal';
import { auth, db, appId } from './firebase'; // direct imports
import { addDoc, collection, doc, updateDoc, deleteDoc, writeBatch, getDocs, query } from 'firebase/firestore';

// This is a new helper component to keep the main logic clean.
// It only renders AFTER authentication is ready.
const JournalManager = ({ userId }) => {
    const { pet, isLoading: isPetLoading } = usePetProfile(userId);
    const allLogs = useLogs(pet);
    const foodStats = useFoodStats(allLogs);
    
    // All the state management from the old App.js is moved here.
    const [logToEdit, setLogToEdit] = useState(null);
    const [showSuccessMessage, setShowSuccessMessage] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRestartModal, setShowRestartModal] = useState(false);
    const [showDeletePetModal, setShowDeletePetModal] = useState(false);
    const [logToDelete, setLogToDelete] = useState(null);
    const [currentView, setCurrentView] = useState('timeline');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [isLogFormOpen, setIsLogFormOpen] = useState(false);
    const [highlightedLogId, setHighlightedLogId] = useState(null);
    const [lastLogType, setLastLogType] = useState('stool');
    const [scrollToLogId, setScrollToLogId] = useState(null);

    // --- Data Filtering Logic ---
     useEffect(() => {
        let logsByType = allLogs;
        if (activeFilter !== 'all') { logsByType = allLogs.filter(log => log.type === activeFilter); }
        const term = searchTerm.toLowerCase();
        if (!term) { setFilteredLogs(logsByType); return; }
        const results = logsByType.filter(log => (log.type.toLowerCase().includes(term) || log.food?.name?.toLowerCase().includes(term) || log.symptoms?.[0]?.toLowerCase().includes(term) || log.generalNotes?.toLowerCase().includes(term) || (log.stool?.type && `type ${log.stool.type}`.includes(term))));
        setFilteredLogs(results);
    }, [searchTerm, allLogs, activeFilter]);

    // --- Navigation and Highlight Logic ---
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
    }, [scrollToLogId, currentView, allLogs]);


    // --- Handlers ---
    const triggerSuccessMessage = (message) => { setShowSuccessMessage(message); setTimeout(() => setShowSuccessMessage(''), 3000); }
    const handleDeleteRequest = (logId) => { setLogToDelete(logId); setShowDeleteModal(true); };
    const handleEditRequest = (log) => { setLogToEdit(log); setIsLogFormOpen(true); };
    const confirmDelete = async () => {
        if (!pet || !logToDelete) return;
        try { await deleteDoc(doc(db, `/artifacts/${appId}/users/${pet.userId}/logs/${logToDelete}`)); triggerSuccessMessage('Log deleted!'); } catch (error) { console.error("Error deleting log:", error); }
        finally { setShowDeleteModal(false); setLogToDelete(null); }
    };
    const handleRestartJournal = async () => {
        if (!pet) return;
        const logSnapshot = await getDocs(query(collection(db, `/artifacts/${appId}/users/${pet.userId}/logs`)));
        const batch = writeBatch(db); logSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        try { await batch.commit(); triggerSuccessMessage('Journal restarted!'); setShowRestartModal(false); } 
        catch (error) { console.error("Error restarting journal:", error); }
    };
    const handleDeletePetAndData = async () => {
        if (!pet) return;
        const logSnapshot = await getDocs(query(collection(db, `/artifacts/${appId}/users/${pet.userId}/logs`)));
        const batch = writeBatch(db); logSnapshot.docs.forEach(logDoc => batch.delete(logDoc.ref));
        const petDocRef = doc(db, `/artifacts/${appId}/users/${pet.userId}/pets/${pet.petId}`);
        batch.delete(petDocRef);
        try { await batch.commit(); triggerSuccessMessage('Pet profile deleted.'); setCurrentView('timeline'); setShowDeletePetModal(false); }
        catch (error) { console.error("Error deleting pet and data:", error); }
    };
    const openLogForm = () => { setLogToEdit(null); setIsLogFormOpen(true); }
    const closeLogForm = () => { setIsLogFormOpen(false); setLogToEdit(null); };
    const handleViewLog = (logId) => { setCurrentView('timeline'); setScrollToLogId(logId); };
    const getFilterButtonClass = (filterType) => `px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeFilter === filterType ? 'bg-emerald-600 text-white shadow' : 'bg-white text-zinc-700 hover:bg-zinc-100'}`;
    
    // --- Render Logic ---
    if (isPetLoading) return <Loader message="Fetching your journal..." />;
    if (!pet) return <PetProfileSetup userId={userId} />;

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
                {currentView === 'report' && (<HealthDashboard allLogs={allLogs} foodStats={foodStats} onBack={() => setCurrentView('timeline')} onViewLog={handleViewLog}/>)}
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


export default function App() {
    const { userId, isAuthReady } = useAuth();

    // The initial loading logic is now much simpler.
    // It only waits for the authentication process to complete.
    if (!isAuthReady) {
        return <Loader message="Authenticating..." />;
    }

    // After auth is ready, we hand off to the main manager component.
    // This component will then handle loading the specific pet profile.
    return <JournalManager userId={userId} />;
}
