import React, { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';

const SettingsPage = ({ pet, onBack, onRestartJournal, onDeletePet }) => {
    const [showRestartModal, setShowRestartModal] = useState(false);
    const [showDeletePetModal, setShowDeletePetModal] = useState(false);

    const handleRestart = () => {
        onRestartJournal();
        setShowRestartModal(false);
    };

    const handleDelete = () => {
        onDeletePet();
        setShowDeletePetModal(false);
    };

    return (
        <div className="p-4 animate-fade-in">
            <header className="flex items-center mb-6">
                 <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-zinc-200">
                     <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                 </button>
                <h1 className="text-2xl font-bold text-zinc-800">Settings</h1>
            </header>
            <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
                 <div>
                    <h2 className="font-bold text-lg text-zinc-800">Restart Journal</h2>
                    <p className="text-sm text-zinc-500 mt-1 mb-3">Permanently delete all logs and start over with a fresh journal for {pet.name}. The pet profile will be kept.</p>
                    <button onClick={() => setShowRestartModal(true)} className="button-danger w-full sm:w-auto">Restart Journal</button>
                 </div>
                 <div className="border-t border-zinc-200 pt-6">
                    <h2 className="font-bold text-lg text-zinc-800">Delete Pet & Start Over</h2>
                    <p className="text-sm text-zinc-500 mt-1 mb-3">Permanently delete {pet.name}'s profile and all associated logs. This action cannot be undone.</p>
                    <button onClick={() => setShowDeletePetModal(true)} className="button-danger w-full sm:w-auto">Delete Pet & Data</button>
                 </div>
            </div>
            <ConfirmationModal 
                isOpen={showRestartModal} 
                message={`Are you sure you want to delete ALL logs for ${pet.name}? This cannot be undone.`} 
                onConfirm={handleRestart} 
                onCancel={() => setShowRestartModal(false)}
                confirmText="Yes, Restart" 
            />
            <ConfirmationModal 
                isOpen={showDeletePetModal}
                message={`This will permanently delete ${pet.name}'s profile and all data. Are you sure?`} 
                onConfirm={handleDelete} 
                onCancel={() => setShowDeletePetModal(false)}
                confirmText="Yes, Delete Everything"
            />
        </div>
    );
};

export default SettingsPage;

