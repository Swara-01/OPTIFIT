import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import SplashScreen from "./Screen/SplashScreen";
import LoginScreen from "./Screen/LoginScreen";
import SignupScreen from "./Screen/SignupScreen";
import ProfileSetupScreen from "./Screen/ProfileSetupScreen";
import DashboardScreen from "./Screen/DashboardScreen";
import StepsScreen from "./Screen/StepsScreen";
import TabNavigator from "./navigation/TabNavigator";
import WorkoutScreen from "./Screen/WorkoutScreen";
import FriendsScreen from "./Screen/FriendsScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem("token");
      setIsLoggedIn(!!token);
    };

    checkLogin();
  }, []);

  if (isLoggedIn === null) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLoggedIn ? (
            <>
              <Stack.Screen name="MainApp">
                {props => (
                  <TabNavigator
                    {...props}
                    setIsLoggedIn={setIsLoggedIn}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen
                name="Steps"
                component={StepsScreen}
              />

              <Stack.Screen
                name="Friends"
                component={FriendsScreen}
              />
            </>
          ) : (
            <>
              <Stack.Screen
                name="Splash"
                component={SplashScreen}
              />

              <Stack.Screen name="Login">
                {props => (
                  <LoginScreen
                    {...props}
                    setIsLoggedIn={setIsLoggedIn}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen
                name="Signup"
                component={SignupScreen}
              />

              <Stack.Screen
                name="ProfileSetup"
                component={ProfileSetupScreen}
              />

              <Stack.Screen
                name="Workout"
                component={WorkoutScreen}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}