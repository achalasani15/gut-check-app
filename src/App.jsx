import React, { useState, useEffect, useMemo, useRef } from 'react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { 
    getFirestore, 
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

// --- Charting Library ---
// We will load Recharts via a script tag in the main component's useEffect

// --- Helper for generating safe IDs for Firebase ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'gut-check-default';

// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// --- Initialize Firebase Services ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Helper Functions ---
const formatTime = (timestamp) => timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now';
const getStoolInfo = (type) => {
    switch (type) {
        case 1: return { label: 'Problematic', sublabel: 'Very Hard', colorClass: 'border-l-red-500', bgColorClass: 'bg-red-50', isProblem: true, severity: 3 };
        case 2: return { label: 'Less than Ideal', sublabel: 'Hard', colorClass: 'border-l-amber-500', bgColorClass: 'bg-amber-50', isProblem: true, severity: 1 };
        case 3: return { label: 'Ideal', sublabel: 'Firm & Formed', colorClass: 'border-l-emerald-500', bgColorClass: 'bg-white', isProblem: false, severity: 0 };
        case 4: return { label: 'Less than Ideal', sublabel: 'Soft', colorClass: 'border-l-amber-500', bgColorClass: 'bg-amber-50', isProblem: true, severity: 1 };
        case 5: return { label: 'Problematic', sublabel: 'Liquid', colorClass: 'border-l-red-500', bgColorClass: 'bg-red-50', isProblem: true, severity: 3 };
        default: return { label: '', sublabel: '', colorClass: 'border-l-zinc-200', bgColorClass: 'bg-white', isProblem: false, severity: 0 };
    }
};

