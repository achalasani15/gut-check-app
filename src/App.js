import React, { useState, useEffect, useMemo } from 'react';
import { useFirebaseAuth, usePetData } from './hooks'; // We will create these hooks next
import Loader from './components/Loader';
import PetProfileSetup from './components/PetProfileSetup';
import Timeline from './components/Timeline';
import HealthDashboard from './components/HealthDashboard';
import SettingsPage from './components/SettingsPage';
import LogForm from './components/LogForm';
import ConfirmationModal from './components/ConfirmationModal';

export default function App() {
    const { userId, isAuthReady } = useFirebaseAuth();
    const { pet, logs, isLoading, foodStats, handleSavePet, handleRestartJournal, handleDeletePetAndData, handleAddLog, handleUpdateLog, handleDeleteLog } = usePetData(userId);

    const [currentView, setCurrentView] = useState('timeline');
    const [logToEdit, setLogToEdit] = useState(null);
    const [isLogFormOpen, setIsLogFormOpen] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState('');
    
    // Logic for search and filter
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [filteredLogs, setFilteredLogs] = useState([]);
    
    useEffect(() => {
        let logsByType = logs;
        if (activeFilter !== 'all') { logsByType = logs.filter(log => log.type === activeFilter); }
        const term = searchTerm.toLowerCase();
        if (!term) { setFilteredLogs(logsByType); return; }
        const results = logsByType.filter(log => (log.type.toLowerCase().includes(term) || log.food?.name?.toLowerCase().includes(term) || log.symptoms?.[0]?.toLowerCase().includes(term) || log.generalNotes?.toLowerCase().includes(term)));
        setFilteredLogs(results);
    }, [searchTerm, logs, activeFilter]);


    const handleEditRequest = (log) => {
        setLogToEdit(log);
        setIsLogFormOpen(true);
    };

    const handleOpenLogForm = () => {
        setLogToEdit(null);
        setIsLogFormOpen(true);
    }
    
    const handleCloseLogForm = () => {
        setIsLogFormOpen(false);
        setLogToEdit(null);
    }

    const triggerSuccess = (message) => {
        setShowSuccessMessage(message);
        setTimeout(() => setShowSuccessMessage(''), 3000);
    }
    
    if (!isAuthReady || isLoading) {
        return <Loader message="Connecting to your journal..." />;
    }

    if (!pet) {
        return <PetProfileSetup onSavePet={handleSavePet} />;
    }

    const renderContent = () => {
        switch (currentView) {
            case 'report':
                return <HealthDashboard allLogs={logs} foodStats={foodStats} onBack={() => setCurrentView('timeline')} />;
            case 'settings':
                return <SettingsPage pet={pet} onBack={() => setCurrentView('timeline')} onRestartJournal={handleRestartJournal} onDeletePet={handleDeletePetAndData} />;
            default:
                return (
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
                                 {/* Filter Buttons Here */}
                             </div>
                        </div>
                        <Timeline logs={filteredLogs} allLogs={logs} onEdit={handleEditRequest} onDelete={handleDeleteLog} foodStats={foodStats} onOpenLogForm={handleOpenLogForm} />
                    </div>
                );
        }
    };
    
    return (
        <div className="min-h-screen">
            <main className="max-w-2xl mx-auto p-4">
                {renderContent()}
            </main>
            {isLogFormOpen && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={handleCloseLogForm}>
                     <LogForm 
                        pet={pet} 
                        allLogs={logs} 
                        logToEdit={logToEdit} 
                        onDoneEditing={handleCloseLogForm} 
                        onCancel={handleCloseLogForm} 
                        onLogAdded={(type) => { triggerSuccess(`${type} logged!`); handleCloseLogForm(); }}
                        onLogUpdated={(msg) => { triggerSuccess(msg); handleCloseLogForm(); }}
                     />
                </div>
            )}
             {currentView === 'timeline' && (
                <button onClick={handleOpenLogForm} title="Add new log" className="fixed bottom-6 right-6 bg-emerald-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-4xl shadow-lg hover:bg-emerald-700 transition-all transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-emerald-300">
                    +
                </button>
            )}
            {showSuccessMessage && (<div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-fade-in-up">{showSuccessMessage}</div>)}
        </div>
    );
}


