import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useProducts } from '@/context/ProductContext';
import { ArrowLeft, Heart, ShoppingCart, Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const { getProductById } = useProducts();
  const product = getProductById(id as string);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const router = useRouter();

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Product not found</Text>
      </SafeAreaView>
    );
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      color: selectedColor,
      size: selectedSize,
    });
    router.push('/(tabs)/cart');
  };

  const handleWishlistToggle = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        category: product.category
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleWishlistToggle} style={styles.wishlistButton}>
          <Heart 
            size={24} 
            color={isInWishlist(product.id) ? "#EF4444" : "#6B7280"}
            fill={isInWishlist(product.id) ? "#EF4444" : "transparent"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.images[selectedImageIndex] }} 
            style={styles.mainImage} 
          />
          {product.images.length > 1 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.thumbnailContainer}
            >
              {product.images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImageIndex(index)}
                  style={[
                    styles.thumbnail,
                    selectedImageIndex === index && styles.selectedThumbnail
                  ]}
                >
                  <Image source={{ uri: image }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.productDetails}>
          <View style={styles.titleSection}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={styles.ratingContainer}>
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.rating}>{product.rating}</Text>
              <Text style={styles.reviews}>({product.reviews} reviews)</Text>
            </View>
          </View>

          <View style={styles.priceSection}>
            {product.discountPrice ? (
              <>
                <Text style={styles.price}>৳{product.discountPrice}</Text>
                <Text style={styles.originalPrice}>৳{product.regularPrice || product.originalPrice || product.price}</Text>
                {product.discountPercentage && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{product.discountPercentage}% OFF</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.price}>৳{product.regularPrice || product.price}</Text>
            )}
          </View>

          {/* Stock Information */}
          <View style={styles.stockSection}>
            {product.totalStock > 0 ? (
              <Text style={styles.inStockText}>
                ✅ In Stock ({product.totalStock} available)
              </Text>
            ) : (
              <Text style={styles.outOfStockText}>
                ❌ Out of Stock
              </Text>
            )}
          </View>

          {(product.colors || product.availableColors) && (product.colors?.length > 0 || product.availableColors?.length > 0) && (
            <View style={styles.optionSection}>
              <Text style={styles.optionTitle}>Available Colors</Text>
              <View style={styles.colorOptions}>
                {(product.availableColors || product.colors || []).map((color) => {
                  const colorVariant = product.variants?.find(v => 
                    (v.name === 'Color' && v.value === color) || v.color === color
                  );
                  const stock = colorVariant?.stock || product.totalStock || 0;
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        selectedColor === color && styles.selectedColorOption,
                        stock === 0 && styles.outOfStockOption
                      ]}
                      onPress={() => stock > 0 && setSelectedColor(color)}
                      disabled={stock === 0}
                    >
                      <Text style={[
                        styles.colorText,
                        selectedColor === color && styles.selectedColorText,
                        stock === 0 && styles.outOfStockText
                      ]}>
                        {color}
                      </Text>
                      {stock > 0 && (
                        <Text style={styles.stockText}>
                          ({stock} left)
                        </Text>
                      )}
                      {stock === 0 && (
                        <Text style={styles.stockText}>
                          (Out of stock)
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {(product.sizes || product.availableSizes) && (product.sizes?.length > 0 || product.availableSizes?.length > 0) && (
            <View style={styles.optionSection}>
              <Text style={styles.optionTitle}>Available Sizes</Text>
              <View style={styles.sizeOptions}>
                {(product.availableSizes || product.sizes || []).map((size) => {
                  const sizeVariant = product.variants?.find(v => 
                    (v.name === 'Size' && v.value === size) || v.size === size
                  );
                  const stock = sizeVariant?.stock || product.totalStock || 0;
                  return (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.sizeOption,
                        selectedSize === size && styles.selectedSizeOption,
                        stock === 0 && styles.outOfStockOption
                      ]}
                      onPress={() => stock > 0 && setSelectedSize(size)}
                      disabled={stock === 0}
                    >
                      <Text style={[
                        styles.sizeText,
                        selectedSize === size && styles.selectedSizeText,
                        stock === 0 && styles.outOfStockText
                      ]}>
                        {size}
                      </Text>
                      {stock > 0 && (
                        <Text style={styles.stockText}>
                          ({stock} left)
                        </Text>
                      )}
                      {stock === 0 && (
                        <Text style={styles.stockText}>
                          (Out of stock)
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <ShoppingCart size={20} color="#FFFFFF" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  wishlistButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: '#F9FAFB',
  },
  mainImage: {
    width: width,
    height: width * 0.8,
    resizeMode: 'cover',
  },
  thumbnailContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  thumbnail: {
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedThumbnail: {
    borderColor: '#3B82F6',
  },
  thumbnailImage: {
    width: 60,
    height: 60,
    resizeMode: 'cover',
  },
  productDetails: {
    padding: 24,
  },
  titleSection: {
    marginBottom: 16,
  },
  productName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    lineHeight: 32,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 8,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#3B82F6',
  },
  originalPrice: {
    fontSize: 20,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginLeft: 12,
  },
  discountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  stockSection: {
    marginBottom: 24,
  },
  inStockText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  outOfStockText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
  },
  optionSection: {
    marginBottom: 24,
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  colorText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  selectedColorText: {
    color: '#3B82F6',
  },
  sizeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sizeOption: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 48,
    alignItems: 'center',
  },
  selectedSizeOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  sizeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  selectedSizeText: {
    color: '#3B82F6',
  },
  descriptionSection: {
    marginBottom: 32,
  },
  descriptionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 24,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addToCartButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  outOfStockOption: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
  outOfStockText: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  stockText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
});