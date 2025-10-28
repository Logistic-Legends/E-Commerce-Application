import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  images: string[];
  category: string;
  subcategory?: string;
  rating: number;
  reviews: number;
  colors?: string[];
  sizes?: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  stock?: number;
  discountPrice?: number;
}

interface ProductContextType {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Product) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Initial mock products
const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    price: 99.99,
    originalPrice: 149.99,
    description: 'Premium wireless headphones with active noise cancellation and 30-hour battery life. Experience crystal-clear audio with deep bass and crisp highs.',
    images: [
      'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Electronics',
    subcategory: 'Smartphones',
    rating: 4.8,
    reviews: 324,
    colors: ['Black', 'White', 'Blue'],
    isNew: true,
    isFeatured: true,
    stock: 50
  },
  {
    id: '2',
    name: 'Minimalist Watch',
    price: 249.99,
    description: 'Elegant minimalist watch with premium leather strap. Swiss movement with scratch-resistant sapphire crystal.',
    images: [
      'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Fashion',
    subcategory: 'Men',
    rating: 4.9,
    reviews: 156,
    colors: ['Brown', 'Black', 'Navy'],
    isFeatured: true,
    stock: 30
  },
  {
    id: '3',
    name: 'Organic Cotton T-Shirt',
    price: 29.99,
    originalPrice: 39.99,
    description: 'Comfortable organic cotton t-shirt with perfect fit. Sustainably sourced and ethically made.',
    images: [
      'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Fashion',
    subcategory: 'Men',
    rating: 4.5,
    reviews: 89,
    colors: ['White', 'Black', 'Gray', 'Navy'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: 100
  },
  {
    id: '4',
    name: 'Smart Fitness Tracker',
    price: 129.99,
    description: 'Advanced fitness tracker with heart rate monitoring, GPS, and 7-day battery life. Track your workouts and health metrics.',
    images: [
      'https://images.pexels.com/photos/267394/pexels-photo-267394.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Electronics',
    subcategory: 'Accessories',
    rating: 4.6,
    reviews: 267,
    colors: ['Black', 'Silver', 'Rose Gold'],
    isNew: true,
    stock: 75
  },
  {
    id: '5',
    name: 'Ceramic Plant Pot',
    price: 34.99,
    description: 'Beautiful handcrafted ceramic plant pot with drainage holes. Perfect for indoor plants and succulents.',
    images: [
      'https://images.pexels.com/photos/1974508/pexels-photo-1974508.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Home & Garden',
    rating: 4.7,
    reviews: 78,
    colors: ['White', 'Terracotta', 'Black'],
    stock: 45
  },
  {
    id: '6',
    name: 'Running Shoes',
    price: 89.99,
    originalPrice: 119.99,
    description: 'Lightweight running shoes with responsive cushioning and breathable mesh upper. Perfect for daily training.',
    images: [
      'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Sports',
    rating: 4.4,
    reviews: 203,
    colors: ['White', 'Black', 'Blue'],
    sizes: ['7', '8', '9', '10', '11', '12'],
    stock: 60
  }
];

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const addProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
  };

  const updateProduct = (id: string, updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const getProductById = (id: string) => {
    return products.find(p => p.id === id);
  };

  return (
    <ProductContext.Provider 
      value={{ 
        products, 
        addProduct, 
        updateProduct, 
        deleteProduct,
        getProductById 
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
