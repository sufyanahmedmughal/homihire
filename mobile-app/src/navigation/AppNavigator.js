import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../store/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/theme';

// Screens
import SplashScreen from '../screens/SplashScreen';
import RoleSelectScreen from '../screens/RoleSelectScreen';
import UserRegisterScreen from '../screens/UserRegisterScreen';
import WorkerRegisterScreen from '../screens/WorkerRegisterScreen';
import OTPVerifyScreen from '../screens/OTPVerifyScreen';
import LoginScreen from '../screens/LoginScreen';
import PendingApprovalScreen from '../screens/PendingApprovalScreen';
import RejectedScreen from '../screens/RejectedScreen';
import UserHomeScreen from '../screens/UserHomeScreen';
import WorkerHomeScreen from '../screens/WorkerHomeScreen';

const Stack = createStackNavigator();

const screenOptions = {
  headerShown: false,
  gestureEnabled: true,
  cardStyleInterpolator: ({ current, layouts }) => ({
    cardStyle: {
      opacity: current.progress,
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width * 0.08, 0],
          }),
        },
      ],
    },
  }),
};

export default function AppNavigator() {
  const { isAuthenticated, role, user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  const getInitialRoute = () => {
    if (!isAuthenticated) return 'Splash';
    if (role === 'user') return 'UserHome';
    if (role === 'worker') {
      if (user?.status === 'pending') return 'PendingApproval';
      if (user?.status === 'rejected') return 'Rejected';
      return 'WorkerHome';
    }
    return 'Splash';
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={screenOptions}
      >
        {/* Auth flow */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="UserRegister" component={UserRegisterScreen} />
        <Stack.Screen name="WorkerRegister" component={WorkerRegisterScreen} />
        <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />

        {/* Post-auth */}
        <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
        <Stack.Screen name="Rejected" component={RejectedScreen} />
        <Stack.Screen name="UserHome" component={UserHomeScreen} />
        <Stack.Screen name="WorkerHome" component={WorkerHomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
