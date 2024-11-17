import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, StyleSheet } from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from 'react-native-linear-gradient';

type IntroScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Password'>;

type RootStackParamList = {
  Login: undefined;
  Password: undefined;
};

const PasswordResetPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSentReset, setIsSentReset] = useState<boolean>(false);
  const navigation = useNavigation<IntroScreenNavigationProp>();

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = () => {
    if (!isValidEmail(email)) {
      setError("Invalid email address.");
      return false;
    }

    return true;
  };

  const handlePasswordReset = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email has been sent. Please check your inbox.");
      setIsSentReset(true);
    } catch (error) {
      setError("Failed to send password reset email. Please check the email address and try again.");
      console.error("Password reset error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={[{ paddingHorizontal: 16, flexGrow: 1, justifyContent: 'space-between' }]}>
          <Text style={styles.title}>Password Reset</Text>
          <View>
            <Text style={[styles.text, { fontStyle: 'italic' }]}>
              Enter your email, we will send you password recovery link.
            </Text>
            <TextInput
              style={[styles.input, error ? styles.errorInput : styles.normalInput]}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="rgba(24, 129, 194, 0.5)"
              editable={!loading}
            />
          </View>

          {message && <Text style={styles.successMessage}>{message}</Text>}
          {error && <Text style={styles.errorMessage}>{error}</Text>}

          {isSentReset ? (
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.buttonText}>Back to login page</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.buttonWrapper}>
              <TouchableOpacity style={[styles.button, { backgroundColor: '#1881C2', width: 50, height: 50, borderRadius: 50 }]} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.buttonText}>&larr;</Text>
              </TouchableOpacity>
              <LinearGradient
                colors={['#147FC2', '#0A567D', '#093C5C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.button, { flexGrow: 1, marginLeft: 10 }]}
              >
                <TouchableOpacity
                  style={styles.button}
                  onPress={handlePasswordReset}
                  disabled={loading || !email}
                >
                  {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>SEND</Text>}
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
        </View>
        <Image source={require("../assets/img/yellowhalf.png")} style={styles.imgReset} />
      </View>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingBottom: 0,
  },

  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  title: {
    fontSize: 40,
    fontStyle: 'normal',
    lineHeight: 50,
    letterSpacing: 0.64,
    textAlign: 'center',
    color: '#1881C2'
  },

  text: {
    fontSize: 30,
    fontStyle: 'normal',
    lineHeight: 40,
    textAlign: 'center',
    color: '#1881C2',
    marginBottom: 19
  },

  input: {
    fontFamily: "Nunito Sans 10pt",
    fontSize: 24,
    color: '#1881C2',
    fontStyle: 'italic',
    display: 'flex',
    alignContent: 'center',

    paddingLeft: 24,
    paddingRight: 24,
    borderRadius: 30,
    height: 50
  },

  normalInput: {
    borderColor: "#147FC2",
    borderWidth: 1,
  },

  errorInput: {
    borderColor: "red",
    borderWidth: 1,
  },

  successMessage: {
    color: "green",
    marginTop: 10,
  },

  errorMessage: {
    color: "red",
  },

  button: {
    borderRadius: 30,
    height: 50
  },

  buttonText: {
    fontFamily: "Nunito Sans 10pt",
    fontSize: 24,
    fontStyle: 'normal',
    lineHeight: 50,
    letterSpacing: 2,
    color: '#FFF',
    textAlign: 'center'
  },

  buttonWrapper: {
    flexDirection: 'row',
    marginTop: 15
  },

  imgReset: {
    position: 'relative',
    bottom: '-5%',
    width: '100%',
    height: 248,
    alignSelf: 'center',
    /* resizeMode: 'contain', */
  }
});

export default PasswordResetPage;