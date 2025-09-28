import React, { useState } from 'react';
import { Send, Image } from 'lucide-react';

interface CreatePostProps {
  userName: string;
  onCreatePost: (content: string, imageUrl?: string) => void;
}

export function CreatePost({ userName, onCreatePost }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreatePost(content.trim(), imageUrl.trim() || undefined);
      setContent('');
      setImageUrl('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
          {userName[0].toUpperCase()}
        </div>
        <div className="ml-3">
          <p className="font-medium text-gray-900">{userName}</p>
          <p className="text-sm text-gray-500">Share something to verify...</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What would you like the community to fact-check?"
            className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            rows={3}
            maxLength={500}
            required
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">
              {content.length}/500 characters
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Image className="w-4 h-4 text-gray-500 mr-2" />
            <label htmlFor="imageUrl" className="text-sm font-medium text-gray-700">
              Image URL (optional)
            </label>
          </div>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}