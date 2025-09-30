import { 
  SearchRequest, 
  SearchResponse, 
  AvailableFilters, 
  SearchAnalytics, 
  ApiResponse 
} from '@/types/marketplace';
import authService from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8085';

class SearchService {
  private static instance: SearchService;

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Search for car listings with filters and pagination
   */
  public async searchListings(params: SearchRequest): Promise<SearchResponse> {
    try {
      const searchParams = new URLSearchParams();

      // Add query parameter
      if (params.query) {
        searchParams.append('q', params.query);
      }

      // Add filter parameters
      if (params.filters) {
        const filters = params.filters;
        
        // Array filters
        if (filters.make?.length) {
          filters.make.forEach(make => searchParams.append('make', make));
        }
        if (filters.model?.length) {
          filters.model.forEach(model => searchParams.append('model', model));
        }
        if (filters.fuelType?.length) {
          filters.fuelType.forEach(fuel => searchParams.append('fuelType', fuel));
        }
        if (filters.transmission?.length) {
          filters.transmission.forEach(trans => searchParams.append('transmission', trans));
        }
        if (filters.bodyType?.length) {
          filters.bodyType.forEach(body => searchParams.append('bodyType', body));
        }

        // Range filters
        if (filters.yearMin !== undefined) {
          searchParams.append('yearMin', filters.yearMin.toString());
        }
        if (filters.yearMax !== undefined) {
          searchParams.append('yearMax', filters.yearMax.toString());
        }
        if (filters.priceMin !== undefined) {
          searchParams.append('priceMin', filters.priceMin.toString());
        }
        if (filters.priceMax !== undefined) {
          searchParams.append('priceMax', filters.priceMax.toString());
        }
        if (filters.mileageMax !== undefined) {
          searchParams.append('mileageMax', filters.mileageMax.toString());
        }

        // Location filters
        if (filters.location) {
          searchParams.append('location', filters.location);
        }
        if (filters.radius !== undefined) {
          searchParams.append('radius', filters.radius.toString());
        }

        // Condition filter
        if (filters.condition) {
          searchParams.append('condition', filters.condition);
        }
      }

      // Add sorting and pagination
      if (params.sortBy) {
        searchParams.append('sortBy', params.sortBy);
      }
      if (params.page !== undefined) {
        searchParams.append('page', params.page.toString());
      }
      if (params.limit !== undefined) {
        searchParams.append('limit', params.limit.toString());
      }

      const url = `${API_BASE_URL}/search/listings?${searchParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data: ApiResponse<SearchResponse> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Get available filter options for building search UI
   */
  public async getFilterOptions(): Promise<AvailableFilters> {
    try {
      const response = await fetch(`${API_BASE_URL}/search/filter-options`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch filter options: ${response.statusText}`);
      }

      const data: ApiResponse<AvailableFilters> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Filter options error:', error);
      throw error;
    }
  }

  /**
   * Record search analytics for improving search experience
   */
  public async recordSearch(analytics: Omit<SearchAnalytics, 'timestamp'>): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/search/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...analytics,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        // Don't throw error for analytics - it's not critical
        console.warn('Failed to record search analytics:', response.statusText);
      }
    } catch (error) {
      console.warn('Search analytics error:', error);
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  public async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const response = await fetch(
        `${API_BASE_URL}/search/suggestions?q=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data: ApiResponse<string[]> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Search suggestions error:', error);
      return [];
    }
  }

  /**
   * Get popular searches for displaying trending queries
   */
  public async getPopularSearches(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/search/popular`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return [];
      }

      const data: ApiResponse<string[]> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Popular searches error:', error);
      return [];
    }
  }

  /**
   * Save search for authenticated users
   */
  public async saveSearch(searchParams: SearchRequest, name: string): Promise<void> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/search/saved`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            searchParams,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save search');
      }
    } catch (error) {
      console.error('Save search error:', error);
      throw error;
    }
  }

  /**
   * Get saved searches for authenticated users
   */
  public async getSavedSearches(): Promise<Array<{ id: string; name: string; searchParams: SearchRequest; createdAt: string }>> {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/search/saved`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch saved searches');
      }

      const data: ApiResponse<Array<{ id: string; name: string; searchParams: SearchRequest; createdAt: string }>> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Get saved searches error:', error);
      throw error;
    }
  }
}

export const searchService = SearchService.getInstance();
export default searchService;