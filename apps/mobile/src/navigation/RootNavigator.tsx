import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CalendarScreen } from '../screens/CalendarScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { isOnboarded, OnboardingScreen } from '../screens/OnboardingScreen';
import { RecipesScreen } from '../screens/RecipesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/i18n/I18nProvider';
import { syncGrantedPushToken } from '../lib/push';
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

type TabIconName = 'sunny' | 'calendar' | 'restaurant' | 'settings';

function tabIcon(name: TabIconName) {
  return ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
    <Ionicons name={focused ? name : `${name}-outline`} size={size} color={color} />
  );
}

function MainTabs() {
  const { messages } = useI18n();
  const { api } = useAuth();

  useEffect(() => {
    syncGrantedPushToken(api).catch(() => undefined);
  }, [api]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.jade800,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: fonts.bodySemi,
          fontSize: 12,
        },
        // No fixed height: the navigator adds the bottom safe-area inset itself.
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: messages.nav.today, tabBarIcon: tabIcon('sunny') }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: messages.nav.calendar, tabBarIcon: tabIcon('calendar') }}
      />
      <Tab.Screen
        name="Recipes"
        component={RecipesScreen}
        options={{ title: messages.nav.recipes, tabBarIcon: tabIcon('restaurant') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: messages.nav.settings, tabBarIcon: tabIcon('settings') }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { ready } = useI18n();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setOnboarded(null);
      return;
    }
    isOnboarded().then(setOnboarded).catch(() => setOnboarded(false));
  }, [isAuthenticated]);

  if (isLoading || !ready || (isAuthenticated && onboarded === null)) {
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
          onboarded ? (
            <Stack.Screen name="Main" component={MainTabs} />
          ) : (
            <Stack.Screen name="Onboarding">
              {() => <OnboardingScreen onDone={() => setOnboarded(true)} />}
            </Stack.Screen>
          )
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
