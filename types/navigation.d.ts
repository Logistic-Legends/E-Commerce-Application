import { NavigatorScreenParams } from '@react-navigation/native';

type RootStackParamList = {
  '/(tabs)': NavigatorScreenParams<TabParamList>;
  '/(auth)': NavigatorScreenParams<AuthParamList>;
  '/(admin)': NavigatorScreenParams<AdminStackParamList>;
  '/(admin)/settings': NavigatorScreenParams<AdminSettingsParamList>;
  '/(admin)/settings/general': undefined;
  '/(admin)/settings/users': undefined;
  '/(admin)/settings/products': undefined;
  '/(admin)/settings/orders': undefined;
  '/(admin)/settings/notifications': undefined;
  '/(admin)/settings/integrations': undefined;
  '/(admin)/settings/theme': undefined;
  '/(admin)/settings/security': undefined;
  '/(admin)/settings/advanced': undefined;
};

type TabParamList = {
  home: undefined;
  categories: undefined;
  cart: undefined;
  wishlist: undefined;
  profile: undefined;
};

type AuthParamList = {
  login: undefined;
  register: undefined;
  forgotPassword: undefined;
};

type AdminStackParamList = {
  index: undefined;
  products: undefined;
  orders: undefined;
  customers: undefined;
  settings: undefined;
  // Add other admin routes as needed
};

type AdminSettingsParamList = {
  index: undefined;
  general: undefined;
  users: undefined;
  products: undefined;
  orders: undefined;
  notifications: undefined;
  integrations: undefined;
  theme: undefined;
  security: undefined;
  advanced: undefined;
};

// This allows type checking for the useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type {
  RootStackParamList,
  TabParamList,
  AuthParamList,
  AdminStackParamList,
  AdminSettingsParamList
};
