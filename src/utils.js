// This file contains shared helper functions used across different components.

export const getStoolInfo = (type) => {
    switch (type) {
        case 1: return { label: 'Problematic', sublabel: 'Very Hard', colorClass: 'border-l-red-500', bgColorClass: 'bg-red-50', isProblem: true, severity: 3 };
        case 2: return { label: 'Less than Ideal', sublabel: 'Hard', colorClass: 'border-l-amber-500', bgColorClass: 'bg-amber-50', isProblem: true, severity: 1 };
        case 3: return { label: 'Ideal', sublabel: 'Firm & Formed', colorClass: 'border-l-emerald-500', bgColorClass: 'bg-white', isProblem: false, severity: 0 };
        case 4: return { label: 'Less than Ideal', sublabel: 'Soft', colorClass: 'border-l-amber-500', bgColorClass: 'bg-amber-50', isProblem: true, severity: 1 };
        case 5: return { label: 'Problematic', sublabel: 'Liquid', colorClass: 'border-l-red-500', bgColorClass: 'bg-red-50', isProblem: true, severity: 3 };
        default: return { label: '', sublabel: '', colorClass: 'border-l-zinc-200', bgColorClass: 'bg-white', isProblem: false, severity: 0 };
    }
};

export const formatTime = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Just now';
    return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getLogIcon = (type) => {
    switch (type) {
        case 'food': return '🦴';
        case 'stool': return '💩';
        case 'symptom': return '❤️‍🩹';
        case 'note': return '📝';
        default: return '❔';
    }
};
