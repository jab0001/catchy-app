import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, Platform } from 'react-native';
import RNIap, { initConnection, getSubscriptions, requestPurchase, finishTransaction, Subscription } from 'react-native-iap';
import { auth, database } from '../firebaseConfig'; // Подключаем Firebase
import { ref, get, set, update } from 'firebase/database'; // Импортируем методы из Realtime Database
import { getServerTime } from '../helpers'; // Импортируем функцию для получения времени сервера
import { User } from 'firebase/auth'; // Тип для пользователя

const subscriptionIds: string[] | undefined = Platform.select({
  ios: ['com.example.product1', 'com.example.product0'], // Подписки для iOS
  android: ['com.example.product1', 'com.example.product2'], // Подписки для Android
});

const PaymentPage = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]); // Массив подписок
  const [user, setUser] = useState<User | null>(null); // Для отслеживания авторизованного пользователя

  // Инициализация IAP
  useEffect(() => {
    const initIAP = async () => {
      try {
        const connection = await initConnection();
        console.log("IAP connection:", connection);

        if (subscriptionIds) {
          const availableSubscriptions = await getSubscriptions({ skus: subscriptionIds });
          console.log("Requested subscription IDs:", subscriptionIds);
          console.log("Available subscriptions:", availableSubscriptions);

          if (availableSubscriptions.length === 0) {
            console.warn("No subscriptions found. Check App Store Connect setup.");
          } else {
            setSubscriptions(availableSubscriptions);
          }
        }
      } catch (err: any) {
        console.error("Error fetching subscriptions:", err);
      }
    };

    initIAP();

    return () => {
      if (RNIap && RNIap.endConnection) {
        RNIap.endConnection();
      }
    };
  }, []);

  const handlePurchase = async (productId: string): Promise<void> => {
    try {
      const purchase = await requestPurchase({ sku: productId });

      if (!purchase) {
        throw new Error("Purchase failed or was canceled");
      }

      await finishTransaction(purchase as any);

      const serverTime = await getServerTime();
      if (!serverTime) {
        Alert.alert('Error', 'Failed to fetch server time. Please try again.');
        return;
      }

      let newSubscriptionEndDate: Date;

      if (!user) {
        throw new Error("User is not authenticated");
      }

      const userRef = ref(database, `users/${user.uid}`);
      const userSnapshot = await get(userRef);

      if (userSnapshot.exists() && userSnapshot.val().subscriptionDate) {
        const currentEndDate = new Date(userSnapshot.val().subscriptionDate);
        newSubscriptionEndDate = currentEndDate > serverTime ? currentEndDate : serverTime;

        if (productId === 'com.example.product1') {
          newSubscriptionEndDate.setMonth(newSubscriptionEndDate.getMonth() + 1);
        } else if (productId === 'com.example.product2') {
          newSubscriptionEndDate.setDate(newSubscriptionEndDate.getDate() + 7);
        }
      } else {
        newSubscriptionEndDate = new Date(serverTime);

        if (productId === 'com.example.product1') {
          newSubscriptionEndDate.setMonth(newSubscriptionEndDate.getMonth() + 1);
        } else if (productId === 'com.example.product2') {
          newSubscriptionEndDate.setDate(newSubscriptionEndDate.getDate() + 7);
        }
      }

      await set(userRef, {
        subscriptionType: productId,
        subscriptionDate: newSubscriptionEndDate.toISOString(),
        subscriptionPaid: true,
      });

      Alert.alert('Success', 'Purchase successful!');
    } catch (err: any) {
      console.error("Error in handlePurchase:", err);
      Alert.alert('Error', 'Purchase failed. Please try again.');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>In-App Purchases</Text>

      {subscriptions.map((subscription) => (
        <View key={subscription.productId} style={{ marginBottom: 10 }}>
          <Button
            title={`Buy ${subscription.title} - ${subscription.productId}`}
            onPress={() => handlePurchase(subscription.productId)}
          />
        </View>
      ))}
    </View>
  );
};

export default PaymentPage;