// --- UI Component: Illustrated Stool Picker ---
const StoolTypePicker = ({ selectedType, onSelectType }) => {
    const stoolOptions = [ 
        { type: 1, label: 'Very Hard', emoji: '🧱' }, 
        { type: 2, label: 'Hard', emoji: '🌰' }, 
        { type: 3, label: 'Ideal', emoji: '🌭' }, 
        { type: 4, label: 'Soft', emoji: '🍦' }, 
        { type: 5, label: 'Liquid', emoji: '💧' }
    ];
    return (
        <div className="text-center">
            <label className="block text-zinc-600 mb-2 font-medium">Stool Quality</label>
            <div className="flex items-end justify-around bg-zinc-100 p-2 rounded-xl">
                {stoolOptions.map(({ type, label, emoji }) => (
                    <div key={type} className="flex flex-col items-center">
                        <button onClick={() => onSelectType(type)} className={`p-2 rounded-full transition-all duration-200 transform ${selectedType === type ? 'scale-110' : 'hover:scale-105'}`}>
                             <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all border-2 ${selectedType === type ? 'bg-emerald-500 border-emerald-600 text-white shadow-md' : 'bg-white border-zinc-200 text-zinc-600'}`}>
                                {emoji}
                            </div>
                        </button>
                        <span className={`mt-1 text-xs font-medium ${selectedType === type ? 'text-emerald-700' : 'text-zinc-500'}`}>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Component: Loader ---
const Loader = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-50">
        <span className="text-5xl">🐾</span>
        <p className="text-zinc-600 mt-4 text-lg">{message}</p>
    </div>
);

// --- Component: PetProfileSetup ---
const PetProfileSetup = ({ userId }) => {
    const [petName, setPetName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSavePet = async (name) => {
        if (!name.trim() || !userId) return; setIsSaving(true);
        try { const petCollectionPath = `/artifacts/${appId}/users/${userId}/pets`; await addDoc(collection(db, petCollectionPath), { userId, name, createdAt: Timestamp.now() }); } 
        catch (error) { console.error("Error creating pet profile:", error); } 
        finally { setIsSaving(false); }
    };
    
    const handleGenerateDummyData = async () => {
        setIsSaving(true);
        const petCollectionRef = collection(db, `/artifacts/${appId}/users/${userId}/pets`);
        await addDoc(petCollectionRef, { userId, name: "Theo (Demo)", createdAt: Timestamp.now() });
        const logCollectionPath = `/artifacts/${appId}/users/${userId}/logs`;
        const batch = writeBatch(db);
        const now = new Date();

        const createLog = (dayOffset, hour, minute, logData) => {
            const timestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset, hour, minute);
            const docRef = doc(collection(db, logCollectionPath));
            batch.set(docRef, { ...logData, timestamp: Timestamp.fromDate(timestamp) });
        };
        
        createLog(0, 8, 5, { type: 'food', food: { name: 'Prescription Kibble', quantity: '1 cup', isScavenged: false, isSafe: true } });
        createLog(0, 8, 30, { type: 'stool', stool: { type: 3 } });
        createLog(0, 12, 15, { type: 'note', generalNotes: 'Seems to be back to normal today. Phew!' });
        createLog(1, 8, 0, { type: 'food', food: { name: 'Prescription Kibble', quantity: '1 cup', isScavenged: false, isSafe: true } });
        createLog(1, 10, 0, { type: 'symptom', symptoms: ['A bit of gurgling stomach noises'] });
        createLog(1, 14, 0, { type: 'food', food: { name: 'New Lamb Treats', quantity: '2 treats', isScavenged: false, isSafe: false } });
        createLog(1, 18, 0, { type: 'stool', stool: { type: 5 } }); 
        createLog(2, 8, 10, { type: 'food', food: { name: 'Prescription Kibble', quantity: '1 cup', isScavenged: false, isSafe: true } });
        createLog(2, 9, 0, { type: 'stool', stool: { type: 3 } });
        createLog(2, 17, 30, { type: 'food', food: { name: 'New Lamb Treats', quantity: '1 treat', isScavenged: false, isSafe: false } });
        createLog(2, 19, 0, { type: 'stool', stool: { type: 4 } }); 
        createLog(2, 20, 0, { type: 'note', generalNotes: 'Was a little hesitant to eat dinner.' });
        createLog(3, 8, 0, { type: 'food', food: { name: 'Prescription Kibble', quantity: '1 cup', isScavenged: false, isSafe: true } });
        createLog(3, 8, 45, { type: 'stool', stool: { type: 3 } });
        createLog(3, 13, 0, { type: 'food', food: { name: 'Dropped piece of cheese', quantity: 'tiny piece', isScavenged: true, isSafe: false } });
        createLog(3, 17, 0, { type: 'food', food: { name: 'Prescription Kibble', quantity: '1 cup', isScavenged: false, isSafe: true } });
        createLog(3, 18, 30, { type: 'stool', stool: { type: 3 } });
        createLog(3, 19, 0, { type: 'note', generalNotes: 'Lots of energy at the park!' });

        await batch.commit();
        setIsSaving(false);
    }

    return (
        <div className="h-screen bg-zinc-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm mx-auto text-center bg-white p-8 rounded-2xl shadow-lg">
                <span className="text-6xl">🐾</span>
                <h1 className="text-2xl font-bold text-zinc-800 mt-4">Welcome to Gut Check</h1>
                <p className="text-zinc-600 mt-2 mb-6">Let's get started by creating a profile for your best friend.</p>
                <input type="text" value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="e.g., Theo" className="w-full input-style" />
                <button onClick={() => handleSavePet(petName)} disabled={!petName.trim() || isSaving} className="button-primary w-full mt-4"> {isSaving ? 'Saving...' : 'Add Your Pet'} </button>
                <div className="text-center my-4 text-zinc-500 text-sm">or</div>
                <button onClick={handleGenerateDummyData} disabled={isSaving} className="button-secondary w-full"> {isSaving ? 'Working...' : 'Try with Sample Data'} </button>
            </div>
        </div>
    );
};

// --- Component: LogForm ---
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
        foodInputRef.current.focus();
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
        if (!pet) return; setIsSaving(true);
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
        try {
            if (isEditing && logToEdit) { 
                await updateDoc(doc(db, `/artifacts/${appId}/users/${pet.userId}/logs/${logToEdit.id}`), logData); 
                onLogUpdated(`Log updated successfully!`);
                onDoneEditing(); 
            } else { 
                await addDoc(collection(db, `/artifacts/${appId}/users/${pet.userId}/logs`), logData); 
                onLogAdded(logType); 
            }
            resetForm();
        } catch (error) { console.error("Error saving log:", error); }
        finally { setIsSaving(false); }
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

// --- Component: Timeline ---
const Timeline = ({ logs, allLogs, onEdit, onDelete, highlightedLogId, setHighlightedLogId, onOpenLogForm, foodStats }) => {
    const [expandedDates, setExpandedDates] = useState({});

    useEffect(() => {
        const allDates = logs.reduce((acc, log) => {
            const date = log.timestamp.toDate().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            acc[date] = true;
            return acc;
        }, {});
        setExpandedDates(allDates);
    }, [logs]);

    const toggleDateExpansion = (date) => setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
    
    const handleTriggerClick = (logId) => {
        const targetLog = allLogs.find(log => log.id === logId); if (!targetLog) return;
        const targetDateStr = targetLog.timestamp.toDate().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        setExpandedDates(prev => ({ ...prev, [targetDateStr]: true }));
        setTimeout(() => { const element = document.getElementById(`log-${logId}`); if (element) { element.scrollIntoView({ behavior: 'smooth', block: 'center' }); setHighlightedLogId(logId); setTimeout(() => setHighlightedLogId(null), 2000); } }, 100);
    };

    const getTriggerFoods = (eventTimestamp) => {
        const recentFoods = allLogs.filter(log => log.type === 'food' && !log.food.isSafe && log.timestamp.toMillis() > eventTimestamp.toMillis() - 86400000 && log.timestamp.toMillis() <= eventTimestamp.toMillis());
        const scoredFoods = recentFoods.filter(f => !f.food.isScavenged).map(foodLog => {
            const stats = foodStats[foodLog.food.name.toLowerCase()] || { totalCount: 0, weightedBadOutcomeCount: 0 };
            const score = stats.totalCount > 0 ? (stats.weightedBadOutcomeCount / stats.totalCount) : 0;
            return { ...foodLog, suspectScore: score };
        });
        const scavengedItems = recentFoods.filter(f => f.food.isScavenged);
        return { scoredFoods, scavengedItems };
    };
    
    if (logs.length === 0) { 
        if (allLogs.length > 0) { return ( <div className="text-center text-zinc-500 py-16 bg-white rounded-xl shadow-sm"> <p className="text-4xl mb-2">🧐</p> <h3 className="font-bold text-lg text-zinc-700">No matching logs</h3> <p>Try adjusting your search or filter.</p> </div> ); }
        return ( <div className="text-center text-zinc-500 py-16 bg-white rounded-xl shadow-sm border-2 border-dashed border-zinc-200"> <p className="text-5xl mb-4">👋</p> <h3 className="font-bold text-xl text-zinc-800">Ready to start the journey?</h3> <p className="mt-2 mb-4 max-w-xs mx-auto">Log your dog's meals and symptoms to uncover patterns and improve their gut health.</p> <button className="button-primary" onClick={() => onOpenLogForm()}>Log Your First Item</button> </div> ); 
    }
    
    const formatHeaderDate = (dateStr) => {
        const today = new Date(); const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const dateObj = new Date(dateStr);
        const isToday = dateObj.toDateString() === today.toDateString();
        const isYesterday = dateObj.toDateString() === yesterday.toDateString();
        const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
        if (isToday) return `${formattedDate} (Today)`;
        if (isYesterday) return `${formattedDate} (Yesterday)`;
        return formattedDate;
    };

    const getLogIcon = (type) => { switch (type) { case 'food': return '🦴'; case 'stool': return '💩'; case 'symptom': return '❤️‍🩹'; case 'note': return '📝'; default: return '❔'; } };
    
    const groupedLogs = logs.reduce((acc, log) => {
        const date = log.timestamp.toDate().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (!acc[date]) acc[date] = []; acc[date].push(log); return acc;
    }, {});
    
    const TriggerList = ({ triggers, stoolTimestamp }) => (
        <ul className="text-sm text-zinc-600 space-y-1 mt-1">
            {triggers.scavengedItems.map(foodLog => (
                 <li key={foodLog.id} className="flex justify-between items-center">
                    <button onClick={(e) => { e.stopPropagation(); handleTriggerClick(foodLog.id); }} className="hover:underline rounded px-1 py-0.5 font-semibold text-red-600 text-left">{foodLog.food.name} <span className="text-xs text-zinc-500 font-normal">({formatTime(foodLog.timestamp)})</span></button>
                    <span className="text-xs ml-2 p-1 rounded text-red-600 font-bold">High Risk</span>
                </li>
            ))}
            {triggers.scoredFoods.sort((a,b) => b.suspectScore - a.suspectScore).map((foodLog) => {
                let scoreLabel, scoreColor, nameColor;
                if(foodLog.suspectScore > 2) { scoreLabel = 'Likely Problematic'; scoreColor = 'text-red-600 font-bold'; nameColor = 'text-red-600 font-semibold'; } 
                else if(foodLog.suspectScore > 0) { scoreLabel = 'Needs Investigation'; scoreColor = 'text-amber-600 font-semibold'; nameColor = 'text-amber-700'; } 
                else { scoreLabel = 'Likely Safe'; scoreColor = 'text-emerald-600'; nameColor = ''; }
                
                return (
                    <li key={foodLog.id} className="flex justify-between items-center">
                        <button onClick={(e) => { e.stopPropagation(); handleTriggerClick(foodLog.id); }} className={`hover:underline rounded px-1 py-0.5 text-left ${nameColor}`}>{foodLog.food.name} <span className="text-xs text-zinc-500 font-normal">({formatTime(foodLog.timestamp)})</span></button>
                        <span className={`text-xs ml-2 p-1 rounded ${scoreColor}`}>{scoreLabel}</span>
                    </li>
                )
            })}
        </ul>
    );
    
    return (
        <div className="space-y-4">
            {Object.entries(groupedLogs).map(([date, logsForDate]) => (
                 <div key={date}>
                    <button onClick={() => toggleDateExpansion(date)} className="w-full text-left">
                        <h2 className="font-bold text-zinc-500 text-sm uppercase tracking-wider mb-2 p-2 rounded-lg hover:bg-zinc-100 flex justify-between items-center">
                           <span>{formatHeaderDate(date)}</span>
                           <svg className={`w-5 h-5 text-zinc-400 transform transition-transform ${expandedDates[date] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path></svg>
                        </h2>
                    </button>
                    {expandedDates[date] && (
                        <div className="space-y-3 pl-2 border-l-2 border-zinc-200 ml-2">
                        {logsForDate.map(log => {
                            let cardStyle = `p-4 rounded-xl shadow-sm flex items-start space-x-4 transition-all border-l-4 cursor-pointer hover:shadow-lg`;
                            let stoolInfo = {};
                            
                            if (log.type === 'stool') { stoolInfo = getStoolInfo(log.stool.type); cardStyle += ` ${stoolInfo.colorClass} ${stoolInfo.isProblem ? stoolInfo.bgColorClass : 'bg-white'}`; }
                            else if (log.type === 'food' && log.food?.isScavenged) { cardStyle += ' border-l-red-500 bg-red-50'; }
                            else if (log.type === 'symptom') { cardStyle += ' border-l-amber-500 bg-amber-50'; }
                            else { cardStyle += ' border-l-zinc-300 bg-white'; }

                            if (highlightedLogId === log.id) cardStyle += ' highlight-animation';
                            
                            let triggers = { scoredFoods: [], scavengedItems: [] };
                            if (log.type === 'stool' && stoolInfo.isProblem) { triggers = getTriggerFoods(log.timestamp); }
                            
                            const hasTriggers = triggers.scoredFoods.length > 0 || triggers.scavengedItems.length > 0;
                            const foodStat = (log.type === 'food' && !log.food.isScavenged) ? foodStats[log.food.name.toLowerCase()] : null;
                            const score = foodStat ? (foodStat.totalCount > 0 ? foodStat.weightedBadOutcomeCount / foodStat.totalCount : 0) : 0;
                            
                            return (
                            <div key={log.id} id={`log-${log.id}`} className={cardStyle} onClick={() => onEdit(log)}>
                                <div className="text-2xl mt-1">{getLogIcon(log.type)}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            {log.type === 'food' && (<p className="font-semibold text-zinc-800">{log.food?.isScavenged && <span className="font-bold text-red-600 mr-2">[SCAVENGED]</span>}{log.food?.name}{log.food?.quantity && <span className="font-normal text-zinc-500 text-sm ml-2">({log.food.quantity})</span>}</p>)}
                                            {log.type === 'stool' && ( <p className="font-semibold text-zinc-800"> Stool: {stoolInfo.label} <span className="font-normal text-zinc-500 text-sm ml-2">({stoolInfo.sublabel})</span> </p> )}
                                            {log.type === 'symptom' && <p className="font-semibold text-zinc-800">Symptom: {log.symptoms?.join(', ')}</p>}
                                            {log.type === 'note' && <p className="text-zinc-700 italic">{log.generalNotes}</p>}
                                            <p className="text-xs text-zinc-500">{formatTime(log.timestamp)}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {log.type === 'food' && !log.food.isScavenged && (
                                                <span className="text-xs font-mono text-blue-500 bg-blue-100 px-2 py-1 rounded-full">
                                                    Score: {score.toFixed(2)}
                                                </span>
                                            )}
                                            {log.type === 'food' && log.food?.isSafe && (
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Safe</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {hasTriggers && ( <div className="mt-3 pt-3 border-t border-zinc-200/80"> <h4 className="text-xs font-bold text-zinc-600 mb-1">Possible Triggers to Review:</h4> <TriggerList triggers={triggers} stoolTimestamp={log.timestamp} /> </div> )}
                                </div>
                                <div className="flex flex-col space-y-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); onEdit(log); }} className="text-zinc-500 hover:text-blue-600 p-1 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"></path></svg></button>
                                    <button onClick={(e) => { e.stopPropagation(); onDelete(log.id); }} className="text-zinc-500 hover:text-red-600 p-1 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                </div>
                            </div>
                        )})}
                        </div>
                    )}
                 </div>
            ))}
        </div>
    );
};

// --- Component: ConfirmationModal ---
const ConfirmationModal = ({ isOpen, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full text-center animate-fade-in-up">
                <p className="mb-6 text-zinc-700 text-lg">{message}</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onCancel} className="button-secondary">{cancelText}</button>
                    <button onClick={onConfirm} className="button-danger">{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

// --- Component: SettingsPage ---
const SettingsPage = ({ pet, onBack, onRestart, onDeletePet }) => (
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
                <button onClick={onRestart} className="button-danger w-full sm:w-auto">Restart Journal</button>
             </div>
             <div className="border-t border-zinc-200 pt-6">
                <h2 className="font-bold text-lg text-zinc-800">Delete Pet & Start Over</h2>
                <p className="text-sm text-zinc-500 mt-1 mb-3">Permanently delete {pet.name}'s profile and all associated logs. This action cannot be undone and will return you to the welcome screen.</p>
                <button onClick={onDeletePet} className="button-danger w-full sm:w-auto">Delete Pet & Data</button>
             </div>
        </div>
    </div>
);

// --- Component: HealthDashboard ---
const HealthDashboard = ({ allLogs, foodStats, onBack, onViewLog }) => {
    const [isChartReady, setIsChartReady] = useState(!!window.Recharts);

    useEffect(() => {
        if (isChartReady) return;
        const intervalId = setInterval(() => {
            if (window.Recharts) {
                setIsChartReady(true);
                clearInterval(intervalId);
            }
        }, 100);
        return () => clearInterval(intervalId);
    }, [isChartReady]);


    if (!isChartReady) {
        return (
             <div className="p-4 animate-fade-in">
                <header className="flex items-center mb-6">
                    <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-zinc-200">
                        <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="text-2xl font-bold text-zinc-800">Health Dashboard</h1>
                </header>
                <div className="text-center text-zinc-500 py-16 bg-white rounded-xl shadow-sm">
                    <p>Loading chart library...</p>
                </div>
            </div>
        );
    }
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = window.Recharts;

    const chartData = useMemo(() => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setHours(0,0,0,0);
            date.setDate(date.getDate() - i);
            const dateString = date.toLocaleDateString('en-US');
            
            const logsForDay = allLogs.filter(log => new Date(log.timestamp.toDate()).toLocaleDateString('en-US') === dateString);
            
            let dailyScore = 100;
            const problematicStools = logsForDay.filter(l => l.type === 'stool' && getStoolInfo(l.stool.type).isProblem);
            const scavengedItems = logsForDay.filter(l => l.type === 'food' && l.food.isScavenged);

            problematicStools.forEach(stool => { dailyScore -= getStoolInfo(stool.stool.type).severity * 20; });
            dailyScore -= scavengedItems.length * 50;

            data.push({
                name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                score: Math.max(0, dailyScore)
            });
        }
        return data;
    }, [allLogs]);

    const averageScore = useMemo(() => {
        if (chartData.length === 0) return 0;
        const totalScore = chartData.reduce((acc, day) => acc + day.score, 0);
        return Math.round(totalScore / chartData.length);
    }, [chartData]);
    
    const topTrigger = useMemo(() => {
        const suspects = Object.entries(foodStats)
            .map(([name, stats]) => ({ name, score: stats.totalCount > 0 ? stats.weightedBadOutcomeCount / stats.totalCount : 0 }))
            .filter(food => food.score > 2);
        return suspects.length > 0 ? suspects.sort((a,b) => b.score - a.score)[0] : null;
    }, [foodStats]);

    const topSafeFood = useMemo(() => {
        const safeFoods = new Set(allLogs.filter(l => l.type === 'food' && l.food.isSafe).map(l => l.food.name));
        return safeFoods.size > 0 ? Array.from(safeFoods)[0] : null;
    }, [allLogs]);

    const lastScavenged = useMemo(() => {
        return allLogs.find(l => l.type === 'food' && l.food.isScavenged);
    }, [allLogs]);

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 50) return 'text-amber-500';
        return 'text-red-500';
    };
    
    return (
        <div className="p-4 animate-fade-in">
            <header className="flex items-center mb-6">
                 <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-zinc-200">
                     <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                 </button>
                <h1 className="text-2xl font-bold text-zinc-800">Health Dashboard</h1>
            </header>
            
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                    <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">7-Day Average Gut Score</h2>
                    <p className={`text-6xl font-bold ${getScoreColor(averageScore)}`}>{averageScore}</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h2 className="text-lg font-bold text-zinc-700 mb-4">Weekly Gut Score Trend</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                            <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)', borderRadius: '0.75rem', border: '1px solid #e4e4e7' }} />
                            <defs>
                                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <Line type="monotone" dataKey="score" stroke="#059669" strokeWidth={3} dot={{ r: 5, strokeWidth: 2, fill: '#ffffff' }} activeDot={{ r: 7, fill: '#059669' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h2 className="text-lg font-bold text-zinc-700 mb-3">Top Insights</h2>
                    <div className="space-y-3">
                        {topTrigger && (
                             <div className="flex items-start space-x-3">
                                 <span className="text-xl">❗️</span>
                                 <p className="text-zinc-700 text-sm">
                                     <span className="font-bold">Top Trigger:</span> The food most consistently linked to problems is <span className="font-semibold text-red-600 capitalize">{topTrigger.name}</span>.
                                 </p>
                            </div>
                        )}
                        {topSafeFood && (
                             <div className="flex items-start space-x-3">
                                <span className="text-xl">✅</span>
                                <p className="text-zinc-700 text-sm">
                                    <span className="font-bold">Safe Bet:</span> <span className="font-semibold text-emerald-600 capitalize">{topSafeFood}</span> appears to be consistently well-tolerated.
                                </p>
                            </div>
                        )}
                        {lastScavenged && (
                            <div className="flex items-start space-x-3">
                                <span className="text-xl">🚨</span>
                                <p className="text-zinc-700 text-sm">
                                     <span className="font-bold">Alert:</span> A scavenging incident (<span className="font-semibold capitalize">{lastScavenged.food.name}</span>) was logged on {new Date(lastScavenged.timestamp.toDate()).toLocaleDateString()}.
                                </p>
                           </div>
                        )}
                         {!topTrigger && !topSafeFood && !lastScavenged && (
                             <p className="text-sm text-zinc-500 text-center py-4">Log more data to start seeing insights here!</p>
                         )}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm">
                     <h2 className="text-lg font-bold text-zinc-700">Deep Dive Investigation</h2>
                     <p className="text-sm text-zinc-500 mt-2 text-center py-8">Coming soon: Click on insights to deep dive into the data.</p>
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---
export default function App() {
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [pet, setPet] = useState(null);
    const [logs, setLogs] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
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
    
    useEffect(() => {
        if (window.Recharts) return; 
        const script = document.createElement('script');
        script.src = "https://unpkg.com/recharts/umd/Recharts.min.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
          // In a real app, you might not want to remove it if it could be used again.
          // For this self-contained example, it's fine.
          // document.body.removeChild(script); 
        }
      }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) { setUserId(user.uid); } 
            else { try { const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null; if (token) { await signInWithCustomToken(auth, token); } else { await signInAnonymously(auth); } } catch (error) { console.error("Auth failed:", error); } }
            setIsAuthReady(true);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!isAuthReady || !userId) return;
        const q = query(collection(db, `/artifacts/${appId}/users/${userId}/pets`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) { setPet({ ...snapshot.docs[0].data(), petId: snapshot.docs[0].id }); } else { setPet(null); }
            setIsLoading(false);
        }, (err) => { console.error(err); setIsLoading(false); });
        return unsubscribe;
    }, [isAuthReady, userId]);
    
    useEffect(() => {
        if (!pet) { setLogs([]); return; }
        const q = query(collection(db, `/artifacts/${appId}/users/${pet.userId}/logs`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            logsData.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
            setLogs(logsData);
        }, (err) => console.error(err));
        return unsubscribe;
    }, [pet]);
    
    const foodStats = useMemo(() => {
        const stats = {};
        const allFoodLogs = logs.filter(l => l.type === 'food' && !l.food.isScavenged);
        const badStoolLogs = logs.filter(l => l.type === 'stool' && getStoolInfo(l.stool.type).isProblem);

        allFoodLogs.forEach(foodLog => {
            const foodName = foodLog.food.name.toLowerCase();
            if (!stats[foodName]) { stats[foodName] = { totalCount: 0, weightedBadOutcomeCount: 0 }; }
            stats[foodName].totalCount++;
            
            const outcomes = badStoolLogs.filter(stoolLog => stoolLog.timestamp.toMillis() > foodLog.timestamp.toMillis() && stoolLog.timestamp.toMillis() < foodLog.timestamp.toMillis() + 86400000);
            if (outcomes.length > 0) {
                 stats[foodName].weightedBadOutcomeCount += outcomes.reduce((acc, stool) => acc + getStoolInfo(stool.stool.type).severity, 0);
            }
        });
        return stats;
    }, [logs]);

    useEffect(() => {
        let logsByType = logs;
        if (activeFilter !== 'all') { logsByType = logs.filter(log => log.type === activeFilter); }
        const term = searchTerm.toLowerCase();
        if (!term) { setFilteredLogs(logsByType); return; }
        const results = logsByType.filter(log => (log.type.toLowerCase().includes(term) || log.food?.name?.toLowerCase().includes(term) || log.symptoms?.[0]?.toLowerCase().includes(term) || log.generalNotes?.toLowerCase().includes(term) || (log.stool?.type && `type ${log.stool.type}`.includes(term))));
        setFilteredLogs(results);
    }, [searchTerm, logs, activeFilter]);

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
    
    const getFilterButtonClass = (filterType) => `px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeFilter === filterType ? 'bg-emerald-600 text-white shadow' : 'bg-white text-zinc-700 hover:bg-zinc-100'}`;

    if (!isAuthReady || isLoading) return <Loader message="Connecting to your journal..." />;
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
                        <Timeline logs={filteredLogs} allLogs={logs} onEdit={handleEditRequest} onDelete={handleDeleteRequest} highlightedLogId={highlightedLogId} setHighlightedLogId={setHighlightedLogId} onOpenLogForm={openLogForm} foodStats={foodStats} />
                    </div>
                )}
                {currentView === 'settings' && (<SettingsPage pet={pet} onBack={() => setCurrentView('timeline')} onRestart={() => setShowRestartModal(true)} onDeletePet={() => setShowDeletePetModal(true)} />)}
                {currentView === 'report' && (<HealthDashboard allLogs={logs} foodStats={foodStats} onBack={() => setCurrentView('timeline')} />)}
            </main>
            
            {currentView === 'timeline' && (
                <button onClick={openLogForm} title="Add new log" className="fixed bottom-6 right-6 bg-emerald-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-4xl shadow-lg hover:bg-emerald-700 transition-all transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-emerald-300">
                    +
                </button>
            )}

            {isLogFormOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={closeLogForm}>
                     <LogForm pet={pet} allLogs={logs} logToEdit={logToEdit} onDoneEditing={closeLogForm} onCancel={closeLogForm} onLogAdded={(type) => { triggerSuccessMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} logged!`); closeLogForm(); setLastLogType(type); }} onLogUpdated={(msg) => { triggerSuccessMessage(msg); closeLogForm(); }} defaultLogType={lastLogType === 'food' ? 'stool' : 'food'} />
                </div>
            )}
            
            {showSuccessMessage && (<div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-fade-in-up">{showSuccessMessage}</div>)}
            <ConfirmationModal isOpen={showDeleteModal} message="Are you sure you want to permanently delete this log?" onConfirm={confirmDelete} onCancel={() => setShowDeleteModal(false)} />
            <ConfirmationModal isOpen={showRestartModal} message={`Are you sure you want to delete ALL logs for ${pet.name}? This cannot be undone.`} onConfirm={handleRestartJournal} onCancel={() => setShowRestartModal(false)} confirmText="Yes, Restart" />
            <ConfirmationModal isOpen={showDeletePetModal} message={`This will permanently delete ${pet.name}'s profile and all data. Are you sure?`} onConfirm={handleDeletePetAndData} onCancel={() => setShowDeletePetModal(false)} confirmText="Yes, Delete Everything" />
        </div>
    );
}

