export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  images: string[];
  category: string;
  rating: number;
  reviews: number;
  colors?: string[];
  sizes?: string[];
  isNew?: boolean;
  isFeatured?: boolean;
}

export interface Order {
  id: string;
  date: string;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export const categories = [
  'All',
  'Electronics',
  'Fashion',
  'Home & Garden',
  'Sports',
  'Beauty',
  'Books'
];

export const mockProducts: Product[] = [
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
    rating: 4.8,
    reviews: 324,
    colors: ['Black', 'White', 'Blue'],
    isNew: true,
    isFeatured: true
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
    rating: 4.9,
    reviews: 156,
    colors: ['Brown', 'Black', 'Navy'],
    isFeatured: true
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
    rating: 4.5,
    reviews: 89,
    colors: ['White', 'Black', 'Gray', 'Navy'],
    sizes: ['XS', 'S', 'M', 'L', 'XL']
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
    rating: 4.6,
    reviews: 267,
    colors: ['Black', 'Silver', 'Rose Gold'],
    isNew: true
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
    colors: ['White', 'Terracotta', 'Black']
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
    sizes: ['7', '8', '9', '10', '11', '12']
  }
];

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    date: '2025-01-10',
    status: 'delivered',
    total: 99.99,
    items: [
      {
        id: '1',
        name: 'Wireless Bluetooth Headphones',
        price: 99.99,
        quantity: 1,
        image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500'
      }
    ],
    shippingAddress: {
      name: 'John Doe',
      street: '123 Main St',
      city: 'New York',
      postalCode: '10001',
      country: 'USA'
    }
  },
  {
    id: 'ORD-002',
    date: '2025-01-12',
    status: 'shipped',
    total: 279.98,
    items: [
      {
        id: '2',
        name: 'Minimalist Watch',
        price: 249.99,
        quantity: 1,
        image: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=500'
      },
      {
        id: '3',
        name: 'Organic Cotton T-Shirt',
        price: 29.99,
        quantity: 1,
        image: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=500'
      }
    ],
    shippingAddress: {
      name: 'John Doe',
      street: '123 Main St',
      city: 'New York',
      postalCode: '10001',
      country: 'USA'
    }
  }
];