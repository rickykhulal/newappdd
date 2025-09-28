import React, { useState, useEffect } from 'react';
import { Shield, User, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AuthModal } from './components/AuthModal';
import { CreatePost } from './components/CreatePost';
import { Feed } from './components/Feed';

function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('truthvote-user');
    if (storedUser) {
      setCurrentUser(storedUser);
    } else {
      setShowAuthModal(true);
    }
  }, []);

  const handleAuth = async (name: string) => {
    try {
      // Insert or get user
      const { error } = await supabase
        .from('users')
        .upsert({ name }, { onConflict: 'name' });

      if (!error) {
        setCurrentUser(name);
        localStorage.setItem('truthvote-user', name);
        setShowAuthModal(false);
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('truthvote-user');
    setShowAuthModal(true);
  };

  const handleCreatePost = async (content: string, imageUrl?: string) => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_name: currentUser,
          content,
          image_url: imageUrl,
        })
        .select();

      if (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TruthVote</h1>
                <p className="text-sm text-gray-600">Community-powered fact checking</p>
              </div>
            </div>
            
            {currentUser && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg">
                  <User className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-900">{currentUser}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-2"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {currentUser ? (
          <>
            <CreatePost userName={currentUser} onCreatePost={handleCreatePost} />
            <Feed currentUserName={currentUser} />
          </>
        ) : (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to TruthVote</h2>
            <p className="text-gray-600">Join the community to start fact-checking posts</p>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuth={handleAuth}
      />
    </div>
  );
}

export default App;