import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Database, Info } from 'lucide-react-native';
import { useState } from 'react';

export default function DataUsage() {
  const router = useRouter();
  const [dataSaver, setDataSaver] = useState(false);
  const [autoPlayVideos, setAutoPlayVideos] = useState(true);
  const [syncOnWifiOnly, setSyncOnWifiOnly] = useState(true);
  const [usageStats, setUsageStats] = useState({
    appUsage: '1.2 GB',
    cache: '345 MB',
    lastUpdated: 'Today, 10:30 AM'
  });

  const clearCache = () => {
    // TODO: Implement cache clearing logic
    setUsageStats(prev => ({ ...prev, cache: '0 MB' }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Data Usage</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Saver</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Data Saver</Text>
              <Text style={styles.settingDescription}>Reduce data usage by loading lower quality content</Text>
            </View>
            <Switch
              value={dataSaver}
              onValueChange={setDataSaver}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Auto-play videos</Text>
              <Text style={styles.settingDescription}>Play videos automatically when using mobile data</Text>
            </View>
            <Switch
              value={autoPlayVideos}
              onValueChange={setAutoPlayVideos}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
              disabled={dataSaver}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Sync on Wi-Fi only</Text>
              <Text style={styles.settingDescription}>Only sync data when connected to Wi-Fi</Text>
            </View>
            <Switch
              value={syncOnWifiOnly}
              onValueChange={setSyncOnWifiOnly}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>
          <View style={styles.storageItem}>
            <View style={styles.storageInfo}>
              <Text style={styles.storageLabel}>App Usage</Text>
              <Text style={styles.storageValue}>{usageStats.appUsage}</Text>
            </View>
            <View style={[styles.storageBar, { width: '60%' }]}>
              <View style={[styles.storageProgress, { width: '70%' }]} />
            </View>
          </View>

          <View style={styles.storageItem}>
            <View style={styles.storageInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.storageLabel}>Cache</Text>
                <TouchableOpacity onPress={clearCache} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.storageValue}>{usageStats.cache}</Text>
            </View>
            <View style={styles.storageBar}>
              <View style={[styles.storageProgress, { width: '30%' }]} />
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Info size={20} color="#3B82F6" style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>
            Last updated: {usageStats.lastUpdated}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  storageItem: {
    marginBottom: 16,
  },
  storageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  storageLabel: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  storageValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  storageBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  storageProgress: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  clearButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  clearButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#1E40AF',
  },
});
