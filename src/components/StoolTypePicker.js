import React from 'react';

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
                        <button 
                            type="button" 
                            onClick={() => onSelectType(type)} 
                            className={`p-2 rounded-full transition-all duration-200 transform ${selectedType === type ? 'scale-110' : 'hover:scale-105'}`}
                        >
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

export default StoolTypePicker;

