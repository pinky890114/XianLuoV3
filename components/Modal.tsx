
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string; // Optional prop to control width
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className={`bg-siam-cream rounded-lg shadow-xl w-full ${maxWidth} p-6 relative max-h-[95vh] flex flex-col`}>
        <div className="flex justify-between items-center mb-4 shrink-0">
             <h2 className="text-2xl font-bold text-siam-dark">{title}</h2>
             <button
              onClick={onClose}
              className="text-siam-brown hover:text-siam-dark p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        
        <div className="text-siam-brown overflow-y-auto flex-grow">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
