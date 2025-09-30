'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import favoritesService from '@/lib/api/favorites';
import { FavoritesListResponse } from '@/types/marketplace';

export default function FavoritesPage() {
  return (
    <ProtectedRoute>
      <FavoritesContent />
    </ProtectedRoute>
  );
}

function FavoritesContent() {
  const [favorites, setFavorites] = useState<FavoritesListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const data = await favoritesService.getFavorites();
      setFavorites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (listingId: string) => {
    try {
      await favoritesService.removeFavorite(listingId);
      await loadFavorites(); // Reload the list
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadFavorites();
      return;
    }

    try {
      setIsLoading(true);
      const data = await favoritesService.searchFavorites(query);
      setFavorites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !favorites) {
    return (
      <div className=\"min-h-screen flex items-center justify-center\">
        <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600\"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className=\"min-h-screen flex items-center justify-center\">
        <div className=\"text-center\">
          <p className=\"text-red-600 mb-4\">{error}</p>
          <button
            onClick={loadFavorites}
            className=\"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700\"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className=\"container mx-auto px-4 py-8\">
      <div className=\"mb-8\">
        <h1 className=\"text-3xl font-bold text-gray-900 mb-4\">My Favorites</h1>
        
        {/* Search */}
        <div className=\"flex gap-4 mb-6\">
          <input
            type=\"text\"
            placeholder=\"Search your favorites...\"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className=\"flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500\"
          />
          <button
            onClick={() => handleSearch(searchQuery)}
            className=\"px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700\"
          >
            Search
          </button>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                loadFavorites();
              }}
              className=\"px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50\"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {favorites && favorites.favorites.length === 0 ? (
        <div className=\"text-center py-12\">
          <svg className=\"mx-auto h-12 w-12 text-gray-400 mb-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z\" />
          </svg>
          <h3 className=\"text-lg font-medium text-gray-900 mb-2\">No favorites yet</h3>
          <p className=\"text-gray-500 mb-6\">Start browsing cars and save your favorites to see them here.</p>
          <a
            href=\"/\"
            className=\"inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700\"
          >
            Browse Cars
          </a>
        </div>
      ) : (
        <div className=\"space-y-6\">
          {favorites?.favorites.map((favorite) => (
            <div key={favorite.id} className=\"bg-white rounded-lg shadow-md overflow-hidden\">
              <div className=\"flex\">
                {/* Image */}
                <div className=\"flex-shrink-0\">
                  <img
                    src={favorite.listing.images[0]?.url || '/placeholder.jpg'}
                    alt={favorite.listing.title}
                    className=\"w-48 h-32 object-cover\"
                  />
                </div>
                
                {/* Content */}
                <div className=\"flex-1 p-6\">
                  <div className=\"flex justify-between items-start\">
                    <div>
                      <h3 className=\"text-xl font-semibold text-gray-900 mb-2\">
                        {favorite.listing.title}
                      </h3>
                      <p className=\"text-2xl font-bold text-blue-600 mb-2\">
                        ${favorite.listing.price.toLocaleString()}
                      </p>
                      <div className=\"flex items-center space-x-4 text-sm text-gray-500\">
                        <span>{favorite.listing.year}</span>
                        <span>•</span>
                        <span>{favorite.listing.mileage.toLocaleString()} miles</span>
                        <span>•</span>
                        <span>{favorite.listing.location}</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className=\"flex space-x-2\">
                      <a
                        href={`/listing/${favorite.listing.id}`}
                        className=\"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700\"
                      >
                        View Details
                      </a>
                      <button
                        onClick={() => handleRemoveFavorite(favorite.listing.id)}
                        className=\"px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50\"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  <div className=\"mt-4 text-sm text-gray-500\">
                    Saved on {new Date(favorite.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Pagination would go here */}
          {favorites && favorites.totalPages > 1 && (
            <div className=\"flex justify-center mt-8\">
              <div className=\"text-sm text-gray-500\">
                Showing {favorites.favorites.length} of {favorites.totalCount} favorites
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}