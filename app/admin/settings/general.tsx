import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';

export default function GeneralSettings() {
  const router = useRouter();
  const [storeInfo, setStoreInfo] = useState({
    name: 'My Awesome Store',
    email: 'contact@mystore.com',
    phone: '+8801XXXXXXXXX',
    address: '123 Store St, City, Country',
  });
  const [currency, setCurrency] = useState('BDT');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('Asia/Dhaka');
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxRate, setTaxRate] = useState('15');
  const [taxInclusive, setTaxInclusive] = useState(false);

  const handleSave = () => {
    // TODO: Implement save logic
    console.log('Saving settings...');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Store Information</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Store Name</Text>
          <TextInput
            style={styles.input}
            value={storeInfo.name}
            onChangeText={(text) => setStoreInfo({...storeInfo, name: text})}
            placeholder="Store Name"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={storeInfo.email}
            onChangeText={(text) => setStoreInfo({...storeInfo, email: text})}
            placeholder="contact@example.com"
            keyboardType="email-address"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={storeInfo.phone}
            onChangeText={(text) => setStoreInfo({...storeInfo, phone: text})}
            placeholder="+8801XXXXXXXXX"
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={storeInfo.address}
            onChangeText={(text) => setStoreInfo({...storeInfo, address: text})}
            placeholder="Store Address"
            multiline
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Currency Setup</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Default Currency</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={currency}
              onValueChange={(itemValue) => setCurrency(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Bangladeshi Taka (BDT)" value="BDT" />
              <Picker.Item label="US Dollar (USD)" value="USD" />
              <Picker.Item label="Euro (EUR)" value="EUR" />
              <Picker.Item label="British Pound (GBP)" value="GBP" />
              <Picker.Item label="Indian Rupee (INR)" value="INR" />
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language & Timezone</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Language</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={language}
              onValueChange={(itemValue) => setLanguage(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="English" value="en" />
              <Picker.Item label="বাংলা" value="bn" />
              <Picker.Item label="हिंदी" value="hi" />
              <Picker.Item label="Español" value="es" />
            </Picker>
          </View>
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Timezone</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={timezone}
              onValueChange={(itemValue) => setTimezone(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Asia/Dhaka (GMT+6)" value="Asia/Dhaka" />
              <Picker.Item label="UTC (GMT+0)" value="UTC" />
              <Picker.Item label="America/New_York (GMT-5)" value="America/New_York" />
              <Picker.Item label="Europe/London (GMT+0/+1)" value="Europe/London" />
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tax / VAT Settings</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.label}>Enable Tax/VAT</Text>
          <Switch
            value={taxEnabled}
            onValueChange={setTaxEnabled}
            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
            thumbColor="#FFFFFF"
          />
        </View>
        {taxEnabled && (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tax Rate (%)</Text>
              <TextInput
                style={styles.input}
                value={taxRate}
                onChangeText={setTaxRate}
                placeholder="15"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.switchContainer}>
              <View>
                <Text style={styles.label}>Prices Include Tax</Text>
                <Text style={styles.helperText}>
                  When enabled, all entered product prices will be considered tax-inclusive
                </Text>
              </View>
              <Switch
                value={taxInclusive}
                onValueChange={setTaxInclusive}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
    maxWidth: '85%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    position: 'sticky',
    bottom: 0,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});
