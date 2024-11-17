import { initializeApp } from "firebase/app";
import {
  initializeAuth,

  // @ts-ignore
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage"; // корректный импорт AsyncStorage
import { getDatabase, ref, get, update, set } from "firebase/database";
import ACTIONS from "./state/actions/helpActions";
import { getServerTime } from "./helpers";
import {
  REACT_APP_FIREBASE_API_KEY,
  REACT_APP_FIREBASE_AUTH_DOMAIN,
  REACT_APP_FIREBASE_PROJECT_ID,
  REACT_APP_FIREBASE_STORAGE_BUCKET,
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  REACT_APP_FIREBASE_APP_ID,
  REACT_APP_FIREBASE_MEASUREMENT_ID,
} from "@env";

// Firebase configuration object
const firebaseConfig = {
  apiKey: REACT_APP_FIREBASE_API_KEY,
  authDomain: REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: REACT_APP_FIREBASE_APP_ID,
  measurementId: REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const database = getDatabase(app);

// Update the payment status of a user
export const updatePaymentStatus = async (userId: string, isPaid: boolean) => {
  const userRef = ref(database, `users/${userId}`);

  try {
    await update(userRef, {
      subscriptionPaid: isPaid,
    });
    console.log("Payment status updated successfully");
  } catch (error) {
    console.error("Error updating payment status:", error);
  }
};

// Check the subscription status of the current user
export const checkSubscriptionStatus = async (dispatch: React.Dispatch<any>) => {
  if (!auth.currentUser) return;

  const userRef = ref(database, `users/${auth.currentUser.uid}`);
  try {
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const userData = snapshot.val();
      console.log('USER', userData);

      // Dispatch action to update subscription status
      dispatch({
        type: ACTIONS.SET_IS_PAID,
        payload: userData.subscriptionPaid,
      });
    } else {
      console.log("No data available");

      // If no data, dispatch false
      dispatch({
        type: ACTIONS.SET_IS_PAID,
        payload: false,
      });
    }
  } catch (error) {
    console.error("Error checking subscription status:", error);
  }
};

// Check API usage limit for the current user
export const checkApiUsageLimit = async (number: number, dispatch: React.Dispatch<any>): Promise<boolean> => {
  if (!auth.currentUser) {
    console.error("User is not authenticated");
    return false;
  }

  const serverTime = await getServerTime();
  let currentDate = serverTime ? serverTime.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  const userRef = ref(database, `users/${auth.currentUser.uid}`);

  try {
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      // If user has no records, create a new record for tracking API usage
      await set(userRef, {
        apiUsage: { [currentDate]: number },
      });
      return true;
    }

    const userData = snapshot.val();
    const apiUsage = userData.apiUsage || {};
    const requestsToday = apiUsage[currentDate] || 0;

    // Limit on the number of requests per day
    const requestLimit = 5;

    dispatch({
      type: ACTIONS.DAY_LIMIT_NUMBER,
      payload: requestLimit - requestsToday,
    });

    if ((requestsToday + number) > requestLimit) {
      console.log(`Cannot perform requests as you exceed the daily request limit. You have ${requestLimit - requestsToday} requests available.`);
      return false;
    }

    if (requestsToday >= requestLimit) {
      console.log(`Daily request limit reached`);
      return false; // Limit reached
    }

    // Update the number of requests for the current day
    await update(userRef, { [`apiUsage/${currentDate}`]: requestsToday + number });

    return true; // Allow the request
  } catch (error) {
    console.error("Error checking API usage limit:", error);
    return false;
  }
};

// Добавьте функцию для записи информации о подписке с датой окончания
export const recordSubscription = async (userId: string, subscriptionType: string) => {
  const serverTime = await getServerTime();

  if (!serverTime) {
    console.error("Failed to get server time");
    return;
  }

  const subscriptionDuration = 30 * 24 * 60 * 60 * 1000; // 30 дней
  const expirationDate = new Date(serverTime.getTime() + subscriptionDuration); // Дата окончания подписки

  const userRef = ref(database, `users/${userId}/subscription`);
  const subscriptionData = {
    type: subscriptionType,
    startDate: serverTime.toISOString(),
    expirationDate: expirationDate.toISOString(),
  };

  try {
    await set(userRef, subscriptionData);
    console.log("Subscription recorded successfully");
  } catch (error) {
    console.error("Error recording subscription:", error);
  }
};

// Проверка активности подписки
export const checkSubscriptionActive = async (userId: string): Promise<boolean> => {
  const serverTime = await getServerTime();
  if (!serverTime) return false;

  const userRef = ref(database, `users/${userId}/subscription`);
  try {
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const subscriptionData = snapshot.val();
      const expirationDate = new Date(subscriptionData.expirationDate);

      // Проверяем, что подписка активна (дата окончания больше текущего времени)
      const isActive = expirationDate > serverTime;
      return isActive;
    }
  } catch (error) {
    console.error("Error checking subscription status:", error);
  }
  return false;
};