import React, { useState, useEffect, useRef } from "react";
import { View, Image, StyleSheet, Animated } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, checkSubscriptionActive, updatePaymentStatus } from "./firebaseConfig";
import MainPage from "./components/MainPage";
import LoginPage from "./components/LoginPage";
import PasswordResetPage from "./components/PasswordResetPage";
import IntroPage from "./components/IntroPage";
import PaymentPage from "./components/PaymentPage";

const Stack = createStackNavigator();

const App = () => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchToRegisterPage, setSwitchToRegisterPage] = useState(false);
  const [verified, setVerified] = useState(false);
  const [subscriptionPaid, setSubscriptionPaid] = useState(false);

  const animateScale = () => {
    Animated.sequence([
      // Уменьшение до 0.5
      Animated.timing(scaleValue, {
        toValue: 0.5,
        duration: 500,
        useNativeDriver: true,
      }),
      // Возвращение к исходному размеру (1)
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Повтор анимации
      animateScale();
    });
  };

  useEffect(() => { animateScale(); }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        setUser(user);

        // Проверяем статус подписки
        const isActive = await checkSubscriptionActive(user.uid);
        setSubscriptionPaid(isActive);

        // Обновляем флаг в базе данных
        await updatePaymentStatus(user.uid, isActive);
      } else {
        setUser(null);
        setSubscriptionPaid(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [verified]);

  const checkSwitchToRegister = (payload: boolean) => {
    setSwitchToRegisterPage(payload);
  };

  const verifiedHandler = (payload: boolean) => {
    setVerified(payload);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.Image source={require('./assets/img/loading.png')} style={[styles.loadingImg, { transform: [{ scale: scaleValue }] }]} />
        {/* <Image source={require('./assets/img/loading.png')} style={styles.loadingImg} /> */}
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <Stack.Screen name="Main" options={{ headerShown: false }}>
            {(props) => <MainPage {...props} subscriptionPaid={subscriptionPaid} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Intro" options={{ headerShown: false }}>
              {(props) => <IntroPage {...props} switchPage={checkSwitchToRegister} />}
            </Stack.Screen>
            <Stack.Screen name="Login" options={{ headerShown: false }}>
              {(props) => <LoginPage {...props} isRegisterFirst={switchToRegisterPage} isVerified={verifiedHandler} />}
            </Stack.Screen>
          </>
        )}
        <Stack.Screen name="ResetPassword" options={{ headerShown: false }} component={PasswordResetPage} />
        <Stack.Screen name="Payment">
          {(props) =>
            user ? (
              <PaymentPage />
            ) : (
              // Перенаправление на логин, если нет доступа
              <LoginPage {...props} isRegisterFirst={switchToRegisterPage} isVerified={verifiedHandler}/>
            )
          }
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingImg: {
    width: 336, alignSelf: 'center',
    resizeMode: 'contain'
  },
});

export default App;