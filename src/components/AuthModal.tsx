import React, { useState } from 'react';
import { User } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuth: (name: string) => void;
}

export function AuthModal({ isOpen, onClose, onAuth }: AuthModalProps) {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAuth(name.trim());
      setName('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center mb-6">
          <User className="w-8 h-8 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Welcome to TruthVote</h2>
        </div>
        
        <p className="text-gray-600 mb-6">
          Enter your name to start participating in the truth verification community.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
              maxLength={50}
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}