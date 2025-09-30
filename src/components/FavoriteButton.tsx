'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import favoritesService from '@/lib/api/favorites';

interface FavoriteButtonProps {
  listingId: string;
  initialFavorited?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
  onToggle?: (isFavorited: boolean) => void;
}

export default function FavoriteButton({
  listingId,
  initialFavorited = false,
  size = 'md',
  className = '',
  showTooltip = true,
  onToggle
}: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Check favorite status on mount if authenticated
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (isAuthenticated && !initialFavorited) {
        try {
          const favorited = await favoritesService.isFavorited(listingId);
          setIsFavorited(favorited);
        } catch (error) {
          console.error('Failed to check favorite status:', error);
        }
      }
    };

    checkFavoriteStatus();
  }, [listingId, isAuthenticated, initialFavorited]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3000);
      return;
    }

    setIsLoading(true);
    
    try {
      if (isFavorited) {
        await favoritesService.removeFavorite(listingId);
        setIsFavorited(false);
        onToggle?.(false);
      } else {
        await favoritesService.addFavorite(listingId);
        setIsFavorited(true);
        onToggle?.(true);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Could show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  // Size configurations
  const sizeClasses = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'w-10 h-10 p-2'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className=\"relative\">
      <button
        onClick={handleToggleFavorite}
        disabled={isLoading}
        className={`
          ${sizeClasses[size]}
          ${className}
          relative flex items-center justify-center
          rounded-full border-2 border-white
          bg-white/90 backdrop-blur-sm
          shadow-lg hover:shadow-xl
          transition-all duration-200
          ${isFavorited 
            ? 'text-red-500 hover:text-red-600' 
            : 'text-gray-400 hover:text-red-500'
          }
          ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:scale-110'}
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
        `}
        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isLoading ? (
          <div className={`${iconSizes[size]} animate-spin rounded-full border-2 border-current border-t-transparent`} />
        ) : (
          <svg
            className={iconSizes[size]}
            fill={isFavorited ? 'currentColor' : 'none'}
            stroke=\"currentColor\"
            viewBox=\"0 0 24 24\"
            xmlns=\"http://www.w3.org/2000/svg\"
          >
            <path
              strokeLinecap=\"round\"
              strokeLinejoin=\"round\"
              strokeWidth={2}
              d=\"M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z\"
            />
          </svg>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && !isLoading && (
        <div className=\"
          absolute -top-10 left-1/2 transform -translate-x-1/2
          opacity-0 group-hover:opacity-100 pointer-events-none
          transition-opacity duration-200
          bg-gray-900 text-white text-xs rounded px-2 py-1
          whitespace-nowrap z-50
        \">
          {!isAuthenticated 
            ? 'Login to save favorites'
            : isFavorited 
            ? 'Remove from favorites' 
            : 'Add to favorites'
          }
        </div>
      )}

      {/* Login Prompt */}
      {showLoginPrompt && (
        <div className=\"
          absolute -top-16 left-1/2 transform -translate-x-1/2
          bg-blue-600 text-white text-xs rounded-lg px-3 py-2
          whitespace-nowrap z-50 shadow-lg
          animate-bounce
        \">
          <div className=\"flex items-center space-x-2\">
            <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" />
            </svg>
            <span>Login to save favorites</span>
          </div>
          {/* Arrow */}
          <div className=\"absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-blue-600\"></div>
        </div>
      )}
    </div>
  );
}

// Higher-order component for adding favorite functionality to cards
export function withFavoriteButton<P extends { listingId: string }>(
  Component: React.ComponentType<P>,
  options?: {
    buttonPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    size?: 'sm' | 'md' | 'lg';
  }
) {
  const { buttonPosition = 'top-right', size = 'md' } = options || {};
  
  const WrappedComponent = (props: P) => {
    const positionClasses = {
      'top-right': 'absolute top-2 right-2',
      'top-left': 'absolute top-2 left-2',
      'bottom-right': 'absolute bottom-2 right-2',
      'bottom-left': 'absolute bottom-2 left-2'
    };

    return (
      <div className=\"relative group\">
        <Component {...props} />
        <FavoriteButton
          listingId={props.listingId}
          size={size}
          className={positionClasses[buttonPosition]}
        />
      </div>
    );
  };

  WrappedComponent.displayName = `withFavoriteButton(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}