/**
 * CostMonitoringScreen.js
 * Issue #115: Backend Deployment & Cost Monitoring
 * 
 * Displays real-time API usage costs, budget tracking, and alerts
 * Helps monitor spending on transcription and recipe extraction services
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LineChart, BarChart, ProgressChart } from 'react-native-chart-kit';
import axios from 'axios';

const SCREEN_WIDTH = Dimensions.get('window').width;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

const CostMonitoringScreen = () => {
  const [costData, setCostData] = useState(null);
  const [costHistory, setCostHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch cost data from backend
  const fetchCostData = useCallback(async () => {
    try {
      setError(null);
      
      // Get current cost summary
      const summaryResponse = await axios.get(`${API_BASE_URL}/cost/stats`);
      setCostData(summaryResponse.data.costSummary);

      // Get cost history (last 30 days)
      const historyResponse = await axios.get(`${API_BASE_URL}/cost/log?limit=100`);
      setCostHistory(historyResponse.data.costLog || []);
      
      setLoading(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch cost data';
      setError(errorMsg);
      setLoading(false);
      
      // Show alert if cost limits exceeded
      if (err.response?.status === 429) {
        Alert.alert('⚠️ Budget Limit Exceeded', 'Daily or monthly cost limit has been reached');
      }
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCostData().then(() => setRefreshing(false));
  }, [fetchCostData]);

  useEffect(() => {
    fetchCostData();
    const interval = setInterval(fetchCostData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchCostData]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading cost data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!costData) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>No cost data available</Text>
      </View>
    );
  }

  const {
    totalCost = 0,
    thisMonth = {},
    byService = {},
    estimatedMonthlyBudget = 1000,
    percentageUsed = 0,
  } = costData;

  // Determine alert level
  const getAlertLevel = (percentage) => {
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    return 'safe';
  };

  const alertLevel = getAlertLevel(percentageUsed);
  const alertColor = alertLevel === 'critical' ? '#ff4444' : alertLevel === 'warning' ? '#ffaa00' : '#00cc00';

  // Prepare chart data
  const chartData = {
    labels: Object.keys(byService),
    datasets: [
      {
        data: Object.values(byService),
        fill: true,
        strokeWidth: 2,
        color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
      },
    ],
  };

  const progressData = {
    labels: ['Cost Usage'],
    data: [percentageUsed / 100],
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💰 Cost Monitoring</Text>
        <Text style={styles.subtitle}>API Usage & Budget Tracking</Text>
      </View>

      {/* Alert Banner */}
      {alertLevel !== 'safe' && (
        <View style={[styles.alertBanner, { backgroundColor: alertColor }]}>
          <Text style={styles.alertText}>
            {alertLevel === 'critical'
              ? '⛔ CRITICAL: Budget limit approaching!'
              : '⚠️ WARNING: High spending detected'}
          </Text>
          <Text style={styles.alertSubtext}>
            {percentageUsed.toFixed(1)}% of monthly budget used
          </Text>
        </View>
      )}

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Cost</Text>
          <Text style={styles.totalCost}>${totalCost.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>This Month</Text>
          <Text style={styles.monthCost}>${(thisMonth.cost || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Daily Extractions</Text>
          <Text style={styles.statsValue}>{thisMonth.extractionsCount || 0}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Average Cost</Text>
          <Text style={styles.avgCost}>${(thisMonth.averageCost || 0).toFixed(2)}</Text>
        </View>
      </View>

      {/* Budget Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Budget Status</Text>
        <View style={styles.progressContainer}>
          <Text style={styles.budgetText}>
            ${(thisMonth.cost || 0).toFixed(2)} / ${estimatedMonthlyBudget.toFixed(2)}
          </Text>
          <ProgressChart
            data={progressData}
            width={SCREEN_WIDTH - 40}
            height={220}
            strokeWidth={16}
            radius={32}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#f5f5f5',
              backgroundGradientTo: '#f5f5f5',
              color: (opacity = 1) => `rgba(${alertColor}, ${opacity})`,
              strokeWidth: 2,
            }}
            hideLegend={true}
          />
          <Text style={styles.percentageText}>
            {percentageUsed.toFixed(1)}% Used
          </Text>
        </View>
      </View>

      {/* Cost by Service */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 Cost by Service</Text>
        <View style={styles.servicesList}>
          {Object.entries(byService).length > 0 ? (
            Object.entries(byService).map(([service, cost]) => (
              <View key={service} style={styles.serviceItem}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{formatServiceName(service)}</Text>
                  <Text style={styles.serviceCost}>${cost.toFixed(2)}</Text>
                </View>
                <View style={styles.serviceBar}>
                  <View
                    style={[
                      styles.serviceBarFill,
                      {
                        width: `${(cost / (thisMonth.cost || 1)) * 100}%`,
                        backgroundColor: getServiceColor(service),
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No cost data for this period</Text>
          )}
        </View>
      </View>

      {/* Cost Limits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Budget Limits</Text>
        <View style={styles.limitsContainer}>
          <View style={styles.limitItem}>
            <Text style={styles.limitLabel}>Daily Limit</Text>
            <Text style={styles.limitValue}>$100.00</Text>
            <Text style={styles.limitStatus}>🟢 Safe</Text>
          </View>
          <View style={styles.limitItem}>
            <Text style={styles.limitLabel}>Monthly Limit</Text>
            <Text style={styles.limitValue}>$1000.00</Text>
            <Text
              style={[
                styles.limitStatus,
                { color: alertColor },
              ]}
            >
              {alertLevel === 'safe' ? '🟢 Safe' : alertLevel === 'warning' ? '🟡 Warning' : '🔴 Critical'}
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Recent Activity</Text>
        <View style={styles.activityList}>
          {costHistory.length > 0 ? (
            costHistory.slice(0, 10).map((entry, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityType}>{entry.type || 'API Call'}</Text>
                  <Text style={styles.activityTime}>{new Date(entry.timestamp).toLocaleString()}</Text>
                </View>
                <Text style={styles.activityCost}>${entry.cost.toFixed(4)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No recent activity</Text>
          )}
        </View>
      </View>

      {/* Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Tips to Reduce Costs</Text>
        <View style={styles.tipsList}>
          <TipItem text="Use GitHub Copilot account for free transcription API access" />
          <TipItem text="Enable caching to avoid re-transcribing the same videos" />
          <TipItem text="Optimize video resolution before uploading" />
          <TipItem text="Batch recipe extractions during off-peak hours" />
        </View>
      </View>

      {/* Last Updated */}
      <View style={styles.footer}>
        <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleString()}</Text>
      </View>
    </ScrollView>
  );
};

// Helper Components
const TipItem = ({ text }) => (
  <View style={styles.tipItem}>
    <Text style={styles.tipBullet}>•</Text>
    <Text style={styles.tipText}>{text}</Text>
  </View>
);

// Helper Functions
const formatServiceName = (service) => {
  return service.charAt(0).toUpperCase() + service.slice(1).replace(/_/g, ' ');
};

const getServiceColor = (service) => {
  const colors = {
    transcription: '#4A90E2',
    recipeExtraction: '#7ED321',
    videoDownload: '#F5A623',
    default: '#9013FE',
  };
  return colors[service] || colors.default;
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#2c3e50',
    padding: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#bdc3c7',
  },
  alertBanner: {
    margin: 15,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#fff',
  },
  alertText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  alertSubtext: {
    fontSize: 12,
    color: '#fff',
    marginTop: 5,
    opacity: 0.9,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  totalCost: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  monthCost: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  statsValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3498db',
  },
  avgCost: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 10,
  },
  section: {
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  progressContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  budgetText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  percentageText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 10,
  },
  servicesList: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
  },
  serviceItem: {
    marginBottom: 15,
  },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  serviceCost: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  serviceBar: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  serviceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  limitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  limitItem: {
    backgroundColor: '#fff',
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  limitLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  limitValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  limitStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#27ae60',
  },
  activityList: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  activityInfo: {
    flex: 1,
  },
  activityType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  activityTime: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 3,
  },
  activityCost: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  tipsList: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tipBullet: {
    fontSize: 16,
    color: '#27ae60',
    marginRight: 10,
    fontWeight: 'bold',
  },
  tipText: {
    fontSize: 13,
    color: '#2e7d32',
    flex: 1,
  },
  footer: {
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#95a5a6',
  },
  noDataText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#7f8c8d',
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});

export default CostMonitoringScreen;