// Global styles inspired by modern design systems
const style = document.createElement('style');
style.textContent = `
    .input-style {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #e5e7eb; /* zinc-200 */
        border-radius: 0.75rem; /* rounded-xl */
        transition: all 0.2s ease-in-out;
        background-color: #f9fafb; /* zinc-50 */
    }
    .input-style:focus {
        outline: none;
        box-shadow: 0 0 0 3px #6ee7b7; /* emerald-200 ring */
        border-color: #34d399; /* emerald-400 */
        background-color: white;
    }
    .button-primary {
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
        background-color: #059669; /* emerald-600 */
        color: white;
        font-weight: 600;
        transition: all 0.2s;
        border: none;
    }
    .button-primary:hover { background-color: #047857; /* emerald-700 */ }
    .button-primary:disabled { background-color: #d1d5db; /* gray-300 */ cursor: not-allowed; }
    .button-secondary {
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
        background-color: #f4f4f5; /* zinc-100 */
        color: #3f3f46; /* zinc-700 */
        font-weight: 600;
        transition: all 0.2s;
        border: 1px solid #e4e4e7; /* zinc-200 */
    }
    .button-secondary:hover { background-color: #e4e4e7; /* zinc-200 */ }
    .button-danger {
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
        background-color: #ef4444; /* red-500 */
        color: white;
        font-weight: 600;
        transition: all 0.2s;
        border: none;
    }
    .button-danger:hover { background-color: #dc2626; /* red-600 */ }

    @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
    @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.3s ease-out; }
    .animate-fade-in-up { animation: fade-in-up 0.4s ease-out; }
    
    @keyframes highlight {
        0% { background-color: #fef9c3; } /* yellow-100 */
        100% { background-color: inherit; }
    }
    .highlight-animation {
        animation: highlight 2s ease-out;
    }
`;
document.head.append(style);
