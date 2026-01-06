import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  CheckBox,
  Platform,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';

const ShoppingTab = ({
  shoppingList,
  onToggleItem,
  onRemoveItem,
  onClearList,
  onExportList,
}) => {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());

  const checkedCount = shoppingList.filter((item) => item.checked).length;
  const totalCount = shoppingList.length;

  const handleToggleSelect = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) return;
    
    Alert.alert(
      'Delete Items?',
      `Remove ${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => {
            selectedItems.forEach((itemId) => onRemoveItem(itemId));
            setSelectedItems(new Set());
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderShoppingItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.shoppingItem,
        selectMode && styles.shoppingItemSelect,
        item.checked && styles.shoppingItemChecked,
      ]}
      onPress={() => {
        if (selectMode) {
          handleToggleSelect(item.id || index);
        }
      }}
      onLongPress={() => {
        if (!selectMode) setSelectMode(true);
        handleToggleSelect(item.id || index);
      }}
    >
      {selectMode && (
        <View style={styles.checkboxContainer}>
          <View
            style={[
              styles.checkbox,
              selectedItems.has(item.id || index) && styles.checkboxChecked,
            ]}
          >
            {selectedItems.has(item.id || index) && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
        </View>
      )}

      {!selectMode && (
        <TouchableOpacity
          style={styles.checkButton}
          onPress={() => onToggleItem(item.id || index)}
        >
          <View
            style={[
              styles.checkCircle,
              item.checked && styles.checkCircleChecked,
            ]}
          >
            {item.checked && <Text style={styles.checkIcon}>✓</Text>}
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.itemContent}>
        <Text
          style={[
            styles.itemName,
            item.checked && styles.itemNameChecked,
          ]}
        >
          {item.ingredient || 'Unknown'}
        </Text>
        <Text style={styles.itemQuantity}>
          {item.quantity} {item.unit}
        </Text>
      </View>

      {!selectMode && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Remove Item?',
              `Remove "${item.ingredient || 'Unknown'}"?`,
              [
                { text: 'Cancel', onPress: () => {}, style: 'cancel' },
                {
                  text: 'Remove',
                  onPress: () => onRemoveItem(item.id || index),
                  style: 'destructive',
                },
              ]
            );
          }}
        >
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Shopping List</Text>
          <Text style={styles.headerSubtitle}>
            {checkedCount} of {totalCount} items
          </Text>
        </View>
        <View style={styles.headerActions}>
          {selectMode && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                setSelectMode(false);
                setSelectedItems(new Set());
              }}
            >
              <Text style={styles.headerButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          {selectMode && selectedItems.size > 0 && (
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.error }]}
              onPress={handleDeleteSelected}
            >
              <Text style={styles.headerButtonText}>Delete ({selectedItems.size})</Text>
            </TouchableOpacity>
          )}
          {!selectMode && totalCount > 0 && (
            <>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={onExportList}
              >
                <Text style={styles.headerButtonText}>📤</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.error }]}
                onPress={() => {
                  Alert.alert(
                    'Clear List?',
                    'Remove all items from shopping list?',
                    [
                      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
                      {
                        text: 'Clear',
                        onPress: onClearList,
                        style: 'destructive',
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.headerButtonText}>Clear</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* List */}
      {shoppingList.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Shopping list is empty</Text>
          <Text style={styles.emptySubtext}>
            Add items from your meal plan or create recipes
          </Text>
        </View>
      ) : (
        <FlatList
          data={shoppingList}
          renderItem={renderShoppingItem}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          contentContainerStyle={styles.listContent}
          scrollEventThrottle={16}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  headerButton: {
    backgroundColor: colors.primaryWarm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
    ...shadows.soft,
  },
  headerButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  shoppingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#fff',
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  shoppingItemSelect: {
    backgroundColor: colors.overlayWarm,
  },
  shoppingItemChecked: {
    backgroundColor: colors.bgSecondary,
  },
  checkboxContainer: {
    marginRight: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.small,
    borderWidth: 2,
    borderColor: colors.primaryWarm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primaryWarm,
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  checkButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.round,
    borderWidth: 2,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    ...typography.h5,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  itemNameChecked: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  itemQuantity: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: spacing.xs,
    marginLeft: spacing.md,
  },
  deleteIcon: {
    fontSize: 20,
    color: colors.error,
    fontWeight: '700',
  },
  listContent: {
    paddingVertical: spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.h4,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});

export default ShoppingTab;
