declare module '@react-native-picker/picker' {
  import * as React from 'react';
  import { ViewStyle, StyleProp, ColorValue } from 'react-native';

  export interface PickerItemProps<T = any> {
    label: string;
    value: T;
    color?: ColorValue;
    testID?: string;
  }

  export interface PickerProps<T = any> {
    style?: StyleProp<ViewStyle>;
    selectedValue: T;
    onValueChange: (itemValue: T, itemIndex: number) => void;
    enabled?: boolean;
    mode?: 'dialog' | 'dropdown';
    itemStyle?: StyleProp<ViewStyle>;
    prompt?: string;
    testID?: string;
  }

  export class Picker<T = any> extends React.Component<PickerProps<T>> {
    static Item: React.ComponentType<PickerItemProps<T>>;
    static MODE_DIALOG: 'dialog';
    static MODE_DROPDOWN: 'dropdown';
  }

  export const PickerItem: React.ComponentType<PickerItemProps>;

  export default Picker;
}
