import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';

interface InventoryItem {
  productId: string;
  availableStock: number;
  lowStockThreshold: number;
  reservedStock: number; // Stock in customer carts
  lastUpdated: string;
  reorderPoint: number;
  reorderQuantity: number;
  incomingStock: number; // Expected stock from orders
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

interface InventoryUpdate {
  productId: string;
  quantity: number;
  type: 'PURCHASE' | 'RESTOCK' | 'RESERVE' | 'RELEASE' | 'ADJUST';
}

interface InventoryContextType {
  inventory: { [productId: string]: InventoryItem };
  updateStock: (update: InventoryUpdate) => void;
  checkLowStock: (productId: string) => boolean;
  getAvailableStock: (productId: string) => number;
  setLowStockThreshold: (productId: string, threshold: number) => void;
  setReorderPoint: (productId: string, point: number, quantity: number) => void;
  addProductToInventory: (productId: string, initialStock: number) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<{ [productId: string]: InventoryItem }>({});

  // Check for low stock levels periodically
  useEffect(() => {
    const interval = setInterval(() => {
      Object.entries(inventory).forEach(([productId, item]) => {
        if (item.availableStock <= item.lowStockThreshold && item.status !== 'LOW_STOCK') {
          // Alert about low stock
          Alert.alert(
            'Low Stock Alert',
            `Product ID: ${productId} is running low on stock (Current: ${item.availableStock})`,
            [
              { text: 'View', onPress: () => {/* Navigate to product details */} },
              { text: 'OK', style: 'cancel' }
            ]
          );

          // Update status
          setInventory(prev => ({
            ...prev,
            [productId]: {
              ...prev[productId],
              status: 'LOW_STOCK'
            }
          }));
        }

        // Check for reorder point
        if (item.availableStock <= item.reorderPoint && item.incomingStock === 0) {
          Alert.alert(
            'Reorder Point Reached',
            `Product ID: ${productId} has reached its reorder point. Suggested order quantity: ${item.reorderQuantity}`,
            [
              { text: 'Order Now', onPress: () => {/* Navigate to ordering system */} },
              { text: 'Later', style: 'cancel' }
            ]
          );
        }
      });
    }, 300000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [inventory]);

  const updateStock = (update: InventoryUpdate) => {
    setInventory(prev => {
      const item = prev[update.productId];
      if (!item) return prev;

      let newStock = item.availableStock;
      let newReserved = item.reservedStock;

      switch (update.type) {
        case 'PURCHASE':
          newStock -= update.quantity;
          newReserved -= update.quantity;
          break;
        case 'RESTOCK':
          newStock += update.quantity;
          break;
        case 'RESERVE':
          newReserved += update.quantity;
          break;
        case 'RELEASE':
          newReserved -= update.quantity;
          break;
        case 'ADJUST':
          newStock = update.quantity;
          break;
      }

      // Determine new status
      let newStatus: InventoryItem['status'] = 'IN_STOCK';
      if (newStock <= 0) {
        newStatus = 'OUT_OF_STOCK';
      } else if (newStock <= item.lowStockThreshold) {
        newStatus = 'LOW_STOCK';
      }

      return {
        ...prev,
        [update.productId]: {
          ...item,
          availableStock: newStock,
          reservedStock: newReserved,
          status: newStatus,
          lastUpdated: new Date().toISOString()
        }
      };
    });
  };

  const checkLowStock = (productId: string) => {
    const item = inventory[productId];
    if (!item) return false;
    return item.availableStock <= item.lowStockThreshold;
  };

  const getAvailableStock = (productId: string) => {
    const item = inventory[productId];
    if (!item) return 0;
    return item.availableStock - item.reservedStock;
  };

  const setLowStockThreshold = (productId: string, threshold: number) => {
    setInventory(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        lowStockThreshold: threshold
      }
    }));
  };

  const setReorderPoint = (productId: string, point: number, quantity: number) => {
    setInventory(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        reorderPoint: point,
        reorderQuantity: quantity
      }
    }));
  };

  const addProductToInventory = (productId: string, initialStock: number) => {
    setInventory(prev => ({
      ...prev,
      [productId]: {
        productId,
        availableStock: initialStock,
        lowStockThreshold: Math.ceil(initialStock * 0.2), // Default 20% of initial stock
        reservedStock: 0,
        lastUpdated: new Date().toISOString(),
        reorderPoint: Math.ceil(initialStock * 0.3), // Default 30% of initial stock
        reorderQuantity: initialStock, // Default to initial stock amount
        incomingStock: 0,
        status: 'IN_STOCK'
      }
    }));
  };

  return (
    <InventoryContext.Provider value={{
      inventory,
      updateStock,
      checkLowStock,
      getAvailableStock,
      setLowStockThreshold,
      setReorderPoint,
      addProductToInventory
    }}>
      {children}
    </InventoryContext.Provider>
  );
};
