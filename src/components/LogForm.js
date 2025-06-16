import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Timestamp } from 'firebase/firestore';
import StoolTypePicker from './StoolTypePicker';

const LogForm = ({ pet, allLogs, onLogAdded, onLogUpdated, logToEdit, onDoneEditing, onCancel, defaultLogType = 'food' }) => {
    const [logType, setLogType] = useState(defaultLogType);
    const [isEditing, setIsEditing] = useState(!!logToEdit);
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [logTime, setLogTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    
    const [foodName, setFoodName] = useState('');
    const [foodQuantity, setFoodQuantity] = useState('');
    const [isScavenged, setIsScavenged] = useState(false);
    const [isSafeFood, setIsSafeFood] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    
    const [stoolType, setStoolType] = useState(3);
    const [symptomText, setSymptomText] = useState('');
    const [noteText, setNoteText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const foodInputRef = useRef(null);

    const uniqueFoodNames = useMemo(() => {
        const names = new Set(allLogs.filter(log => log.type === 'food').map(log => log.food.name));
        return Array.from(names);
    }, [allLogs]);

    const handleFoodNameChange = (e) => {
        const value = e.target.value;
        setFoodName(value);
        if (value) {
            setSuggestions(uniqueFoodNames.filter(name => name.toLowerCase().includes(value.toLowerCase())));
        } else {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (name) => {
        setFoodName(name);
        setSuggestions([]);
        const lastLogOfThisFood = allLogs.find(log => log.type === 'food' && log.food.name === name);
        if (lastLogOfThisFood) {
            setIsScavenged(lastLogOfThisFood.food.isScavenged || false);
            setIsSafeFood(lastLogOfThisFood.food.isSafe || false);
        }
        if (foodInputRef.current) {
            foodInputRef.current.focus();
        }
    };

    const resetForm = () => {
        setFoodName(''); setFoodQuantity(''); setIsScavenged(false); setIsSafeFood(false);
        setSuggestions([]);
        setStoolType(3); setSymptomText(''); setNoteText('');
        setLogDate(new Date().toISOString().split('T')[0]); 
        setLogTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
        setLogType(defaultLogType);
    };

    useEffect(() => {
        if (logToEdit) {
            setIsEditing(true); 
            setLogType(logToEdit.type);
            const ts = logToEdit.timestamp.toDate();
            setLogDate(ts.toISOString().split('T')[0]); 
            setLogTime(ts.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
            setFoodName(logToEdit.food?.name || ''); 
            setFoodQuantity(logToEdit.food?.quantity || ''); 
            setIsScavenged(logToEdit.food?.isScavenged || false);
            setIsSafeFood(logToEdit.food?.isSafe || false);
            setStoolType(logToEdit.stool?.type || 3); 
            setSymptomText(logToEdit.symptoms?.[0] || ''); 
            setNoteText(logToEdit.generalNotes || '');
        } else {
            setIsEditing(false); 
            resetForm();
        }
    }, [logToEdit]);
    
    const handleSaveLog = async () => {
        setIsSaving(true);
        const [year, month, day] = logDate.split('-').map(Number);
        const [hours, minutes] = logTime.split(':').map(Number);
        const combinedTimestamp = new Date(year, month - 1, day, hours, minutes);

        let logData = { type: logType, timestamp: Timestamp.fromDate(combinedTimestamp) };
        switch (logType) {
            case 'food': logData.food = { name: foodName, quantity: foodQuantity, isScavenged, isSafe: isSafeFood }; break;
            case 'stool': logData.stool = { type: stoolType }; break;
            case 'symptom': logData.symptoms = [symptomText]; break;
            case 'note': logData.generalNotes = noteText; break;
            default: setIsSaving(false); return;
        }
        
        if (isEditing && logToEdit) { 
            await onLogUpdated(logToEdit.id, logData);
        } else { 
            await onLogAdded(logData);
        }
        setIsSaving(false);
    };
    
    const getButtonClass = (type) => `flex-1 py-2 rounded-lg transition-colors text-sm font-semibold ${logType === type ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`;
    
    return (
         <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-zinc-800">{isEditing ? 'Edit Log Entry' : 'Add New Log'}</h3>
                <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 text-2xl leading-none">&times;</button>
            </div>
            {!isEditing && ( <div className="flex gap-2 mb-4"> <button onClick={() => setLogType('food')} className={getButtonClass('food')}>🦴 Food</button> <button onClick={() => setLogType('stool')} className={getButtonClass('stool')}>💩 Stool</button> <button onClick={() => setLogType('symptom')} className={getButtonClass('symptom')}>❤️‍🩹 Symptom</button> <button onClick={() => setLogType('note')} className={getButtonClass('note')}>📝 Note</button> </div> )}
            <div className="space-y-4">
                <div className="flex gap-4"> <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} className="w-1/2 input-style"/> <input type="time" value={logTime} onChange={e => setLogTime(e.target.value)} className="w-1/2 input-style"/> </div>
                {logType === 'food' && (
                    <div className="space-y-4">
                        <div className="space-y-2 relative">
                             <input type="text" ref={foodInputRef} value={foodName} onChange={handleFoodNameChange} placeholder="What did they eat?" className="w-full input-style" autoComplete="off"/>
                             {suggestions.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border border-zinc-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                                    {suggestions.map(s => <li key={s} onClick={() => handleSuggestionClick(s)} className="px-4 py-2 hover:bg-zinc-100 cursor-pointer">{s}</li>)}
                                </ul>
                             )}
                             <input type="text" value={foodQuantity} onChange={e => setFoodQuantity(e.target.value)} placeholder="How much? (e.g., 1 cup)" className="w-full input-style" />
                        </div>
                        <div className="space-y-2">
                             <label className="flex items-center space-x-3 text-zinc-600 cursor-pointer p-1">
                                <input type="checkbox" checked={isScavenged} onChange={(e) => setIsScavenged(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                <span>This was a scavenged item</span>
                            </label>
                             <label className="flex items-center space-x-3 text-zinc-600 cursor-pointer p-1">
                                <input type="checkbox" checked={isSafeFood} onChange={(e) => setIsSafeFood(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                <span>Mark this food as "safe"</span>
                            </label>
                        </div>
                    </div>
                )}
                {logType === 'symptom' && (<input type="text" value={symptomText} onChange={e => setSymptomText(e.target.value)} placeholder="e.g., Itching, Lethargy..." className="w-full input-style" />)}
                {logType === 'note' && (<textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Any observations?" className="w-full input-style" rows="2"></textarea>)}
                {logType === 'stool' && ( <StoolTypePicker selectedType={stoolType} onSelectType={setStoolType} /> )}
                <button onClick={handleSaveLog} disabled={isSaving || (logType === 'food' && !foodName)} className="button-primary w-full"> {isSaving ? 'Saving...' : (isEditing ? 'Update Log' : `Add Log`)} </button>
            </div>
        </div>
    );
};

export default LogForm;

