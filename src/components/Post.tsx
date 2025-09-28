import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PostProps {
  id: string;
  authorName: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  currentUserName: string;
}

interface Vote {
  id: string;
  post_id: string;
  user_name: string;
  vote_type: 'true' | 'fake';
}

export function Post({ id, authorName, content, imageUrl, createdAt, currentUserName }: PostProps) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [userVote, setUserVote] = useState<'true' | 'fake' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [optimisticVote, setOptimisticVote] = useState<'true' | 'fake' | null>(null);

  useEffect(() => {
    fetchVotes();
    const unsubscribe = subscribeToVotes();
    return unsubscribe;
  }, [id, currentUserName]);

  const fetchVotes = async () => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('post_id', id);
      
      if (error) {
        console.error('Error fetching votes:', error);
        return;
      }
      
      if (data) {
        setVotes(data);
        const existingVote = data.find(vote => vote.user_name === currentUserName);
        const actualVote = existingVote?.vote_type || null;
        setUserVote(actualVote);
        // Clear optimistic vote if it matches the actual vote
        if (optimisticVote === actualVote) {
          setOptimisticVote(null);
        }
      }
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  const subscribeToVotes = () => {
    const channel = supabase
      .channel(`votes-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `post_id=eq.${id}`,
        },
        (payload) => {
          console.log('Vote update received for post:', id);
          
          if (payload.eventType === 'INSERT') {
            const newVote = payload.new as Vote;
            setVotes(prevVotes => [...prevVotes, newVote]);
            
            if (newVote.user_name === currentUserName) {
              setUserVote(newVote.vote_type);
              setOptimisticVote(null);
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedVote = payload.old as Vote;
            setVotes(prevVotes => prevVotes.filter(vote => vote.id !== deletedVote.id));
            
            if (deletedVote.user_name === currentUserName) {
              setUserVote(null);
              setOptimisticVote(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleVote = async (voteType: 'true' | 'fake') => {
    if (isVoting || userVote || optimisticVote) return;

    // Optimistic update
    setOptimisticVote(voteType);
    setIsVoting(true);
    
    try {
      const { error } = await supabase
        .from('votes')
        .insert({
          post_id: id,
          user_name: currentUserName,
          vote_type: voteType,
        });

      if (error) {
        console.error('Error voting:', error);
        // Revert optimistic update on error
        setOptimisticVote(null);
        // Only show error for actual failures, not constraint violations from duplicate votes
        if (error.code !== '23505') {
          alert('Failed to submit vote. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
      setOptimisticVote(null);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (authorName !== currentUserName) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this post? This action cannot be undone.');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      console.log('Attempting to delete post:', id);
      const { data, error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
        .eq('author_name', currentUserName); // Extra security check

      if (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post. Please try again.');
      } else {
        console.log('Post deleted successfully:', data);
        // Post will disappear via real-time subscription
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate votes with optimistic updates
  const currentUserVote = optimisticVote || userVote;
  const baseVotes = votes.filter(vote => vote.user_name !== currentUserName);
  
  let trueVotes = baseVotes.filter(vote => vote.vote_type === 'true').length;
  let fakeVotes = baseVotes.filter(vote => vote.vote_type === 'fake').length;
  
  // Add current user's vote (actual or optimistic)
  if (currentUserVote === 'true') trueVotes++;
  if (currentUserVote === 'fake') fakeVotes++;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
            {authorName[0].toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="font-medium text-gray-900">{authorName}</p>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              {formatDate(createdAt)}
            </div>
          </div>
        </div>
        
        {authorName === currentUserName && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete post"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="mb-4">
        <p className="text-gray-900 leading-relaxed">{content}</p>
        {imageUrl && (
          <div className="mt-4">
            <img
              src={imageUrl}
              alt="Post content"
              className="rounded-lg max-w-full h-auto shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleVote('true')}
              disabled={isVoting || currentUserVote !== null}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                currentUserVote === 'true'
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : currentUserVote
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
              }`}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              True ({trueVotes})
            </button>

            <button
              onClick={() => handleVote('fake')}
              disabled={isVoting || currentUserVote !== null}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                currentUserVote === 'fake'
                  ? 'bg-red-100 text-red-700 border-2 border-red-300'
                  : currentUserVote
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
              }`}
            >
              <XCircle className="w-5 h-5 mr-2" />
              Fake ({fakeVotes})
            </button>
          </div>

          {currentUserVote && (
            <div className="text-sm text-gray-500">
              You voted: {currentUserVote === 'true' ? 'True' : 'Fake'}
              {optimisticVote && <span className="ml-1 opacity-60">(pending...)</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}