import { 
  FavoriteRequest, 
  FavoriteResponse, 
  FavoritesListResponse, 
  FavoriteStats, 
  ApiResponse 
} from '@/types/marketplace';
import authService from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8085';

class FavoritesService {
  private static instance: FavoritesService;

  public static getInstance(): FavoritesService {
    if (!FavoritesService.instance) {
      FavoritesService.instance = new FavoritesService();
    }
    return FavoritesService.instance;
  }

  /**
   * Add a listing to user's favorites
   */
  public async addFavorite(listingId: string): Promise<FavoriteResponse> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/favorites`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ listingId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add favorite');
      }

      const data: ApiResponse<FavoriteResponse> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Add favorite error:', error);
      throw error;
    }
  }

  /**
   * Remove a listing from user's favorites
   */
  public async removeFavorite(listingId: string): Promise<void> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/favorites/${listingId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove favorite');
      }
    } catch (error) {
      console.error('Remove favorite error:', error);
      throw error;
    }
  }

  /**
   * Get user's favorite listings with pagination
   */
  public async getFavorites(page: number = 1, limit: number = 20): Promise<FavoritesListResponse> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/favorites?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch favorites');
      }

      const data: ApiResponse<FavoritesListResponse> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Get favorites error:', error);
      throw error;
    }
  }

  /**
   * Check if a listing is favorited by the user
   */
  public async isFavorited(listingId: string): Promise<boolean> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/favorites/${listingId}/check`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return false;
      }

      const data: ApiResponse<{ isFavorited: boolean }> = await response.json();
      return data.data.isFavorited;
    } catch (error) {
      console.error('Check favorite error:', error);
      return false;
    }
  }

  /**
   * Get favorite statistics for the user
   */
  public async getFavoriteStats(): Promise<FavoriteStats> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/favorites/stats`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch favorite stats');
      }

      const data: ApiResponse<FavoriteStats> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Get favorite stats error:', error);
      throw error;
    }
  }

  /**
   * Search within user's favorites
   */
  public async searchFavorites(query: string, page: number = 1, limit: number = 20): Promise<FavoritesListResponse> {
    try {
      const searchParams = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/favorites/search?${searchParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to search favorites');
      }

      const data: ApiResponse<FavoritesListResponse> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Search favorites error:', error);
      throw error;
    }
  }

  /**
   * Bulk remove favorites
   */
  public async removeFavorites(listingIds: string[]): Promise<void> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/favorites/bulk`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ listingIds }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove favorites');
      }
    } catch (error) {
      console.error('Bulk remove favorites error:', error);
      throw error;
    }
  }

  /**
   * Export favorites as a list (for sharing or backup)
   */
  public async exportFavorites(): Promise<Blob> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/favorites/export`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf,text/csv',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to export favorites');
      }

      return await response.blob();
    } catch (error) {
      console.error('Export favorites error:', error);
      throw error;
    }
  }
}

export const favoritesService = FavoritesService.getInstance();
export default favoritesService;