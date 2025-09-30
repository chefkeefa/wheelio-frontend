// Comprehensive TypeScript definitions for marketplace features

// Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Search Types
export interface SearchFilters {
  make?: string[];
  model?: string[];
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  fuelType?: string[];
  transmission?: string[];
  location?: string;
  radius?: number;
  bodyType?: string[];
  mileageMax?: number;
  condition?: 'new' | 'used' | 'certified';
}

export interface SearchRequest {
  query?: string;
  filters?: SearchFilters;
  sortBy?: 'price_asc' | 'price_desc' | 'year_desc' | 'year_asc' | 'mileage_asc' | 'created_desc';
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  listings: CarListing[];
  totalCount: number;
  page: number;
  totalPages: number;
  filters: AvailableFilters;
}

export interface AvailableFilters {
  makes: FilterOption[];
  models: FilterOption[];
  fuelTypes: FilterOption[];
  transmissions: FilterOption[];
  bodyTypes: FilterOption[];
  yearRange: { min: number; max: number };
  priceRange: { min: number; max: number };
  locations: FilterOption[];
}

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface SearchAnalytics {
  query: string;
  filters: SearchFilters;
  resultsCount: number;
  timestamp: string;
}

// Car Listing Types (extend existing)
export interface CarListing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  condition: 'new' | 'used' | 'certified';
  location: string;
  description: string;
  features: string[];
  images: CarImage[];
  seller: SellerInfo;
  isFavorited?: boolean;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  status: 'active' | 'sold' | 'pending' | 'draft';
}

export interface CarImage {
  id: string;
  url: string;
  altText: string;
  isMain: boolean;
  order: number;
}

export interface SellerInfo {
  id: string;
  name: string;
  type: 'dealer' | 'private';
  phone?: string;
  email?: string;
  location: string;
  rating?: number;
  reviewCount?: number;
}

// Favorites Types
export interface FavoriteRequest {
  listingId: string;
}

export interface FavoriteResponse {
  id: string;
  listingId: string;
  userId: string;
  createdAt: string;
}

export interface FavoritesListResponse {
  favorites: (FavoriteResponse & { listing: CarListing })[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export interface FavoriteStats {
  totalFavorites: number;
  weeklyFavorites: number;
  monthlyFavorites: number;
  topMakes: { make: string; count: number }[];
  averagePrice: number;
}

// Chat Types
export interface ChatRoom {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  listing: Pick<CarListing, 'id' | 'title' | 'price' | 'images'>;
  buyer: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  seller: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  lastMessage?: ChatMessage;
  unreadCount: number;
  status: 'active' | 'closed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  messageType: 'text' | 'image' | 'offer' | 'location' | 'contact';
  content: string;
  metadata?: MessageMetadata;
  isRead: boolean;
  createdAt: string;
}

export interface MessageMetadata {
  // For offer messages
  offerAmount?: number;
  offerExpires?: string;
  offerStatus?: 'pending' | 'accepted' | 'declined' | 'expired';
  
  // For image messages
  imageUrl?: string;
  imageAltText?: string;
  
  // For location messages
  latitude?: number;
  longitude?: number;
  address?: string;
  
  // For contact messages
  phone?: string;
  email?: string;
  preferredContactMethod?: 'phone' | 'email' | 'chat';
}

export interface SendMessageRequest {
  roomId: string;
  messageType: ChatMessage['messageType'];
  content: string;
  metadata?: MessageMetadata;
}

export interface ChatRoomsResponse {
  rooms: ChatRoom[];
  totalCount: number;
  page: number;
  totalPages: number;
}

// Image Management Types
export interface ImageUploadRequest {
  listingId: string;
  files: File[];
}

export interface ImageUploadResponse {
  images: CarImage[];
  errors?: { file: string; error: string }[];
}

export interface ImageReorderRequest {
  listingId: string;
  imageOrders: { imageId: string; order: number }[];
}

export interface ImageDeleteRequest {
  listingId: string;
  imageId: string;
}

// API Response Wrappers
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, string[]>;
  timestamp: string;
  status: number;
}

// Component Props Types
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
}

export interface LoadingStateProps {
  isLoading: boolean;
  error?: string | null;
  children: React.ReactNode;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ComponentType<{ className?: string }>;
}

// Form Types
export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  children: React.ReactNode;
}

export interface SearchFormData {
  query: string;
  filters: SearchFilters;
}

// Utility Types
export type SortDirection = 'asc' | 'desc';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD';
export type DistanceUnit = 'miles' | 'kilometers';

// Hook Return Types
export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export interface UseSearchReturn {
  results: SearchResponse | null;
  isLoading: boolean;
  error: string | null;
  search: (params: SearchRequest) => Promise<void>;
  clearResults: () => void;
}

export interface UseFavoritesReturn {
  favorites: FavoritesListResponse | null;
  isLoading: boolean;
  error: string | null;
  addFavorite: (listingId: string) => Promise<void>;
  removeFavorite: (listingId: string) => Promise<void>;
  isFavorited: (listingId: string) => boolean;
  refreshFavorites: () => Promise<void>;
}