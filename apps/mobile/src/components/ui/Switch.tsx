import React from 'react';
import { Switch as RNSwitch } from 'react-native';

export interface SwitchProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}

const Switch: React.FC<SwitchProps> = ({ value, onValueChange, disabled }) => {
  return <RNSwitch value={value} onValueChange={onValueChange} disabled={disabled} />;
};

export default Switch;

