import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, Trash2, MessageCircle, X, ThumbsUp, Clock, Search, Share, Copy } from 'lucide-react';
import { CommentForm } from './CommentForm';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: number;
  created_at: string;
  message: string;
  image_url: string | null;
  parent_id: number | null;
  likes: number;
  replies?: Comment[];
}

type SortOption = 'newest' | 'oldest' | 'most_liked';

interface CommentListProps {
  refreshTrigger: number;
  darkMode?: boolean;
}

export function CommentList({ refreshTrigger, darkMode }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [isWebShareSupported] = useState(() => {
    try {
      return navigator.share !== undefined && navigator.canShare !== undefined;
    } catch {
      return false;
    }
  });

  const fetchComments = async () => {
    try {
      let query = supabase
        .from('comments')
        .select('*');

      switch (sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'most_liked':
          query = query.order('likes', { ascending: false });
          break;
        default: // newest
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      const commentThreads = (data || []).reduce((acc: Comment[], comment: Comment) => {
        if (!comment.parent_id) {
          comment.replies = data.filter(reply => reply.parent_id === comment.id);
          acc.push(comment);
        }
        return acc;
      }, []);

      setComments(commentThreads);
      filterComments(commentThreads, searchQuery);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const filterComments = (commentsToFilter: Comment[], query: string) => {
    if (!query.trim()) {
      setFilteredComments(commentsToFilter);
      return;
    }

    const searchLower = query.toLowerCase();
    const filtered = commentsToFilter.filter(comment => {
      const matchesMessage = comment.message.toLowerCase().includes(searchLower);
      const hasMatchingReplies = comment.replies?.some(reply =>
        reply.message.toLowerCase().includes(searchLower)
      );
      return matchesMessage || hasMatchingReplies;
    });

    setFilteredComments(filtered);
  };

  useEffect(() => {
    fetchComments();
  }, [refreshTrigger, sortBy]);

  useEffect(() => {
    filterComments(comments, searchQuery);
  }, [searchQuery, comments]);

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setComments(prevComments => 
        prevComments.filter(comment => 
          comment.id !== id && (!comment.replies?.some(reply => reply.id === id))
        )
      );
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleLike = async (id: number) => {
    try {
      const { error } = await supabase.rpc('increment_likes', { comment_id: id });
      
      if (error) throw error;

      setComments(prevComments => {
        const updateLikes = (comments: Comment[]) => {
          return comments.map(comment => {
            if (comment.id === id) {
              return { ...comment, likes: (comment.likes || 0) + 1 };
            }
            if (comment.replies) {
              return { ...comment, replies: updateLikes(comment.replies) };
            }
            return comment;
          });
        };
        return updateLikes(prevComments);
      });
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };

  const handleShare = async (comment: Comment) => {
    const shareText = `Check out this comment on Freedom Wall:\n\n"${comment.message}"`;
    
    try {
      if (isWebShareSupported && navigator.canShare({ text: shareText })) {
        await navigator.share({ text: shareText });
        toast.success('Comment shared successfully!');
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Comment copied to clipboard!');
      }
    } catch (error) {
      // If sharing fails, fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('Comment copied to clipboard!');
      } catch (clipboardError) {
        console.error('Error sharing comment:', error);
        toast.error('Failed to share comment');
      }
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 sm:p-6 space-y-4 ${
        isReply ? 'ml-4 sm:ml-8 border-l-4 border-blue-100' : ''
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <p className={`whitespace-pre-wrap flex-grow text-sm sm:text-base ${
          darkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>{comment.message}</p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => handleShare(comment)}
            className="text-blue-500 hover:text-blue-600 p-1 rounded transition-colors group relative"
            title={isWebShareSupported ? "Share comment" : "Copy to clipboard"}
          >
            {isWebShareSupported ? <Share size={18} /> : <Copy size={18} />}
            <span className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {isWebShareSupported ? "Share comment" : "Copy to clipboard"}
            </span>
          </button>
          <button
            onClick={() => handleDelete(comment.id)}
            className="text-red-500 hover:text-red-600 p-1 rounded transition-colors group relative"
            title="Delete comment"
          >
            <Trash2 size={18} />
            <span className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Delete
            </span>
          </button>
        </div>
      </div>
      
      {comment.image_url && (
        <div className="mt-4">
          <img
            src={comment.image_url}
            alt="Comment attachment"
            className="rounded-lg max-h-96 object-contain w-full"
            loading="lazy"
          />
        </div>
      )}
      
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-gray-500">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <Clock size={16} />
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          <button
            onClick={() => handleLike(comment.id)}
            className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors"
          >
            <ThumbsUp size={16} />
            <span>{comment.likes || 0}</span>
          </button>
        </div>
        
        {!isReply && (
          <button
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors"
          >
            {replyingTo === comment.id ? (
              <>
                <X size={18} />
                <span>Cancel Reply</span>
              </>
            ) : (
              <>
                <MessageCircle size={18} />
                <span>Reply</span>
              </>
            )}
          </button>
        )}
      </div>

      {replyingTo === comment.id && (
        <div className="mt-4">
          <CommentForm
            parentId={comment.id}
            onCommentAdded={() => {
              setReplyingTo(null);
              fetchComments();
            }}
            onCancel={() => setReplyingTo(null)}
            darkMode={darkMode}
          />
        </div>
      )}

      {comment.replies && comment.replies.map(reply => renderComment(reply, true))}
    </div>
  );

  return (
    <div>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className={`text-lg sm:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Community Messages
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <Search 
                size={20} 
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} 
              />
              <input
                type="text"
                placeholder="Search comments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className={`border rounded-lg px-3 py-2 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_liked">Most Liked</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : filteredComments.length === 0 ? (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <MessageSquare className="mx-auto h-12 w-12 mb-2" />
            <p className="text-sm sm:text-base">
              {searchQuery ? 'No comments match your search' : 'No comments yet. Be the first to share your thoughts!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {filteredComments.map(comment => renderComment(comment))}
          </div>
        )}
      </div>
    </div>
  );
}