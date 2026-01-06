import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/theme';

const TopTabBar = ({ activeTab, onTabChange }) => {
  const tabs = [
    { name: 'Recipes', icon: 'book', key: 'home' },
    { name: 'Meal Plan', icon: 'calendar', key: 'mealPlan' },
    { name: 'Shopping', icon: 'cart', key: 'shopping' },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon}
              size={28}
              color={isActive ? colors.primaryWarm : colors.textTertiary}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgPrimary,
    borderBottomColor: colors.primaryWarm,
    borderBottomWidth: 2,
    paddingBottom: spacing.md,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
  },
  tabButton: {
    padding: spacing.sm,
    borderRadius: 8,
    opacity: 0.6,
  },
  tabButtonActive: {
    opacity: 1,
    backgroundColor: colors.overlayWarm,
  },
});

export default TopTabBar;

