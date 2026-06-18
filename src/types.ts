/**
 * VISION UNIQUE - TypeScript Type Definitions
 * Global interfaces for User, Depot, Product, Category, etc.
 */

// ==================== USER TYPES ====================
export type UserRole = "vendor" | "manager" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  subscription_status?: "active" | "inactive" | "free";
  subscription_expiry?: string; // ISO date
  priority_level?: number;
  created_at: string; // ISO date
  updated_at: string; // ISO date
}

// ==================== CATEGORY TYPES ====================
export interface Category {
  id: string;
  name: string;
  emoji: string;
  description: string;
  is_active: boolean;
  created_at: string; // ISO date
}

// ==================== DEPOT TYPES ====================
export interface Depot {
  id: string;
  user_id?: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  phone_direct?: string;
  phone_whatsapp?: string;
  email?: string;
  address?: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  quartier?: string;
  managed_by?: string;
  manager_name?: string;
  subscription_status?: "active" | "inactive";
  subscription_expiry?: string; // ISO date (calculated as now + 30 days)
  // Système de paiement 3-tier
  tier?: "none" | "basic" | "advanced" | "elite"; // 10k, 15k, 20k, 25k
  tier_expiry?: string; // ISO date
  tier_rank?: number; // Position within tier for category
  // Système de vote
  is_top_voted?: boolean; // Top 1 du trimestre
  vote_rank?: number; // Position dans le classement (1, 2, 3...)
  current_votes?: number; // Votes actuels ce trimestre
  created_at: string; // ISO date
  updated_at: string; // ISO date
}

// ==================== PRODUCT TYPES ====================
export interface Product {
  id: string;
  depot_id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  base_price?: number;
  unit: string; // "kg", "L", "unité", etc.
  stock?: number;
  stock_quantity?: number;
  image?: string; // Cloudinary URL
  image_url?: string; // Fallback for compatibility
  is_available: boolean;
  created_at: string; // ISO date
  updated_at: string; // ISO date
}

// ==================== DEPOT WITH PRODUCTS ====================
export interface DepotWithProducts extends Depot {
  products: Product[];
  distance?: number; // Calculated in km
}

// ==================== FIREBASE RESPONSE TYPES ====================
export interface FirebaseResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FirebaseListResponse<T> {
  success: boolean;
  data?: T[];
  total?: number;
  error?: string;
  message?: string;
}

export interface PaginationResponse<T> {
  success: boolean;
  data?: T[];
  total?: number;
  page?: number;
  hasMore?: boolean;
  error?: string;
}

// ==================== AUTH HOOK TYPES ====================
export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (phone: string, password: string) => Promise<FirebaseResponse<User>>;
  register: (
    name: string,
    phone: string,
    password: string,
  ) => Promise<FirebaseResponse<User>>;
  logout: () => Promise<FirebaseResponse<null>>;
  isVendor: () => boolean;
  isManager: () => boolean;
  isAdmin: () => boolean;
}

// ==================== CACHE TYPES ====================
export interface CacheData {
  categories: Category[];
  depots: Depot[];
  lastSync: string; // ISO date
  expiresAt: string; // ISO date
}

// ==================== SUBSCRIPTION TYPES ====================
export interface SubscriptionStatus {
  isActive: boolean;
  daysRemaining: number;
  expiryDate?: string; // ISO date
  status: "active" | "warning" | "inactive";
}

// ==================== QUARTIER TYPES ====================
export interface Quartier {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
}

// ==================== DEPOT CARD PROPS ====================
export interface DepotCardProps {
  depot: DepotWithProducts;
  selectedCategory: string | null;
  searchTerm: string;
}

// ==================== UNIFIED LOGIN PROPS ====================
export interface UnifiedLoginProps {
  onLoginSuccess?: () => void;
}

// ==================== STATS GRID PROPS ====================
export interface StatsGridProps {
  stats: {
    totalRevenue: number;
    totalProducts: number;
    totalCustomers: number;
    avgRating: number;
  };
}
