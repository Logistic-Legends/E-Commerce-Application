import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { X, ChevronDown, ChevronUp } from 'lucide-react-native';

export interface FilterOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest';
  inStock?: boolean;
}

interface ProductFiltersProps {
  categories: string[];
  onApplyFilters: (filters: FilterOptions) => void;
  onClearFilters: () => void;
  currentFilters?: FilterOptions;
}

export default function ProductFilters({ 
  categories, 
  onApplyFilters, 
  onClearFilters,
  currentFilters = {}
}: ProductFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(currentFilters.category);
  const [minPrice, setMinPrice] = useState<number | undefined>(currentFilters.minPrice);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(currentFilters.maxPrice);
  const [sortBy, setSortBy] = useState<FilterOptions['sortBy']>(currentFilters.sortBy);
  const [inStock, setInStock] = useState<boolean>(currentFilters.inStock || false);
  
  // Expandable sections
  const [categoryExpanded, setCategoryExpanded] = useState(true);
  const [priceExpanded, setPriceExpanded] = useState(true);
  const [sortExpanded, setSortExpanded] = useState(true);

  const priceRanges = [
    { label: 'Under ৳500', min: 0, max: 500 },
    { label: '৳500 - ৳1000', min: 500, max: 1000 },
    { label: '৳1000 - ৳2000', min: 1000, max: 2000 },
    { label: '৳2000 - ৳5000', min: 2000, max: 5000 },
    { label: 'Above ৳5000', min: 5000, max: undefined },
  ];

  const sortOptions = [
    { label: 'Price: Low to High', value: 'price-asc' as const },
    { label: 'Price: High to Low', value: 'price-desc' as const },
    { label: 'Highest Rated', value: 'rating' as const },
    { label: 'Newest First', value: 'newest' as const },
  ];

  const handleApply = () => {
    onApplyFilters({
      category: selectedCategory,
      minPrice,
      maxPrice,
      sortBy,
      inStock,
    });
  };

  const handleClear = () => {
    setSelectedCategory(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSortBy(undefined);
    setInStock(false);
    onClearFilters();
  };

  const hasActiveFilters = selectedCategory || minPrice !== undefined || maxPrice !== undefined || sortBy || inStock;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Filters</Text>
        {hasActiveFilters && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <X size={18} color="#EF4444" />
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setCategoryExpanded(!categoryExpanded)}
        >
          <Text style={styles.sectionTitle}>Category</Text>
          {categoryExpanded ? (
            <ChevronUp size={20} color="#6B7280" />
          ) : (
            <ChevronDown size={20} color="#6B7280" />
          )}
        </TouchableOpacity>

        {categoryExpanded && (
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                !selectedCategory && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(undefined)}
            >
              <Text style={[
                styles.categoryText,
                !selectedCategory && styles.categoryTextActive
              ]}>
                All Categories
              </Text>
            </TouchableOpacity>

            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Price Range Filter */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setPriceExpanded(!priceExpanded)}
        >
          <Text style={styles.sectionTitle}>Price Range</Text>
          {priceExpanded ? (
            <ChevronUp size={20} color="#6B7280" />
          ) : (
            <ChevronDown size={20} color="#6B7280" />
          )}
        </TouchableOpacity>

        {priceExpanded && (
          <View style={styles.sectionContent}>
            {priceRanges.map((range, index) => {
              const isSelected = minPrice === range.min && maxPrice === range.max;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.priceButton,
                    isSelected && styles.priceButtonActive
                  ]}
                  onPress={() => {
                    setMinPrice(range.min);
                    setMaxPrice(range.max);
                  }}
                >
                  <Text style={[
                    styles.priceText,
                    isSelected && styles.priceTextActive
                  ]}>
                    {range.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Sort By */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setSortExpanded(!sortExpanded)}
        >
          <Text style={styles.sectionTitle}>Sort By</Text>
          {sortExpanded ? (
            <ChevronUp size={20} color="#6B7280" />
          ) : (
            <ChevronDown size={20} color="#6B7280" />
          )}
        </TouchableOpacity>

        {sortExpanded && (
          <View style={styles.sectionContent}>
            {sortOptions.map((option) => {
              const isSelected = sortBy === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortButton,
                    isSelected && styles.sortButtonActive
                  ]}
                  onPress={() => setSortBy(option.value)}
                >
                  <Text style={[
                    styles.sortText,
                    isSelected && styles.sortTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Stock Availability */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setInStock(!inStock)}
        >
          <View style={[styles.checkbox, inStock && styles.checkboxActive]}>
            {inStock && <View style={styles.checkboxInner} />}
          </View>
          <Text style={styles.checkboxLabel}>In Stock Only</Text>
        </TouchableOpacity>
      </View>

      {/* Apply Button */}
      <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
        <Text style={styles.applyButtonText}>Apply Filters</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionContent: {
    marginTop: 12,
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  categoryButtonActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  categoryText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  priceButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  priceButtonActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  priceText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  priceTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sortButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  sortButtonActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  sortText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  sortTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
