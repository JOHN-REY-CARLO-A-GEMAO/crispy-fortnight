import React, { useState } from 'react';
import { ImagePlus, Loader2, Send, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface CommentFormProps {
  onCommentAdded: () => void;
  parentId?: number;
  onCancel?: () => void;
  darkMode?: boolean;
}

const MAX_CHARACTERS = 500;

export function CommentForm({ onCommentAdded, parentId, onCancel, darkMode }: CommentFormProps) {
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setImage(file);
    } else {
      toast.error('Please select a valid image file (JPEG or PNG)');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (message.length > MAX_CHARACTERS) {
      toast.error(`Message cannot exceed ${MAX_CHARACTERS} characters`);
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = null;
      
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('freedom-wall-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('freedom-wall-images')
          .getPublicUrl(fileName);
          
        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('comments')
        .insert([{ 
          message,
          image_url: imageUrl,
          parent_id: parentId || null,
        }]);

      if (error) throw error;

      setMessage('');
      setImage(null);
      setIsPreviewing(false);
      onCommentAdded();
      if (onCancel) onCancel();
      toast.success('Comment posted successfully!');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const charactersRemaining = MAX_CHARACTERS - message.length;
  const isOverLimit = charactersRemaining < 0;

  const renderPreview = () => (
    <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 sm:p-6 mt-4`}>
      <h3 className={`text-base sm:text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Preview</h3>
      <div className={`whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {message || 'No content to preview'}
      </div>
      {image && (
        <div className="mt-4">
          <img
            src={URL.createObjectURL(image)}
            alt="Preview"
            className="max-h-96 object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share your thoughts..."
          className={`w-full p-3 sm:p-4 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24 sm:h-32 ${
            isOverLimit ? 'border-red-500' : darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'
          }`}
          disabled={isSubmitting}
        />
        <div className={`text-xs sm:text-sm mt-1 text-right ${
          isOverLimit ? 'text-red-500' : darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {charactersRemaining} characters remaining
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <label className={`flex items-center gap-2 cursor-pointer ${
            darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
          } transition px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base`}>
            <ImagePlus size={18} />
            <span className={darkMode ? 'text-white' : 'text-gray-800'}>Add Image</span>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleImageChange}
              className="hidden"
              disabled={isSubmitting}
            />
          </label>
          
          <button
            type="button"
            onClick={() => setIsPreviewing(!isPreviewing)}
            className={`flex items-center gap-2 ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            } transition px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base`}
          >
            <Eye size={18} />
            <span>{isPreviewing ? 'Hide Preview' : 'Show Preview'}</span>
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`px-3 sm:px-4 py-2 ${
                darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
              } transition text-sm sm:text-base`}
            >
              Cancel
            </button>
          )}
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          {image && (
            <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate max-w-[150px]`}>
              Selected: {image.name}
            </span>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isOverLimit}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ml-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Post</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isPreviewing && renderPreview()}
    </form>
  );
}