import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import WeeklyMealPlanView from '../components/WeeklyMealPlanView';

const MealPlanTab = ({
  recipes,
  onMealSlotPress,
  onGenerateShoppingList,
  refreshTrigger,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meal Planner</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={onGenerateShoppingList}
        >
          <Text style={styles.generateButtonText}>📋 Shopping</Text>
        </TouchableOpacity>
      </View>

      {/* Meal Plan Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Plan your meals for the next two weeks. Tap any slot to add or change recipes.
          </Text>
        </View>

        <WeeklyMealPlanView
          recipes={recipes}
          onMealSlotPress={onMealSlotPress}
          onGenerateShoppingList={onGenerateShoppingList}
          refreshTrigger={refreshTrigger}
        />
      </ScrollView>
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
  generateButton: {
    backgroundColor: colors.primaryWarm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
    ...shadows.soft,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.overlayWarm,
    borderRadius: borderRadius.medium,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryWarm,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  infoText: {
    flex: 1,
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default MealPlanTab;
