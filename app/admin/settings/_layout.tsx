import { Stack, useNavigation } from 'expo-router';
import { TouchableOpacity, View, Text } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

export default function SettingsLayout() {
  const navigation = useNavigation();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1E40AF',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontFamily: 'Inter-SemiBold',
        },
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={{ marginLeft: 8 }}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Admin Settings',
          headerShown: true,
          headerLeft: () => null, // Hide back button on index
        }}
      />
      <Stack.Screen 
        name="general" 
        options={{
          title: 'General Settings',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="users" 
        options={{
          title: 'User & Role Management',
          headerBackTitle: 'Back',
        }}
      />
      {/* Add other settings screens here */}
    </Stack>
  );
}
