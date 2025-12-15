import { productService as supabaseProductService } from '@/lib/supabase-services';

export interface Product {
  id: string;
  name: string;
  price: number;
  regularPrice?: number;
  originalPrice?: number;
  description: string;
  images: string[];
  category: string;
  subcategory?: string;
  brand?: string;
  rating: number;
  reviews: number;
  colors?: string[];
  sizes?: string[];
  availableSizes?: string[];
  availableColors?: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  stock?: number;
  totalStock?: number;
  discountPrice?: number;
  variants?: { name?: string; value?: string; stock?: number; size?: string; color?: string; sku?: string }[];
}

// Transform Supabase product to frontend format
const transformProduct = (dbProduct: any): Product => {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    price: dbProduct.discount_price || dbProduct.price || dbProduct.regular_price,
    regularPrice: dbProduct.regular_price,
    originalPrice: dbProduct.regular_price,
    discountPrice: dbProduct.discount_price,
    description: dbProduct.description || '',
    images: Array.isArray(dbProduct.images) ? dbProduct.images : ['https://via.placeholder.com/400'],
    category: dbProduct.category || 'General',
    subcategory: dbProduct.subcategory,
    brand: dbProduct.brand,
    rating: 4.5, // Default rating
    reviews: 0, // Default reviews
    colors: dbProduct.available_colors || [],
    sizes: dbProduct.available_sizes || [],
    availableSizes: dbProduct.available_sizes || [],
    availableColors: dbProduct.available_colors || [],
    isNew: false,
    isFeatured: dbProduct.featured || false,
    stock: dbProduct.total_stock || 0,
    totalStock: dbProduct.total_stock || 0,
    variants: [],
  };
};

export const productService = {
  // Get all products from Supabase
  getAllProducts: async (): Promise<Product[]> => {
    try {
      const { data, error } = await supabaseProductService.getAll();
      if (error) throw error;
      return (data || []).map(transformProduct);
    } catch (error) {
      console.error('Error fetching products from Supabase:', error);
      return []; // Return empty array instead of throwing
    }
  },

  // Get product by ID
  getProductById: async (id: string): Promise<Product> => {
    try {
      const { data, error } = await supabaseProductService.getById(id);
      if (error) throw error;
      if (!data) throw new Error('Product not found');
      return transformProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  // Get products by category
  getProductsByCategory: async (category: string): Promise<Product[]> => {
    try {
      const { data, error } = await supabaseProductService.getByCategory(category);
      if (error) throw error;
      return (data || []).map(transformProduct);
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
  },

  // Search products
  searchProducts: async (query: string): Promise<Product[]> => {
    try {
      const { data, error } = await supabaseProductService.search(query);
      if (error) throw error;
      return (data || []).map(transformProduct);
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },

  // Create product
  createProduct: async (product: any): Promise<Product> => {
    try {
      const { data, error } = await supabaseProductService.create({
        name: product.name,
        regular_price: product.regularPrice || product.price,
        discount_price: product.discountPrice,
        description: product.description,
        category: product.category,
        brand: product.brand,
        images: product.images,
        available_sizes: product.availableSizes || product.sizes,
        available_colors: product.availableColors || product.colors,
        total_stock: product.stock || product.totalStock,
        featured: product.isFeatured,
        is_active: true,
      });
      if (error) throw error;
      if (!data) throw new Error('Failed to create product');
      return transformProduct(data);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update product
  updateProduct: async (id: string, product: any): Promise<Product> => {
    try {
      const { data, error } = await supabaseProductService.update(id, {
        name: product.name,
        regular_price: product.regularPrice || product.price,
        discount_price: product.discountPrice,
        description: product.description,
        category: product.category,
        brand: product.brand,
        images: product.images,
        available_sizes: product.availableSizes || product.sizes,
        available_colors: product.availableColors || product.colors,
        total_stock: product.stock || product.totalStock,
        featured: product.isFeatured,
      });
      if (error) throw error;
      if (!data) throw new Error('Failed to update product');
      return transformProduct(data);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Delete product
  deleteProduct: async (id: string): Promise<void> => {
    try {
      const { error } = await supabaseProductService.delete(id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },
};
