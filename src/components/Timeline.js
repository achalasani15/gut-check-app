import React, { useState, useEffect } from 'react';
import { getStoolInfo, formatTime, getLogIcon } from '../utils'; // Helper functions

const Timeline = ({ logs, allLogs, onEdit, onDelete, foodStats, onOpenLogForm }) => {
    const [expandedDates, setExpandedDates] = useState({});
    const [highlightedLogId, setHighlightedLogId] = useState(null);

    useEffect(() => {
        // Expand all days by default
        const allDates = logs.reduce((acc, log) => {
            const date = log.timestamp.toDate().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            acc[date] = true;
            return acc;
        }, {});
        setExpandedDates(allDates);
    }, [logs]);

    const toggleDateExpansion = (date) => {
        setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
    };

    const handleTriggerClick = (e, logId) => {
        e.stopPropagation(); // Prevent card's onClick from firing
        const targetLog = allLogs.find(log => log.id === logId);
        if (!targetLog) return;
        
        const targetDateStr = targetLog.timestamp.toDate().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        // Ensure the target day is expanded
        setExpandedDates(prev => ({ ...prev, [targetDateStr]: true }));

        // Scroll to the element after a short delay to allow for re-render
        setTimeout(() => {
            const element = document.getElementById(`log-${logId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setHighlightedLogId(logId);
                setTimeout(() => setHighlightedLogId(null), 2000);
            }
        }, 100);
    };

    if (logs.length === 0) {
        // Logic for empty states
        return ( <div className="text-center text-zinc-500 py-16 bg-white rounded-xl shadow-sm border-2 border-dashed border-zinc-200"> <p className="text-5xl mb-4">👋</p> <h3 className="font-bold text-xl text-zinc-800">Ready to start the journey?</h3> <p className="mt-2 mb-4 max-w-xs mx-auto">Log your dog's meals and symptoms to uncover patterns and improve their gut health.</p> <button className="button-primary" onClick={onOpenLogForm}>Log Your First Item</button> </div> );
    }

    const groupedLogs = logs.reduce((acc, log) => {
        const date = log.timestamp.toDate().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (!acc[date]) acc[date] = [];
        acc[date].push(log);
        return acc;
    }, {});
    
    return (
        <div className="space-y-4">
            {Object.entries(groupedLogs).map(([date, logsForDate]) => (
                <div key={date}>
                    {/* ... Timeline rendering logic here ... */}
                </div>
            ))}
        </div>
    );
};

export default Timeline;

