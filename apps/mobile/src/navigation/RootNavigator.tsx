import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CalendarScreen } from '../screens/CalendarScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/i18n/I18nProvider';
import { colors, fonts } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.foam,
    card: colors.paper,
    text: colors.ink,
    border: colors.line,
    primary: colors.jade700,
  },
};

function MainTabs() {
  const { messages, locale } = useI18n();

  return (
    <Tab.Navigator
      key={locale}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.jade800,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: fonts.bodySemi,
          fontSize: 12,
        },
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
          paddingTop: 4,
          height: 58,
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: messages.nav.today }} />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: messages.nav.calendar }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: messages.nav.settings }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { ready } = useI18n();

  if (isLoading || !ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.foam }}>
        <ActivityIndicator size="large" color={colors.jade700} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.foam } }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
