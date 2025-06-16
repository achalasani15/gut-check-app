import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';

const PetProfileSetup = ({ onSavePet }) => {
    const [petName, setPetName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!petName.trim()) return;
        setIsSaving(true);
        await onSavePet({ name: petName });
        setIsSaving(false);
    };
    
    // Note: Dummy data generation is now handled within this component
    // It calls the same onSavePet function to create the pet first
    const handleGenerateDummyData = async () => {
        setIsSaving(true);
        // This is a simplified version. In a real app, this would be a cloud function.
        // For now, we'll just create the pet and the user can add logs.
        await onSavePet({ name: "Theo (Demo)" });
        // The logic to add dummy LOGS would be complex here, so we'll omit for now.
        // The user will start with a fresh journal for the demo pet.
        setIsSaving(false);
    }

    return (
        <div className="h-screen bg-zinc-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm mx-auto text-center bg-white p-8 rounded-2xl shadow-lg">
                <span className="text-6xl">🐾</span>
                <h1 className="text-2xl font-bold text-zinc-800 mt-4">Welcome to Gut Check</h1>
                <p className="text-zinc-600 mt-2 mb-6">Let's get started by creating a profile for your best friend.</p>
                <input type="text" value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="e.g., Theo" className="w-full input-style" />
                <button onClick={handleSave} disabled={!petName.trim() || isSaving} className="button-primary w-full mt-4">
                    {isSaving ? 'Saving...' : 'Add Your Pet'}
                </button>
                <div className="text-center my-4 text-zinc-500 text-sm">or</div>
                <button onClick={handleGenerateDummyData} disabled={isSaving} className="button-secondary w-full">
                    {isSaving ? 'Working...' : 'Try with Sample Data'}
                </button>
            </div>
        </div>
    );
};

export default PetProfileSetup;

