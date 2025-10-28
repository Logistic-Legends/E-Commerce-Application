import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image, Modal, Animated } from 'react-native';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, X, ChevronDown } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useProducts } from '@/context/ProductContext';

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
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
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
    discountPrice: '',
    stock: '',
    description: '',
    image: '',
  });

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData({ ...formData, image: result.assets[0].uri });
    }
  };

  const handleAddProduct = () => {
    const price = parseFloat(formData.price);
    const discountPrice = formData.discountPrice ? parseFloat(formData.discountPrice) : undefined;

    // Validate discount price
    if (discountPrice && discountPrice >= price) {
      alert('Discount price must be less than the regular price');
      return;
    }

    const newProduct = {
      id: selectedProduct?.id || Date.now().toString(),
      name: formData.name,
      category: formData.category,
      subcategory: formData.subcategory,
      price,
      originalPrice: discountPrice ? price : undefined,
      discountPrice,
      stock: parseInt(formData.stock),
      images: [formData.image || 'https://via.placeholder.com/100'],
      description: formData.description,
      rating: 4.5,
      reviews: 0,
      isNew: true,
    };

    if (selectedProduct) {
      updateProduct(selectedProduct.id, newProduct);
    } else {
      addProduct(newProduct);
    }
    setFormData({
      name: '',
      category: '',
      subcategory: '',
      price: '',
      discountPrice: '',
      stock: '',
      description: '',
      image: '',
    });
    setIsAddModalVisible(false);
    setSelectedProduct(null);
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price.toString(),
      discountPrice: product.discountPrice?.toString() || '',
      stock: product.stock.toString(),
      description: product.description || '',
      image: product.images?.[0] || product.image || '',
    });
    setIsAddModalVisible(true);
  };

  const handleDeleteProduct = (productId: string) => {
    deleteProduct(productId);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      subcategories: []
    };
    
    setCategories([...categories, newCategory]);
    setNewCategoryName('');
    setIsAddCategoryModalVisible(false);
  };

  const handleAddSubcategory = () => {
    if (!newSubcategoryName.trim() || !selectedCategoryForSub) return;
    
    setCategories(prevCategories => prevCategories.map(cat => 
      cat.id === selectedCategoryForSub 
        ? {
            ...cat,
            subcategories: [...cat.subcategories, {
              id: Date.now().toString(),
              name: newSubcategoryName.trim()
            }]
          }
        : cat
    ));
    
    setNewSubcategoryName('');
    setSelectedCategoryForSub('');
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

  const handleSaveEdit = () => {
    if (!editingCategory) return;
    
    if (editingCategory.type === 'category') {
      if (!editCategoryForm.categoryName.trim()) return;
      
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id 
          ? { 
              ...cat, 
              name: editCategoryForm.categoryName.trim(),
              description: editCategoryForm.description.trim(),
              parentId: editCategoryForm.parentId || undefined
            }
          : cat
      ));
    } else {
      if (!editCategoryForm.categoryName.trim() || !editCategoryForm.subcategoryName.trim()) return;
      
      // Update parent category name
      setCategories(categories.map(cat => 
        cat.id === editingCategory.categoryId 
          ? {
              ...cat,
              name: editCategoryForm.categoryName.trim(),
              subcategories: cat.subcategories.map(sub => 
                sub.id === editingCategory.id 
                  ? { 
                      ...sub, 
                      name: editCategoryForm.subcategoryName.trim(),
                      description: editCategoryForm.description.trim()
                    }
                  : sub
              )
            }
          : cat
      ));
    }
    
    handleCancelEdit();
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

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.type === 'category') {
      setCategories(categories.filter(cat => cat.id !== deleteTarget.id));
    } else {
      setCategories(categories.map(cat => 
        cat.id === deleteTarget.categoryId 
          ? {
              ...cat,
              subcategories: cat.subcategories.filter(sub => sub.id !== deleteTarget.id)
            }
          : cat
      ));
    }
    
    setIsDeleteConfirmModalVisible(false);
    setDeleteTarget(null);
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
                      <Text style={[styles.productPrice, { fontSize: 14, textDecorationLine: 'line-through' }]}>৳{product.price.toFixed(2)}</Text>
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
                <Text style={styles.label}>Subcategory</Text>
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

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Price (৳)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Discount Price (৳)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.discountPrice}
                  onChangeText={(text) => setFormData({ ...formData, discountPrice: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

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
                onPress={() => {
                  if (quickAddSubcategoryName.trim() && selectedCategoryForQuickAdd) {
                    const newSubcategory = {
                      id: Date.now().toString(),
                      name: quickAddSubcategoryName.trim(),
                    };
                    
                    setCategories(prev => prev.map(cat => 
                      cat.id === selectedCategoryForQuickAdd 
                        ? { ...cat, subcategories: [...cat.subcategories, newSubcategory] }
                        : cat
                    ));
                    
                    setIsQuickAddSubcategoryVisible(false);
                    setQuickAddSubcategoryName('');
                    setSelectedCategoryForQuickAdd('');
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
                onPress={() => {
                  handleAddSubcategory();
                  setNewSubcategoryName('');
                  setSelectedCategoryForSub('');
                }}
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
});
