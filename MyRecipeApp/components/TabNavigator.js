import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';

const TabNavigator = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'recipes', label: 'Recipes', icon: '📖' },
    { id: 'mealPlan', label: 'Meal Plan', icon: '📅' },
    { id: 'shopping', label: 'Shopping', icon: '🛒' },
  ];

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && styles.activeTab,
          ]}
          onPress={() => onTabChange(tab.id)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === tab.id && styles.activeTabLabel,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F0',
    borderTopWidth: 1,
    borderTopColor: '#EDD5C4',
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  activeTab: {
    borderTopWidth: 3,
    borderTopColor: '#D4845C',
    marginTop: -3,
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#D4845C',
    fontWeight: '700',
  },
});

export default TabNavigator;
