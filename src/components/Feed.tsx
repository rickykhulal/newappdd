import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Post } from './Post';

interface PostData {
  id: string;
  author_name: string;
  content: string;
  image_url?: string;
  created_at: string;
}

interface FeedProps {
  currentUserName: string;
}

export function Feed({ currentUserName }: FeedProps) {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
    subscribeToFeed();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
      } else {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToFeed = () => {
    const channel = supabase
      .channel('posts-feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No posts yet. Be the first to share something!</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <Post
          key={post.id}
          id={post.id}
          authorName={post.author_name}
          content={post.content}
          imageUrl={post.image_url}
          createdAt={post.created_at}
          currentUserName={currentUserName}
        />
      ))}
    </div>
  );
}