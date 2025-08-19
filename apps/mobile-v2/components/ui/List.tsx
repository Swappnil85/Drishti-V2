import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { useThemeContext } from '../../src/theme/ThemeProvider';

export type ListItem = {
  id: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export type ListProps = ViewProps & {
  items: ListItem[];
};

export const List = ({ items, style, ...rest }: ListProps) => {
  const { tokens } = useThemeContext();
  return (
    <View
      style={[
        {
          borderRadius: 12,
          borderWidth: 1,
          borderColor: tokens.border,
          overflow: 'hidden',
        },
        style,
      ]}
      {...rest}
    >
      {items.map((it, idx) => (
        <View
          key={it.id}
          style={{
            padding: 14,
            backgroundColor: tokens.bg,
            borderTopWidth: idx === 0 ? 0 : 1,
            borderTopColor: tokens.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text style={{ color: tokens.text, fontWeight: '600' }}>
              {it.title}
            </Text>
            {it.subtitle ? (
              <Text style={{ color: tokens.textSecondary, marginTop: 2 }}>
                {it.subtitle}
              </Text>
            ) : null}
          </View>
          {it.right ?? null}
        </View>
      ))}
    </View>
  );
};

export default List;
