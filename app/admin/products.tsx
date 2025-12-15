import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image, Modal, Animated, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, resolveUrl } from '../../config/api';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, X, ChevronDown } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useProducts } from '@/context/ProductContext';
import { categoryService, subcategoryService } from '@/lib/supabase-services';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  subcategories: { id: string; name: string; description?: string; }[];
}

interface AdminProduct {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  discountPrice?: number;
  stock: number;
  image: string;
  description?: string;
}

const initialCategories: Category[] = [
  {
    id: '1',
    name: 'Electronics',
    subcategories: [
      { id: '1-1', name: 'Smartphones' },
      { id: '1-2', name: 'Laptops' },
      { id: '1-3', name: 'Accessories' },
    ],
  },
  {
    id: '2',
    name: 'Clothing',
    subcategories: [
      { id: '2-1', name: 'Men' },
      { id: '2-2', name: 'Women' },
      { id: '2-3', name: 'Kids' },
    ],
  },
];


export default function ProductManagement() {
  const { products, addProduct, updateProduct, deleteProduct, refreshProducts } = useProducts();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);
  const [isSubcategoryPickerVisible, setIsSubcategoryPickerVisible] = useState(false);
  const [isAddCategoryModalVisible, setIsAddCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState<string>('');
  const [isEditCategoryModalVisible, setIsEditCategoryModalVisible] = useState(false);
  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{id: string; name: string; type: 'category' | 'subcategory'; categoryId?: string} | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{id: string; name: string; type: 'category' | 'subcategory'; categoryId?: string} | null>(null);
  const [isSubcategoryPickerForAddVisible, setIsSubcategoryPickerForAddVisible] = useState(false);
  const [isSubcategoryCategoryPickerVisible, setIsSubcategoryCategoryPickerVisible] = useState(false);
  const [editCategoryForm, setEditCategoryForm] = useState({
    categoryName: '',
    subcategoryName: '',
    description: '',
    parentId: ''
  });
  const [isEditParentPickerVisible, setIsEditParentPickerVisible] = useState(false);
  const [isQuickAddSubcategoryVisible, setIsQuickAddSubcategoryVisible] = useState(false);
  const [quickAddSubcategoryName, setQuickAddSubcategoryName] = useState('');
  const [selectedCategoryForQuickAdd, setSelectedCategoryForQuickAdd] = useState('');
  
  // Animation for floating button
  const slideAnim = useState(new Animated.Value(100))[0];

  useEffect(() => {
    // Slide up animation when component mounts
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    price: '',
    cogs: '',
    discountPrice: '',
    discountPercentage: '',
    discountType: 'amount' as 'amount' | 'percentage',
    stock: '',
    description: '',
    image: '',
  });

  // Variants state for colors and sizes
  const [variants, setVariants] = useState<{
    colors: { name: string; stock: number }[];
    sizes: { name: string; stock: number }[];
  }>({
    colors: [],
    sizes: [],
  });

  const [newColor, setNewColor] = useState('');
  const [newSize, setNewSize] = useState('');
  const [sizeType, setSizeType] = useState<'preset' | 'measurement'>('preset');
  const presetSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const categoriesData = await categoryService.getAll();
      const allSubcategories = await subcategoryService.getAll();
      
      if (categoriesData) {
        const formattedCategories: Category[] = categoriesData.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          subcategories: allSubcategories
            .filter((sub: any) => sub.category_id === cat.id)
            .map((sub: any) => ({
              id: sub.id,
              name: sub.name,
              description: sub.description,
            })) || [],
        }));
        setCategories(formattedCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to initial categories if fetch fails
      setCategories(initialCategories);
    }
  };

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Add color variant
  const handleAddColor = () => {
    if (newColor.trim()) {
      setVariants({
        ...variants,
        colors: [...variants.colors, { name: newColor.trim(), stock: 0 }],
      });
      setNewColor('');
    }
  };

  // Remove color variant
  const handleRemoveColor = (index: number) => {
    setVariants({
      ...variants,
      colors: variants.colors.filter((_, i) => i !== index),
    });
  };

  // Add size variant
  const handleAddSize = () => {
    if (newSize.trim()) {
      setVariants({
        ...variants,
        sizes: [...variants.sizes, { name: newSize.trim(), stock: 0 }],
      });
      setNewSize('');
    }
  };

  // Add preset size
  const handleAddPresetSize = (size: string) => {
    if (!variants.sizes.find(s => s.name === size)) {
      setVariants({
        ...variants,
        sizes: [...variants.sizes, { name: size, stock: 0 }],
      });
    }
  };

  // Remove size variant
  const handleRemoveSize = (index: number) => {
    setVariants({
      ...variants,
      sizes: variants.sizes.filter((_, i) => i !== index),
    });
  };

  const uploadImageToSupabase = async (uri: string): Promise<string> => {
    try {
      console.log('📤 Uploading image to Supabase Storage...');
      
      // Get file extension
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `product_${Date.now()}.${ext}`;
      
      console.log('📁 File name:', fileName);
      
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('📦 Base64 length:', base64.length);
      
      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(base64);
      
      console.log('📦 ArrayBuffer size:', arrayBuffer.byteLength, 'bytes');
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${ext}`,
          upsert: false
        });
      
      if (error) {
        console.error('❌ Supabase Storage error:', error);
        throw error;
      }
      
      console.log('✅ Upload successful, getting public URL...');
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);
      
      console.log('✅ Public URL:', publicUrl);
      return publicUrl;
    } catch (error: any) {
      console.error('❌ Error uploading image:', error);
      // If storage bucket doesn't exist, show helpful error
      if (error.message?.includes('not found') || error.message?.includes('bucket')) {
        throw new Error('Storage bucket "products" not found. Please create it in Supabase Dashboard (Storage → New bucket → name: "products" → Public)');
      }
      throw error;
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        try {
          console.log('📸 Image selected, starting upload...');
          
          // Get file info
          const uri = asset.uri;
          const fileName = `product-${Date.now()}.jpg`;
          const filePath = `products/${fileName}`;
          console.log('📁 File path:', filePath);
          
          // Show uploading alert
          Alert.alert('Uploading', 'Please wait while we upload your image...');
          
          // Fetch the image file
          console.log('⬇️ Fetching image from URI...');
          const response = await fetch(uri);
          const blob = await response.blob();
          console.log('✅ Blob created, size:', blob.size);
          
          // Convert blob to ArrayBuffer
          console.log('🔄 Converting to ArrayBuffer...');
          const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = reject;
            reader.readAsArrayBuffer(blob);
          });
          console.log('✅ ArrayBuffer ready, size:', arrayBuffer.byteLength);
          
          // Upload to Supabase Storage (public bucket, no auth needed)
          console.log('☁️ Uploading to Supabase...');
          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, arrayBuffer, {
              contentType: 'image/jpeg',
              upsert: false
            });
          
          if (error) {
            console.error('❌ Supabase upload error:', error);
            Alert.alert('Upload Failed', error.message || 'Failed to upload image. Please try again.');
            return;
          }
          
          console.log('✅ Upload successful!', data);
          
          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);
          
          const publicUrl = publicUrlData.publicUrl;
          console.log('🔗 Public URL:', publicUrl);
          
          // Update form with the uploaded image URL
          setFormData({ ...formData, image: publicUrl });
          
          Alert.alert('Success', 'Image uploaded successfully!');          Alert.alert('Success', 'Image uploaded successfully!');
          
        } catch (uploadError) {
          console.error('❌ Upload process error:', uploadError);
          Alert.alert('Error', 'Failed to upload image. Please check your connection and try again.');
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleAddProduct = async () => {
    // Validation
    if (!formData.name || !formData.category || !formData.price || !formData.stock) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const price = parseFloat(formData.price);
    let discountPrice: number | undefined;

    // Calculate discount based on type
    if (formData.discountType === 'amount' && formData.discountPrice) {
      discountPrice = parseFloat(formData.discountPrice);
      // Validate discount price
      if (discountPrice >= price) {
        Alert.alert('Error', 'Discount price must be less than the regular price');
        return;
      }
    } else if (formData.discountType === 'percentage' && formData.discountPercentage) {
      const percentage = parseFloat(formData.discountPercentage);
      if (percentage <= 0 || percentage >= 100) {
        Alert.alert('Error', 'Discount percentage must be between 0 and 100');
        return;
      }
      discountPrice = price - (price * percentage / 100);
    }

    // Build variants array for backend
    const productVariants = [];
    for (const color of variants.colors) {
      for (const size of variants.sizes) {
        productVariants.push({
          size: size.name,
          color: color.name,
          stock: size.stock || 0,
          sku: `${formData.name.substring(0, 3).toUpperCase()}-${color.name}-${size.name}`.replace(/\s/g, '')
        });
      }
    }
    
    // If only colors, no sizes
    if (variants.colors.length > 0 && variants.sizes.length === 0) {
      for (const color of variants.colors) {
        productVariants.push({
          color: color.name,
          stock: color.stock || 0,
          sku: `${formData.name.substring(0, 3).toUpperCase()}-${color.name}`.replace(/\s/g, '')
        });
      }
    }
    
    // If only sizes, no colors
    if (variants.sizes.length > 0 && variants.colors.length === 0) {
      for (const size of variants.sizes) {
        productVariants.push({
          size: size.name,
          stock: size.stock || 0,
          sku: `${formData.name.substring(0, 3).toUpperCase()}-${size.name}`.replace(/\s/g, '')
        });
      }
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const userDataStr = await AsyncStorage.getItem('user');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      
      const productData: any = {
        name: formData.name.trim(),
        regularPrice: parseFloat(price.toFixed(2)),
        discountPrice: discountPrice ? parseFloat(discountPrice.toFixed(2)) : null,
        cogs: formData.cogs ? parseFloat(formData.cogs) : 0,
        description: (formData.description || '').trim(),
        category: formData.category.trim(),
        brand: formData.subcategory ? formData.subcategory.trim() : '',
        images: [formData.image || 'https://via.placeholder.com/400'],
        variants: productVariants,
        availableSizes: variants.sizes.map(s => s.name),
        availableColors: variants.colors.map(c => c.name),
        totalStock: parseInt(formData.stock) || 0,
        specifications: {},
        isActive: true,
        featured: false,
        userId: userData?.id // for activity logging
      };

      console.log('📦 Product data to send:', JSON.stringify(productData, null, 2));
      console.log('🖼️ Image URL being saved:', productData.images[0]);
      
      if (!token) {
        Alert.alert('Error', 'Please login again');
        return;
      }

      // TODO: Implement image upload with Supabase Storage
      // For now, replace local images with placeholder
      const isLocalImage = productData.images[0] && !productData.images[0].startsWith('http');
      if (isLocalImage) {
        productData.images[0] = 'https://via.placeholder.com/400';
        console.log('ℹ️ Local image replaced with placeholder');
      }

      // Use Supabase to save product
      if (selectedProduct) {
        // Update existing product
        const { data, error } = await supabase
          .from('products')
          .update({
            name: productData.name,
            regular_price: productData.regularPrice,
            discount_price: productData.discountPrice,
            cogs: productData.cogs,
            description: productData.description,
            category: productData.category,
            brand: productData.brand,
            images: productData.images,
            available_sizes: productData.availableSizes,
            available_colors: productData.availableColors,
            total_stock: productData.totalStock,
            specifications: productData.specifications,
            is_active: productData.isActive,
            featured: productData.featured,
          })
          .eq('id', selectedProduct.id)
          .select()
          .single();

        if (error) throw error;
        console.log('✅ Product updated successfully');
      } else {
        // Create new product
        console.log('🚀 Creating new product with Supabase');
        
        const { data, error } = await supabase
          .from('products')
          .insert([{
            name: productData.name,
            regular_price: productData.regularPrice,
            discount_price: productData.discountPrice,
            cogs: productData.cogs,
            description: productData.description,
            category: productData.category,
            brand: productData.brand,
            images: productData.images,
            available_sizes: productData.availableSizes,
            available_colors: productData.availableColors,
            total_stock: productData.totalStock,
            specifications: productData.specifications,
            is_active: productData.isActive,
            featured: productData.featured,
          }])
          .select()
          .single();

        if (error) throw error;
        console.log('✅ Product created successfully:', data);
      }

      Alert.alert(
        'Success', 
        selectedProduct 
          ? 'Product updated successfully!' 
          : 'Product added successfully! It will now appear in the user section.'
      );
      
      // Immediately refresh products list to show the new/updated product
      console.log('🔄 Immediately refreshing products list...');
      try {
        await refreshProducts();
        console.log('✅ Products list refreshed successfully');
      } catch (refreshError) {
        console.warn('⚠️ Auto-refresh failed, polling will pick it up:', refreshError);
      }
      
      // Reset form
      setFormData({
        name: '',
        category: '',
        subcategory: '',
        price: '',
        cogs: '',
        discountPrice: '',
        discountPercentage: '',
        discountType: 'amount',
        stock: '',
        description: '',
        image: '',
      });
      setVariants({ colors: [], sizes: [] });
      setIsAddModalVisible(false);
      setSelectedProduct(null);
    } catch (error: any) {
      console.error('Error saving product:', error);
      Alert.alert('Error', error.message || 'Failed to save product');
    }
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    
    // Get the actual regular price (originalPrice if discount exists, otherwise price)
    const regularPrice = product.originalPrice || product.price;
    const discountedPrice = product.discountPrice;
    
    // Calculate discount percentage if discount exists
    let discountPercentage = '';
    if (discountedPrice && regularPrice) {
      const percentage = ((regularPrice - discountedPrice) / regularPrice) * 100;
      discountPercentage = percentage.toFixed(2);
    }
    
    // Extract variants from product
    const colorVariants = product.variants?.filter((v: any) => v.name === 'Color').map((v: any) => ({ name: v.value, stock: v.stock || 0 })) || [];
    const sizeVariants = product.variants?.filter((v: any) => v.name === 'Size').map((v: any) => ({ name: v.value, stock: v.stock || 0 })) || [];
    
    setFormData({
      name: product.name,
      category: product.category,
      subcategory: product.subcategory,
      price: regularPrice.toString(),
      cogs: product.cogs?.toString() || '0',
      discountPrice: discountedPrice?.toString() || '',
      discountPercentage: discountPercentage,
      discountType: 'amount',
      stock: product.stock.toString(),
      description: product.description || '',
      image: product.images?.[0] || product.image || '',
    });
    
    setVariants({
      colors: colorVariants,
      sizes: sizeVariants,
    });
    
    setIsAddModalVisible(true);
  };

  const handleDeleteProduct = (productId: string) => {
    deleteProduct(productId);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      // Create category using Supabase
      const newCategory = await categoryService.create({
        name: newCategoryName.trim(),
        description: `${newCategoryName.trim()} products`,
      });
      
      if (!newCategory) {
        throw new Error('Failed to create category');
      }
      
      setNewCategoryName('');
      setIsAddCategoryModalVisible(false);
      
      // Refresh categories list
      await fetchCategories();
      
      Alert.alert('Success', 'Category added successfully!');
    } catch (error: any) {
      console.error('Error adding category:', error);
      Alert.alert('Error', error.message || 'Failed to add category. Please try again.');
    }
  };

  const handleAddSubcategory = async () => {
    if (!newSubcategoryName.trim() || !selectedCategoryForSub) return;
    
    try {
      // Create subcategory using Supabase
      const newSubcategory = await subcategoryService.create({
        category_id: selectedCategoryForSub,
        name: newSubcategoryName.trim(),
        description: `${newSubcategoryName.trim()} products`,
      });
      
      if (!newSubcategory) {
        throw new Error('Failed to create subcategory');
      }
      
      setNewSubcategoryName('');
      setSelectedCategoryForSub('');
      
      // Refresh categories list
      await fetchCategories();
      
      Alert.alert('Success', 'Subcategory added successfully!');
    } catch (error: any) {
      console.error('Error adding subcategory:', error);
      Alert.alert('Error', error.message || 'Failed to add subcategory. Please try again.');
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter(cat => cat.id !== categoryId));
  };

  const handleDeleteSubcategory = (categoryId: string, subcategoryId: string) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId 
        ? {
            ...cat,
            subcategories: cat.subcategories.filter(sub => sub.id !== subcategoryId)
          }
        : cat
    ));
  };

  const openEditModal = (id: string, name: string, type: 'category' | 'subcategory', categoryId?: string) => {
    const category = categories.find(cat => cat.id === id);
    const subcategory = categories.flatMap(cat => cat.subcategories).find(sub => sub.id === id);
    
    setEditingCategory({ id, name, type, categoryId });
    
    if (type === 'category' && category) {
      setEditCategoryForm({
        categoryName: category.name,
        subcategoryName: '',
        description: category.description || '',
        parentId: category.parentId || ''
      });
    } else if (type === 'subcategory' && subcategory) {
      const parentCategory = categories.find(cat => cat.id === categoryId);
      setEditCategoryForm({
        categoryName: parentCategory?.name || '',
        subcategoryName: subcategory.name,
        description: subcategory.description || '',
        parentId: categoryId || ''
      });
    }
    
    setIsEditCategoryModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory) return;
    
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Error', 'Please login again');
        return;
      }
      
      if (editingCategory.type === 'category') {
        if (!editCategoryForm.categoryName.trim()) return;
        
        // Update category via API
        const response = await fetch(resolveUrl(`/categories/${editingCategory.id}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editCategoryForm.categoryName.trim(),
            description: editCategoryForm.description.trim(),
            parentId: editCategoryForm.parentId || null,
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to update category');
        }
      } else {
        if (!editCategoryForm.subcategoryName.trim()) return;
        
        // Update subcategory via API
        const response = await fetch(
          resolveUrl(`/categories/${editingCategory.categoryId}/subcategories/${editingCategory.id}`),
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: editCategoryForm.subcategoryName.trim(),
              description: editCategoryForm.description.trim(),
            }),
          }
        );
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to update subcategory');
        }
      }
      
      // Refresh categories list
      await fetchCategories();
      
      handleCancelEdit();
      Alert.alert('Success', 'Changes saved successfully!');
    } catch (error: any) {
      console.error('Error saving changes:', error);
      Alert.alert('Error', error.message || 'Failed to save changes. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditCategoryModalVisible(false);
    setEditingCategory(null);
    setEditCategoryForm({ categoryName: '', subcategoryName: '', description: '', parentId: '' });
  };

  const openDeleteModal = (id: string, name: string, type: 'category' | 'subcategory', categoryId?: string) => {
    setDeleteTarget({ id, name, type, categoryId });
    setIsDeleteConfirmModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Error', 'Please login again');
        return;
      }
      
      if (deleteTarget.type === 'category') {
        // Delete category via API
        const response = await fetch(resolveUrl(`/categories/${deleteTarget.id}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to delete category');
        }
      } else {
        // Delete subcategory via API
        const response = await fetch(
          resolveUrl(`/categories/${deleteTarget.categoryId}/subcategories/${deleteTarget.id}`),
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to delete subcategory');
        }
      }
      
      // Refresh categories list
      await fetchCategories();
      
      setIsDeleteConfirmModalVisible(false);
      setDeleteTarget(null);
      Alert.alert('Success', 'Deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting:', error);
      Alert.alert('Error', error.message || 'Failed to delete. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Categories Management */}
      <View style={styles.categoriesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity 
            style={styles.manageCategoriesButton}
            onPress={() => setIsCategoryModalVisible(true)}
          >
            <Text style={styles.manageCategoriesText}>Manage Categories</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map(category => (
            <TouchableOpacity key={category.id} style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{category.name}</Text>
              <Text style={styles.categoryCount}>
                {category.subcategories.length} subcategories
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products List */}
      <ScrollView style={styles.productList}>
        {products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <Image source={{ uri: product.images?.[0] || 'https://via.placeholder.com/100' }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productCategory}>{product.category} → {product.subcategory}</Text>
              <View style={styles.productDetails}>
                <View>
                  {product.discountPrice ? (
                    <>
                      <Text style={[styles.productDiscount, { fontSize: 16, color: '#059669' }]}>৳{product.discountPrice.toFixed(2)}</Text>
                      <Text style={[styles.productPrice, { fontSize: 14, textDecorationLine: 'line-through', color: '#6B7280' }]}>৳{(product.originalPrice || product.price).toFixed(2)}</Text>
                    </>
                  ) : (
                    <Text style={styles.productPrice}>৳{product.price.toFixed(2)}</Text>
                  )}
                </View>
                <Text style={[
                  styles.productStock,
                  { color: (product.stock || 0) < 10 ? '#EF4444' : '#059669' }
                ]}>
                  Stock: {product.stock || 0}
                </Text>
              </View>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleEditProduct(product)}
              >
                <Edit2 size={16} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteProduct(product.id)}
              >
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Floating Add Product Button */}
      <Animated.View
        style={[
          styles.floatingAddButton,
          {
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.floatingAddButtonInner}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Plus size={24} color="#FFFFFF" />
          <Text style={styles.floatingAddButtonText}>Add Product</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Add/Edit Product Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedProduct ? 'Edit Product' : 'Add New Product'}
            </Text>
            <TouchableOpacity
              onPress={() => setIsAddModalVisible(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Image Upload */}
            <TouchableOpacity style={styles.imageUpload} onPress={handleImagePick}>
              {formData.image ? (
                <Image source={{ uri: formData.image }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <ImageIcon size={24} color="#6B7280" />
                  <Text style={styles.uploadText}>Upload Image</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Product Details Form */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Product Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter product name"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Category</Text>
                <TouchableOpacity 
                  style={styles.select}
                  onPress={() => setIsCategoryPickerVisible(true)}
                >
                  <Text style={[
                    styles.selectText,
                    formData.category && { color: '#111827' }
                  ]}>
                    {formData.category || 'Select category'}
                  </Text>
                  <ChevronDown size={20} color="#6B7280" />
                </TouchableOpacity>

                {/* Category Picker Modal */}
                <Modal
                  visible={isCategoryPickerVisible}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setIsCategoryPickerVisible(false)}
                >
                  <View style={styles.pickerModalOverlay}>
                    <View style={styles.pickerModalContent}>
                      <View style={styles.pickerModalHeader}>
                        <Text style={styles.pickerModalTitle}>Select Category</Text>
                        <TouchableOpacity
                          onPress={() => setIsCategoryPickerVisible(false)}
                          style={styles.closeButton}
                        >
                          <X size={24} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                      <ScrollView style={styles.pickerModalList}>
                        {categories.map(category => (
                          <TouchableOpacity
                            key={category.id}
                            style={[
                              styles.pickerModalItem,
                              formData.category === category.name && styles.pickerModalItemSelected
                            ]}
                            onPress={() => {
                              setFormData(prev => ({
                                ...prev,
                                category: category.name,
                                subcategory: '' // Reset subcategory when category changes
                              }));
                              setIsCategoryPickerVisible(false);
                            }}
                          >
                            <Text style={[
                              styles.pickerModalItemText,
                              formData.category === category.name && styles.pickerModalItemTextSelected
                            ]}>
                              {category.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </Modal>
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Subcategory (Optional)</Text>
                <TouchableOpacity 
                  style={styles.select}
                  onPress={() => formData.category ? setIsSubcategoryPickerVisible(true) : null}
                  disabled={!formData.category}
                >
                  <Text style={[
                    styles.selectText,
                    formData.subcategory && { color: '#111827' }
                  ]}>
                    {formData.subcategory || 'Select subcategory'}
                  </Text>
                  <ChevronDown size={20} color="#6B7280" />
                </TouchableOpacity>

                {/* Subcategory Picker Modal */}
                <Modal
                  visible={isSubcategoryPickerVisible}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setIsSubcategoryPickerVisible(false)}
                >
                  <View style={styles.pickerModalOverlay}>
                    <View style={styles.pickerModalContent}>
                      <View style={styles.pickerModalHeader}>
                        <Text style={styles.pickerModalTitle}>Select Subcategory</Text>
                        <TouchableOpacity
                          onPress={() => setIsSubcategoryPickerVisible(false)}
                          style={styles.closeButton}
                        >
                          <X size={24} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                      <ScrollView style={styles.pickerModalList}>
                        {categories
                          .find(cat => cat.name === formData.category)
                          ?.subcategories.map(subcategory => (
                            <TouchableOpacity
                              key={subcategory.id}
                              style={[
                                styles.pickerModalItem,
                                formData.subcategory === subcategory.name && styles.pickerModalItemSelected
                              ]}
                              onPress={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  subcategory: subcategory.name,
                                }));
                                setIsSubcategoryPickerVisible(false);
                              }}
                            >
                              <Text style={[
                                styles.pickerModalItemText,
                                formData.subcategory === subcategory.name && styles.pickerModalItemTextSelected
                              ]}>
                                {subcategory.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </ScrollView>
                    </View>
                  </View>
                </Modal>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Selling Price (৳)</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            {/* Cost of Goods Sold */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Cost of Goods Sold - COGS (৳)</Text>
              <TextInput
                style={styles.input}
                value={formData.cogs}
                onChangeText={(text) => setFormData({ ...formData, cogs: text })}
                placeholder="Enter product cost"
                keyboardType="decimal-pad"
              />
              {formData.price && formData.cogs && parseFloat(formData.price) > 0 && parseFloat(formData.cogs) > 0 && (
                <Text style={styles.discountInfo}>
                  💰 Profit Per Unit: ৳{(parseFloat(formData.price) - parseFloat(formData.cogs)).toFixed(2)}
                  {' '}({(((parseFloat(formData.price) - parseFloat(formData.cogs)) / parseFloat(formData.price)) * 100).toFixed(1)}% margin)
                </Text>
              )}
            </View>

            {/* Discount Type Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Discount Type</Text>
              <View style={styles.discountTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.discountTypeButton,
                    formData.discountType === 'amount' && styles.discountTypeButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, discountType: 'amount', discountPercentage: '' })}
                >
                  <Text style={[
                    styles.discountTypeText,
                    formData.discountType === 'amount' && styles.discountTypeTextActive
                  ]}>
                    Fixed Amount (৳)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.discountTypeButton,
                    formData.discountType === 'percentage' && styles.discountTypeButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, discountType: 'percentage', discountPrice: '' })}
                >
                  <Text style={[
                    styles.discountTypeText,
                    formData.discountType === 'percentage' && styles.discountTypeTextActive
                  ]}>
                    Percentage (%)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Conditional Discount Input */}
            {formData.discountType === 'amount' ? (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Discount Price (৳)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.discountPrice}
                  onChangeText={(text) => setFormData({ ...formData, discountPrice: text })}
                  placeholder="Enter discounted price"
                  keyboardType="decimal-pad"
                />
                {formData.price && formData.discountPrice && (
                  <Text style={styles.discountInfo}>
                    Discount: ৳{(parseFloat(formData.price) - parseFloat(formData.discountPrice)).toFixed(2)} 
                    ({(((parseFloat(formData.price) - parseFloat(formData.discountPrice)) / parseFloat(formData.price)) * 100).toFixed(1)}% off)
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Discount Percentage (%)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.discountPercentage}
                  onChangeText={(text) => setFormData({ ...formData, discountPercentage: text })}
                  placeholder="Enter discount percentage"
                  keyboardType="decimal-pad"
                />
                {formData.price && formData.discountPercentage && (
                  <Text style={styles.discountInfo}>
                    Final Price: ৳{(parseFloat(formData.price) - (parseFloat(formData.price) * parseFloat(formData.discountPercentage) / 100)).toFixed(2)}
                    {' '}(Save ৳{(parseFloat(formData.price) * parseFloat(formData.discountPercentage) / 100).toFixed(2)})
                  </Text>
                )}
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Stock Quantity</Text>
              <TextInput
                style={styles.input}
                value={formData.stock}
                onChangeText={(text) => setFormData({ ...formData, stock: text })}
                placeholder="Enter stock quantity"
                keyboardType="number-pad"
              />
            </View>

            {/* Colors Section */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Colors (Optional)</Text>
              <View style={styles.variantInputWrapper}>
                <TextInput
                  style={styles.input}
                  value={newColor}
                  onChangeText={setNewColor}
                  placeholder="Color name (e.g., Red, Blue)"
                  onSubmitEditing={handleAddColor}
                  returnKeyType="done"
                />
              </View>
              {variants.colors.length > 0 && (
                <View style={styles.variantsList}>
                  {variants.colors.map((color, index) => (
                    <View key={index} style={styles.variantChip}>
                      <Text style={styles.variantChipText}>
                        {color.name}
                      </Text>
                      <TouchableOpacity onPress={() => handleRemoveColor(index)}>
                        <Text style={styles.variantRemoveText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Sizes Section */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Sizes (Optional)</Text>
              
              {/* Size Type Selector */}
              <View style={styles.sizeTypeSelector}>
                <TouchableOpacity
                  style={[
                    styles.sizeTypeButton,
                    sizeType === 'preset' && styles.sizeTypeButtonActive
                  ]}
                  onPress={() => setSizeType('preset')}
                >
                  <Text style={[
                    styles.sizeTypeText,
                    sizeType === 'preset' && styles.sizeTypeTextActive
                  ]}>
                    Preset Sizes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sizeTypeButton,
                    sizeType === 'measurement' && styles.sizeTypeButtonActive
                  ]}
                  onPress={() => setSizeType('measurement')}
                >
                  <Text style={[
                    styles.sizeTypeText,
                    sizeType === 'measurement' && styles.sizeTypeTextActive
                  ]}>
                    Measurement
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Preset Sizes Buttons */}
              {sizeType === 'preset' && (
                <View style={styles.presetSizesContainer}>
                  {presetSizes.map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.presetSizeButton,
                        variants.sizes.find(s => s.name === size) && styles.presetSizeButtonSelected
                      ]}
                      onPress={() => handleAddPresetSize(size)}
                    >
                      <Text style={[
                        styles.presetSizeText,
                        variants.sizes.find(s => s.name === size) && styles.presetSizeTextSelected
                      ]}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Custom Measurement Input */}
              {sizeType === 'measurement' && (
                <View style={styles.variantInputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={newSize}
                    onChangeText={setNewSize}
                    placeholder="Size measurement (e.g., 32, 34, 36)"
                    onSubmitEditing={handleAddSize}
                    returnKeyType="done"
                  />
                </View>
              )}

              {/* Selected Sizes List */}
              {variants.sizes.length > 0 && (
                <View style={styles.variantsList}>
                  {variants.sizes.map((size, index) => (
                    <View key={index} style={styles.variantChip}>
                      <Text style={styles.variantChipText}>
                        {size.name}
                      </Text>
                      <TouchableOpacity onPress={() => handleRemoveSize(index)}>
                        <Text style={styles.variantRemoveText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter product description"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddProduct}
            >
              <Text style={styles.submitButtonText}>
                {selectedProduct ? 'Save Changes' : 'Add Product'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Category Management Modal */}
      <Modal
        visible={isCategoryModalVisible}
        animationType="slide"
        onRequestClose={() => setIsCategoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Categories</Text>
            <TouchableOpacity
              onPress={() => setIsCategoryModalVisible(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {categories.map(category => (
              <View key={category.id} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <View style={styles.categoryActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.addButtonCategory]}
                      onPress={() => {
                        setSelectedCategoryForQuickAdd(category.id);
                        setIsQuickAddSubcategoryVisible(true);
                      }}
                    >
                      <Plus size={16} color="#10B981" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => openEditModal(category.id, category.name, 'category')}
                    >
                      <Edit2 size={16} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => openDeleteModal(category.id, category.name, 'category')}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.subcategoriesList}>
                  {category.subcategories.map(sub => (
                    <View key={sub.id} style={styles.subcategoryItem}>
                      <Text style={styles.subcategoryName}>{sub.name}</Text>
                      <View style={styles.categoryActions}>
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.editButton]}
                          onPress={() => openEditModal(sub.id, sub.name, 'subcategory', category.id)}
                        >
                          <Edit2 size={16} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => openDeleteModal(sub.id, sub.name, 'subcategory', category.id)}
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            
            <TouchableOpacity 
              style={styles.addCategoryButton}
              onPress={() => setIsAddCategoryModalVisible(true)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addCategoryText}>Add New Category</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Quick Add Subcategory Modal */}
      <Modal
        visible={isQuickAddSubcategoryVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setIsQuickAddSubcategoryVisible(false);
          setQuickAddSubcategoryName('');
        }}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.quickAddModalContent}>
            <Text style={styles.quickAddModalTitle}>Add Subcategory</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Subcategory Name *</Text>
              <TextInput
                style={styles.input}
                value={quickAddSubcategoryName}
                onChangeText={setQuickAddSubcategoryName}
                placeholder="Enter subcategory name"
                autoFocus
              />
            </View>

            <View style={styles.quickAddButtons}>
              <TouchableOpacity
                style={[styles.quickAddButton, styles.cancelButton]}
                onPress={() => {
                  setIsQuickAddSubcategoryVisible(false);
                  setQuickAddSubcategoryName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.quickAddButton, 
                  styles.addButtonGreen,
                  !quickAddSubcategoryName.trim() && styles.submitButtonDisabled
                ]}
                onPress={async () => {
                  if (quickAddSubcategoryName.trim() && selectedCategoryForQuickAdd) {
                    try {
                      // Create subcategory using Supabase
                      const newSubcategory = await subcategoryService.create({
                        category_id: selectedCategoryForQuickAdd,
                        name: quickAddSubcategoryName.trim(),
                        description: '',
                      });
                      
                      if (!newSubcategory) {
                        throw new Error('Failed to create subcategory');
                      }
                      
                      await fetchCategories();
                      
                      setIsQuickAddSubcategoryVisible(false);
                      setQuickAddSubcategoryName('');
                      setSelectedCategoryForQuickAdd('');
                      
                      Alert.alert('Success', 'Subcategory added successfully!');
                    } catch (error: any) {
                      console.error('Error adding subcategory:', error);
                      Alert.alert('Error', error.message || 'Failed to add subcategory');
                    }
                  }
                }}
                disabled={!quickAddSubcategoryName.trim()}
              >
                <Text style={styles.addButtonGreenText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        visible={isAddCategoryModalVisible}
        animationType="slide"
        onRequestClose={() => setIsAddCategoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Category</Text>
            <TouchableOpacity
              onPress={() => setIsAddCategoryModalVisible(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={styles.input}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Enter category name"
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddCategory}
            >
              <Text style={styles.submitButtonText}>Add Category</Text>
            </TouchableOpacity>

            {/* Add Subcategory Section */}
            <View style={styles.subcategorySection}>
              <Text style={styles.sectionTitle}>Add Subcategory to Existing Category</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Select Category</Text>
                <TouchableOpacity 
                  style={styles.select}
                  onPress={() => setIsSubcategoryCategoryPickerVisible(true)}
                >
                  <Text style={[
                    styles.selectText,
                    selectedCategoryForSub && { color: '#111827' }
                  ]}>
                    {categories.find(cat => cat.id === selectedCategoryForSub)?.name || 'Select category'}
                  </Text>
                  <ChevronDown size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Subcategory Name</Text>
                <TextInput
                  style={styles.input}
                  value={newSubcategoryName}
                  onChangeText={setNewSubcategoryName}
                  placeholder="Enter subcategory name"
                  editable={!!selectedCategoryForSub}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedCategoryForSub || !newSubcategoryName.trim()) && styles.submitButtonDisabled
                ]}
                onPress={handleAddSubcategory}
                disabled={!selectedCategoryForSub || !newSubcategoryName.trim()}
              >
                <Text style={styles.submitButtonText}>Add Subcategory</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subcategory Category Picker Modal */}
      <Modal
        visible={isSubcategoryCategoryPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSubcategoryCategoryPickerVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Category for Subcategory</Text>
              <TouchableOpacity
                onPress={() => setIsSubcategoryCategoryPickerVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerModalList}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.pickerModalItem,
                    selectedCategoryForSub === category.id && styles.pickerModalItemSelected
                  ]}
                  onPress={() => {
                    setSelectedCategoryForSub(category.id);
                    setIsSubcategoryCategoryPickerVisible(false);
                  }}
                >
                  <Text style={[
                    styles.pickerModalItemText,
                    selectedCategoryForSub === category.id && styles.pickerModalItemTextSelected
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Parent Category Picker for Edit Modal */}
      <Modal
        visible={isEditParentPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditParentPickerVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Parent Category</Text>
              <TouchableOpacity
                onPress={() => setIsEditParentPickerVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerModalList}>
              <TouchableOpacity
                style={[
                  styles.pickerModalItem,
                  !editCategoryForm.parentId && styles.pickerModalItemSelected
                ]}
                onPress={() => {
                  setEditCategoryForm(prev => ({ ...prev, parentId: '' }));
                  setIsEditParentPickerVisible(false);
                }}
              >
                <Text style={[
                  styles.pickerModalItemText,
                  !editCategoryForm.parentId && styles.pickerModalItemTextSelected
                ]}>
                  None (Main Category)
                </Text>
              </TouchableOpacity>
              {categories.filter(cat => cat.id !== editingCategory?.id).map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.pickerModalItem,
                    editCategoryForm.parentId === category.id && styles.pickerModalItemSelected
                  ]}
                  onPress={() => {
                    setEditCategoryForm(prev => ({ ...prev, parentId: category.id }));
                    setIsEditParentPickerVisible(false);
                  }}
                >
                  <Text style={[
                    styles.pickerModalItemText,
                    editCategoryForm.parentId === category.id && styles.pickerModalItemTextSelected
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Category/Subcategory Modal */}
      <Modal
        visible={isEditCategoryModalVisible}
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalContainer}>
          <View style={styles.editModalHeader}>
            <Text style={styles.editModalTitle}>Edit Category</Text>
          </View>
          
          <ScrollView style={styles.editModalContent}>
            <View style={styles.editFormRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Category Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editCategoryForm.categoryName}
                  onChangeText={(text) => setEditCategoryForm(prev => ({ ...prev, categoryName: text }))}
                  placeholder="Enter category name"
                  autoFocus
                />
              </View>

              {editingCategory?.type === 'subcategory' && (
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Subcategory Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={editCategoryForm.subcategoryName}
                    onChangeText={(text) => setEditCategoryForm(prev => ({ ...prev, subcategoryName: text }))}
                    placeholder="Enter subcategory name"
                  />
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editCategoryForm.description}
                onChangeText={(text) => setEditCategoryForm(prev => ({ ...prev, description: text }))}
                placeholder="Enter description (optional)"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {editingCategory?.type === 'category' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Parent Category (Optional)</Text>
                <TouchableOpacity 
                  style={styles.select}
                  onPress={() => setIsEditParentPickerVisible(true)}
                >
                  <Text style={[
                    styles.selectText,
                    editCategoryForm.parentId && { color: '#111827' }
                  ]}>
                    {categories.find(cat => cat.id === editCategoryForm.parentId)?.name || 'None (Main Category)'}
                  </Text>
                  <ChevronDown size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.editModalButtons}>
              <TouchableOpacity
                style={[styles.editModalButton, styles.cancelButtonRed]}
                onPress={handleCancelEdit}
              >
                <X size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.cancelButtonRedText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.editModalButton, 
                  styles.saveButtonGreen,
                  (editingCategory?.type === 'category' 
                    ? !editCategoryForm.categoryName.trim()
                    : !editCategoryForm.categoryName.trim() || !editCategoryForm.subcategoryName.trim()
                  ) && styles.submitButtonDisabled
                ]}
                onPress={handleSaveEdit}
                disabled={editingCategory?.type === 'category' 
                  ? !editCategoryForm.categoryName.trim()
                  : !editCategoryForm.categoryName.trim() || !editCategoryForm.subcategoryName.trim()
                }
              >
                <Text style={styles.saveButtonGreenText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={isDeleteConfirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteConfirmModalVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Confirm Delete</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete "{deleteTarget?.name}"?
              {deleteTarget?.type === 'category' && ' This will also delete all subcategories.'}
            </Text>
            <View style={styles.editModalButtons}>
              <TouchableOpacity
                style={[styles.editModalButton, styles.cancelButton]}
                onPress={() => setIsDeleteConfirmModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editModalButton, styles.deleteConfirmButton]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.deleteConfirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  categoriesSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  manageCategoriesButton: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  manageCategoriesText: {
    color: '#3B82F6',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  categoryCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  productList: {
    flex: 1,
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  productDiscount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#059669',
  },
  productStock: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  actionButtons: {
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: '#EBF5FF',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  imageUpload: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#F9FAFB',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  selectText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  categoryItem: {
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  subcategoriesList: {
    marginLeft: 16,
  },
  subcategoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subcategoryName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  addCategoryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  pickerModalList: {
    padding: 16,
  },
  pickerModalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pickerModalItemSelected: {
    backgroundColor: '#EBF5FF',
  },
  pickerModalItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  pickerModalItemTextSelected: {
    color: '#3B82F6',
    fontFamily: 'Inter-Medium',
  },
  subcategorySection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  editModalContent: {
    padding: 16,
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  editModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  deleteModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteModalText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  deleteConfirmButton: {
    backgroundColor: '#EF4444',
  },
  deleteConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  editModalHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  editModalTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    fontWeight: 'bold',
  },
  editFormRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  saveButtonGreen: {
    backgroundColor: '#10B981',
  },
  saveButtonGreenText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  cancelButtonRed: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonRedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  addButtonCategory: {
    backgroundColor: '#D1FAE5',
  },
  quickAddModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: '40%',
  },
  quickAddModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  quickAddButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  quickAddButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonGreen: {
    backgroundColor: '#10B981',
  },
  addButtonGreenText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
  },
  floatingAddButtonInner: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    gap: 8,
  },
  floatingAddButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  discountTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  discountTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  discountTypeButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF5FF',
  },
  discountTypeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  discountTypeTextActive: {
    color: '#3B82F6',
    fontFamily: 'Inter-SemiBold',
  },
  discountInfo: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#059669',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  variantInputWrapper: {
    marginBottom: 8,
  },
  variantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  variantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  variantChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
  },
  variantRemoveText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#EF4444',
  },
  sizeTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  sizeTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  sizeTypeButtonActive: {
    backgroundColor: '#EBF5FF',
    borderColor: '#3B82F6',
  },
  sizeTypeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  sizeTypeTextActive: {
    color: '#3B82F6',
    fontFamily: 'Inter-SemiBold',
  },
  presetSizesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  presetSizeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    minWidth: 50,
    alignItems: 'center',
  },
  presetSizeButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  presetSizeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  presetSizeTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
});
