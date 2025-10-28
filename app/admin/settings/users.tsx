import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { CustomPicker } from '@/components/CustomPicker';

type RoleId = 'admin' | 'manager' | 'editor' | 'customer';
type PermissionId = 'manage_products' | 'manage_orders' | 'manage_customers' | 'manage_promotions' | 'view_reports' | 'manage_settings';

type RolePermissions = {
  [key in RoleId]: PermissionId[];
};

const roles = [
  { id: 'admin', name: 'Administrator' },
  { id: 'manager', name: 'Manager' },
  { id: 'editor', name: 'Editor' },
  { id: 'customer', name: 'Customer' },
];

const permissions = [
  { id: 'manage_products', label: 'Manage Products' },
  { id: 'manage_orders', label: 'Manage Orders' },
  { id: 'manage_customers', label: 'Manage Customers' },
  { id: 'manage_promotions', label: 'Manage Promotions' },
  { id: 'view_reports', label: 'View Reports' },
  { id: 'manage_settings', label: 'Manage Settings' },
];

export default function UserRoleSettings() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState(roles[0].id);
  const [rolePermissions, setRolePermissions] = useState<Record<RoleId, PermissionId[]>>({
    admin: ['manage_products', 'manage_orders', 'manage_customers', 'manage_promotions', 'view_reports', 'manage_settings'],
    manager: ['manage_products', 'manage_orders', 'view_reports'],
    editor: ['manage_products'],
    customer: [],
  });
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'customer',
  });
  const [activeTab, setActiveTab] = useState('roles');

  const togglePermission = (permissionId: PermissionId) => {
    setRolePermissions(prev => ({
      ...prev,
      [selectedRole]: prev[selectedRole as RoleId].includes(permissionId)
        ? prev[selectedRole as RoleId].filter((id: PermissionId) => id !== permissionId)
        : [...prev[selectedRole as RoleId], permissionId],
    }));
  };

  const handleAddUser = () => {
    // TODO: Implement add user logic
    console.log('Adding new user:', newUser);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'roles' && styles.activeTab]} 
          onPress={() => setActiveTab('roles')}
        >
          <Text style={[styles.tabText, activeTab === 'roles' && styles.activeTabText]}>Roles & Permissions</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]} 
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Manage Users</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'roles' ? (
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Role Permissions</Text>
            <View style={styles.pickerContainer}>
              <CustomPicker
                items={roles.map(role => ({ label: role.name, value: role.id }))}
                selectedValue={selectedRole}
                onValueChange={setSelectedRole}
                style={styles.picker}
              />
            </View>

            <View style={styles.permissionsList}>
              <Text style={styles.permissionsTitle}>Permissions for {roles.find(r => r.id === selectedRole)?.name}</Text>
              {permissions.map(permission => {
                const permissionId = permission.id as PermissionId;
                return (
                  <View key={permission.id} style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>{permission.label}</Text>
                    <Switch
                      value={rolePermissions[selectedRole as RoleId]?.includes(permissionId)}
                      onValueChange={() => togglePermission(permissionId)}
                      trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add New User</Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={newUser.name}
                onChangeText={(text) => setNewUser({...newUser, name: text})}
                placeholder="John Doe"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={newUser.email}
                onChangeText={(text) => setNewUser({...newUser, email: text})}
                placeholder="user@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.pickerContainer}>
                <CustomPicker
                items={roles
                  .filter(r => r.id !== 'admin')
                  .map(role => ({
                    label: role.name,
                    value: role.id
                  }))}
                selectedValue={newUser.role}
                onValueChange={(value) => setNewUser({...newUser, role: value})}
                style={styles.picker}
              />
              </View>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={handleAddUser}>
              <Text style={styles.addButtonText}>Add User</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User List</Text>
            <View style={styles.userList}>
              <Text style={styles.emptyState}>No users found. Add a new user to get started.</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
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
  pickerContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 16,
  },
  picker: {
    width: '100%',
  },
  permissionsList: {
    marginTop: 8,
  },
  permissionsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#4B5563',
    marginBottom: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  permissionLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
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
  addButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  userList: {
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    padding: 16,
  },
});
