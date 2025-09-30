'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SearchFilters, AvailableFilters, SearchRequest } from '@/types/marketplace';
import searchService from '@/lib/api/search';

interface AdvancedSearchProps {
  onSearch: (searchParams: SearchRequest) => void;
  initialFilters?: SearchFilters;
  isLoading?: boolean;
}

export default function AdvancedSearch({ 
  onSearch, 
  initialFilters = {},
  isLoading = false 
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [filterOptions, setFilterOptions] = useState<AvailableFilters | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await searchService.getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };

    loadFilterOptions();
  }, []);

  // Handle search suggestions with debouncing
  const handleQueryChange = useCallback(
    async (value: string) => {
      setQuery(value);
      
      if (value.length >= 2) {
        try {
          const newSuggestions = await searchService.getSearchSuggestions(value);
          setSuggestions(newSuggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Failed to load suggestions:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    },
    []
  );

  // Update filter state
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle array filter toggles
  const toggleArrayFilter = (key: keyof SearchFilters, value: string) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilter(key, newArray.length > 0 ? newArray : undefined);
  };

  // Handle search submission
  const handleSearch = () => {
    const searchParams: SearchRequest = {
      query: query.trim() || undefined,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      page: 1,
      limit: 20
    };
    
    onSearch(searchParams);
    setShowSuggestions(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setQuery('');
    setFilters({});
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const hasActiveFilters = query || Object.keys(filters).length > 0;

  return (
    <div className=\"bg-white rounded-lg shadow-md p-6 mb-6\">
      {/* Main Search Bar */}
      <div className=\"relative mb-4\">
        <div className=\"flex gap-2\">
          <div className=\"flex-1 relative\">
            <input
              type=\"text\"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder=\"Search by make, model, or keywords...\"
              className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500\"
            />
            
            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className=\"absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto\">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className=\"w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50\"
                    onClick={() => {
                      setQuery(suggestion);
                      setShowSuggestions(false);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className=\"px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50\"
          >
            {isExpanded ? 'Simple' : 'Advanced'}
          </button>
          
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className=\"px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50\"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && filterOptions && (
        <div className=\"border-t pt-4 space-y-4\">
          {/* Make and Model */}
          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
            <div>
              <label className=\"block text-sm font-medium text-gray-700 mb-2\">Make</label>
              <div className=\"max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2\">
                {filterOptions.makes.map(make => (
                  <label key={make.value} className=\"flex items-center space-x-2 hover:bg-gray-50 p-1 rounded\">
                    <input
                      type=\"checkbox\"
                      checked={(filters.make || []).includes(make.value)}
                      onChange={() => toggleArrayFilter('make', make.value)}
                      className=\"rounded border-gray-300 text-blue-600 focus:ring-blue-500\"
                    />
                    <span className=\"text-sm\">{make.label} ({make.count})</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className=\"block text-sm font-medium text-gray-700 mb-2\">Model</label>
              <div className=\"max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2\">
                {filterOptions.models.map(model => (
                  <label key={model.value} className=\"flex items-center space-x-2 hover:bg-gray-50 p-1 rounded\">
                    <input
                      type=\"checkbox\"
                      checked={(filters.model || []).includes(model.value)}
                      onChange={() => toggleArrayFilter('model', model.value)}
                      className=\"rounded border-gray-300 text-blue-600 focus:ring-blue-500\"
                    />
                    <span className=\"text-sm\">{model.label} ({model.count})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Price and Year Range */}
          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
            <div>
              <label className=\"block text-sm font-medium text-gray-700 mb-2\">Price Range</label>
              <div className=\"flex gap-2\">
                <input
                  type=\"number\"
                  placeholder=\"Min\"
                  value={filters.priceMin || ''}
                  onChange={(e) => updateFilter('priceMin', e.target.value ? parseInt(e.target.value) : undefined)}
                  className=\"flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\"
                />
                <span className=\"flex items-center text-gray-500\">to</span>
                <input
                  type=\"number\"
                  placeholder=\"Max\"
                  value={filters.priceMax || ''}
                  onChange={(e) => updateFilter('priceMax', e.target.value ? parseInt(e.target.value) : undefined)}
                  className=\"flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\"
                />
              </div>
            </div>
            
            <div>
              <label className=\"block text-sm font-medium text-gray-700 mb-2\">Year Range</label>
              <div className=\"flex gap-2\">
                <input
                  type=\"number\"
                  placeholder=\"Min\"
                  value={filters.yearMin || ''}
                  onChange={(e) => updateFilter('yearMin', e.target.value ? parseInt(e.target.value) : undefined)}
                  className=\"flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\"
                />
                <span className=\"flex items-center text-gray-500\">to</span>
                <input
                  type=\"number\"
                  placeholder=\"Max\"
                  value={filters.yearMax || ''}
                  onChange={(e) => updateFilter('yearMax', e.target.value ? parseInt(e.target.value) : undefined)}
                  className=\"flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\"
                />
              </div>
            </div>
          </div>

          {/* Fuel Type and Transmission */}
          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
            <div>
              <label className=\"block text-sm font-medium text-gray-700 mb-2\">Fuel Type</label>
              <div className=\"flex flex-wrap gap-2\">
                {filterOptions.fuelTypes.map(fuel => (
                  <label key={fuel.value} className=\"flex items-center space-x-2\">
                    <input
                      type=\"checkbox\"
                      checked={(filters.fuelType || []).includes(fuel.value)}
                      onChange={() => toggleArrayFilter('fuelType', fuel.value)}
                      className=\"rounded border-gray-300 text-blue-600 focus:ring-blue-500\"
                    />
                    <span className=\"text-sm\">{fuel.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className=\"block text-sm font-medium text-gray-700 mb-2\">Transmission</label>
              <div className=\"flex flex-wrap gap-2\">
                {filterOptions.transmissions.map(trans => (
                  <label key={trans.value} className=\"flex items-center space-x-2\">
                    <input
                      type=\"checkbox\"
                      checked={(filters.transmission || []).includes(trans.value)}
                      onChange={() => toggleArrayFilter('transmission', trans.value)}
                      className=\"rounded border-gray-300 text-blue-600 focus:ring-blue-500\"
                    />
                    <span className=\"text-sm\">{trans.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Location and Condition */}
          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
            <div>
              <label className=\"block text-sm font-medium text-gray-700 mb-2\">Location</label>
              <div className=\"flex gap-2\">
                <input
                  type=\"text\"
                  placeholder=\"City, State, or ZIP\"
                  value={filters.location || ''}
                  onChange={(e) => updateFilter('location', e.target.value || undefined)}
                  className=\"flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\"
                />
                <select
                  value={filters.radius || ''}
                  onChange={(e) => updateFilter('radius', e.target.value ? parseInt(e.target.value) : undefined)}
                  className=\"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\"
                >
                  <option value=\"\">Any distance</option>
                  <option value=\"25\">25 miles</option>
                  <option value=\"50\">50 miles</option>
                  <option value=\"100\">100 miles</option>
                  <option value=\"200\">200 miles</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className=\"block text-sm font-medium text-gray-700 mb-2\">Condition</label>
              <select
                value={filters.condition || ''}
                onChange={(e) => updateFilter('condition', e.target.value || undefined)}
                className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500\"
              >
                <option value=\"\">Any condition</option>
                <option value=\"new\">New</option>
                <option value=\"used\">Used</option>
                <option value=\"certified\">Certified Pre-Owned</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className=\"pt-4 border-t\">
              <button
                onClick={clearFilters}
                className=\"text-gray-600 hover:text-gray-800 text-sm font-medium\"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}