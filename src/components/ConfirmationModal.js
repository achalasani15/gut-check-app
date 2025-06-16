import React from 'react';

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

export default ConfirmationModal;

