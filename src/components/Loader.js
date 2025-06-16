import React from 'react';

const Loader = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-50">
        <span className="text-5xl animate-bounce">🐾</span>
        <p className="text-zinc-600 mt-4 text-lg">{message}</p>
    </div>
);

export default Loader;

