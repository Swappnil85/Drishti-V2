import { Appearance } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import AccountsScreen from '../screens/AccountsScreen';
import PlanScreen from '../screens/PlanScreen';
import ScenariosScreen from '../screens/ScenariosScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { logEvent } from '../telemetry';

export type TabKey = 'home' | 'accounts' | 'plan' | 'scenarios' | 'settings';

const Tab = createBottomTabNavigator();

const RootNavigator = () => {
  const isDark = Appearance.getColorScheme() === 'dark';
  const navTheme = isDark ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        screenListeners={{
          tabPress: e => {
            const name = (e.target?.toString?.() || '').toLowerCase();
            // Fire telemetry per AC: nav_tab_click { tab }
            logEvent('nav_tab_click', { tab: name });
          },
        }}
      >
        <Tab.Screen name='Home' component={HomeScreen} />
        <Tab.Screen name='Accounts' component={AccountsScreen} />
        <Tab.Screen name='Plan' component={PlanScreen} />
        <Tab.Screen name='Scenarios' component={ScenariosScreen} />
        <Tab.Screen name='Settings' component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
