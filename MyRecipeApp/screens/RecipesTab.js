import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';

const RecipesTab = ({
  recipes,
  onAddRecipe,
  onSelectRecipe,
  searchQuery,
  setSearchQuery,
}) => {
  const [sortBy, setSortBy] = useState('title-asc');

  const filteredAndSortedRecipes = React.useMemo(() => {
    let filtered = recipes;

    // Filter by search
    if (searchQuery.trim()) {
      filtered = recipes.filter(
        (recipe) =>
          recipe.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recipe.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    const sorted = [...filtered];
    if (sortBy === 'title-asc') {
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'title-desc') {
      sorted.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    } else if (sortBy === 'date-new') {
      sorted.sort((a, b) => (b.id || 0) - (a.id || 0));
    } else if (sortBy === 'date-old') {
      sorted.sort((a, b) => (a.id || 0) - (b.id || 0));
    }

    return sorted;
  }, [recipes, searchQuery, sortBy]);

  const renderRecipeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => onSelectRecipe(item)}
    >
      <View style={styles.recipeCardContent}>
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {item.title || 'Untitled Recipe'}
        </Text>
        <View style={styles.recipeMetaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{item.category || 'Uncategorized'}</Text>
          </View>
          {item.prepTime && (
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>⏱ {item.prepTime} min</Text>
            </View>
          )}
        </View>
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 2).map((tag, idx) => (
              <View key={idx} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <Text style={styles.cardArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Recipes</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddRecipe}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Sort Buttons */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === 'title-asc' && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy('title-asc')}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortBy === 'title-asc' && styles.sortButtonTextActive,
            ]}
          >
            A-Z
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === 'date-new' && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy('date-new')}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortBy === 'date-new' && styles.sortButtonTextActive,
            ]}
          >
            Newest
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recipe List */}
      {filteredAndSortedRecipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyText}>No recipes yet</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={onAddRecipe}
          >
            <Text style={styles.emptyButtonText}>Create your first recipe</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedRecipes}
          renderItem={renderRecipeItem}
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
  addButton: {
    backgroundColor: colors.primaryWarm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
    ...shadows.soft,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  sortButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.small,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sortButtonActive: {
    backgroundColor: colors.primaryWarm,
    borderColor: colors.primaryWarm,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  recipeCard: {
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
  recipeCardContent: {
    flex: 1,
  },
  recipeTitle: {
    ...typography.h5,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  metaItem: {
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.primaryWarm,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tagBadge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.small,
  },
  tagText: {
    fontSize: 11,
    color: colors.accentDeep,
    fontWeight: '500',
  },
  cardArrow: {
    fontSize: 24,
    color: colors.primaryWarm,
    marginLeft: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.lg,
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
    marginBottom: spacing.lg,
  },
  emptyButton: {
    backgroundColor: colors.primaryWarm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
    ...shadows.soft,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default RecipesTab;
