'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import chatService from '@/lib/api/chat';

interface ChatButtonProps {
  listingId: string;
  sellerId: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export default function ChatButton({
  listingId,
  sellerId,
  className = '',
  variant = 'primary',
  size = 'md',
  children
}: ChatButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Don't allow users to chat with themselves
    if (user?.id === sellerId) {
      return;
    }

    setIsLoading(true);

    try {
      const chatRoom = await chatService.createChatRoom(listingId);
      router.push(`/chat/${chatRoom.id}`);
    } catch (error) {
      console.error('Failed to start chat:', error);
      // Could show error toast here
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show chat button if user is the seller
  if (isAuthenticated && user?.id === sellerId) {
    return null;
  }

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={handleStartChat}
      disabled={isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {isLoading ? (
        <>
          <svg className=\"animate-spin -ml-1 mr-2 h-4 w-4\" fill=\"none\" viewBox=\"0 0 24 24\">
            <circle className=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" strokeWidth=\"4\"></circle>
            <path className=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z\"></path>
          </svg>
          Starting...
        </>
      ) : (
        <>
          <svg className=\"-ml-1 mr-2 h-4 w-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z\" />
          </svg>
          {children || (!isAuthenticated ? 'Login to Contact' : 'Contact Seller')}
        </>
      )}
    </button>
  );
}