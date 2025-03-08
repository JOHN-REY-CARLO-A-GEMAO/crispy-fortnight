import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { CommentForm } from './components/CommentForm';
import { CommentList } from './components/CommentList';
import { Moon, Sun } from 'lucide-react';

function App() {
  const [refreshComments, setRefreshComments] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-200`}>
      <Toaster position="top-right" />
      
      {/* Theme toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed top-4 right-4 p-2 rounded-full ${
          darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-800'
        } shadow-lg hover:scale-110 transition-transform z-50`}
        aria-label="Toggle theme"
      >
        {darkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      {/* Header with main image */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
          <div className="relative w-full h-40 sm:h-64 mb-6">
            <img
              src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=1200"
              alt="Freedom Wall Banner"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <h1 className={`text-2xl sm:text-3xl font-bold text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Freedom Wall
          </h1>
          <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-2 text-sm sm:text-base`}>
            Share your thoughts anonymously with the community
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Comment form */}
          <section className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 sm:p-6`}>
            <h2 className={`text-lg sm:text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Post a Message
            </h2>
            <CommentForm 
              onCommentAdded={() => setRefreshComments(prev => prev + 1)}
              darkMode={darkMode}
            />
          </section>

          {/* Comments list */}
          <section>
            <CommentList 
              refreshTrigger={refreshComments}
              darkMode={darkMode}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;