import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, StyleSheet, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth, database } from "../firebaseConfig";
import { ref, set } from "firebase/database";
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'react-native-linear-gradient';

interface LoginProps {
    isRegisterFirst: boolean;
    isVerified: (arg0: boolean) => void;
    navigation: IntroScreenNavigationProp;
}

type IntroScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

type RootStackParamList = {
    Login: undefined;
    ResetPassword: undefined;
    Main: undefined;
    Home: undefined;
};

const LoginPage: React.FC<LoginProps> = ({ isRegisterFirst, isVerified }) => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isRegistering, setIsRegistering] = useState<boolean>(isRegisterFirst);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [emailSent, setEmailSent] = useState<boolean>(false);
    const [showResendVerification, setShowResendVerification] = useState<boolean>(false);
    const navigation = useNavigation<IntroScreenNavigationProp>();

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validateForm = () => {
        if (!isValidEmail(email)) {
            setError("Invalid email address.");
            return false;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return false;
        }
        return true;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setError(null);
        setShowResendVerification(false);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log(userCredential.user.emailVerified)
            if (userCredential.user.emailVerified) {
                isVerified(true);
            } else {
                setError("Please verify your email before logging in.");
                setShowResendVerification(true);
            }
        } catch (error: any) {
            setError(error.code);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setError(null);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
            await set(ref(database, 'users/' + userCredential.user.uid), {
                email: email,
                subscriptionPaid: false
            });

            setEmailSent(true);
        } catch (error: any) {
            setError(error.code);
        } finally {
            setLoading(false);
        }
    };

    const resendVerificationEmail = async () => {
        setLoading(true);
        setError(null);
        setShowResendVerification(false);

        try {
            const user = auth.currentUser;
            if (user) {
                await sendEmailVerification(user);
                setEmailSent(true);
                setError("Verification email sent again! Please check your inbox.");
            } else {
                setError("No user is currently signed in.");
            }
        } catch (error: any) {
            setError("Failed to resend verification email. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const goBackHandler = () => {
        setIsRegistering(false);
        setEmailSent(false);
        setError(null);
        navigation.navigate('Login');
    };

    return (
        <SafeAreaView style={[styles.safeArea]}>
            <View style={styles.container}>
                <Text style={styles.title}>{isRegistering ? (emailSent ? "Email Verification" : "Let’s get started!") : (emailSent ? "Email Verification" : "Welcome back!")}</Text>
                {emailSent && (
                    <View style={styles.verificationContainer}>
                        <View style={[{ paddingHorizontal: 16, flex: 1, justifyContent: 'space-between' }]}>
                            <Text style={[styles.text, { fontStyle: 'italic' }]}>Please follow the link that we sent to your email.</Text>
                            <Text style={[styles.text]}>Didn’t get the link? </Text>
                            <View style={styles.buttonWrapper}>
                                <TouchableOpacity style={[styles.button, { backgroundColor: '#1881C2', width: 50, height: 50, borderRadius: 50 }]} onPress={() => setEmailSent(false)}>
                                    <Text style={styles.buttonText}>&larr;</Text>
                                </TouchableOpacity>
                                <LinearGradient
                                    colors={['#147FC2', '#0A567D', '#093C5C']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.button, { flexGrow: 1, marginLeft: 10 }]}
                                >
                                    <TouchableOpacity style={styles.button} onPress={goBackHandler}>
                                        <Text style={styles.buttonText}>RESEND</Text>
                                    </TouchableOpacity>
                                </LinearGradient>
                            </View>
                        </View>
                        <Image source={require("../assets/img/redhalf.png")} style={styles.image} />
                    </View>
                )}
                {!emailSent && (
                    <>
                        <View style={[{ paddingHorizontal: 16 }]}>
                            <TextInput
                                key='inputEmail'
                                style={[styles.input, error ? styles.errorInput : styles.defaultInput, { marginBottom: 21 }]}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Email"
                                editable={!loading}
                                placeholderTextColor="rgba(24, 129, 194, 0.5)"
                                keyboardType="email-address"
                            />
                            {error && <Text style={styles.errorMessage}>{error}</Text>}
                            <TextInput
                                key='inputPassword'
                                style={[styles.input, error ? styles.errorInput : styles.defaultInput]}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Password"
                                placeholderTextColor="rgba(24, 129, 194, 0.5)"
                                secureTextEntry={true}
                                editable={!loading}
                            />
                            <TouchableOpacity onPress={() => { setIsRegistering(!isRegistering); setError(null); setEmail(''); setPassword('') }} disabled={loading}>
                                <Text style={styles.switchText}>{isRegistering ? "Already have an account? Sign in" : "No account yet? Register here."}</Text>
                            </TouchableOpacity>
                            {!isRegistering && (
                                <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')} disabled={loading}>
                                    <Text style={styles.forgetText}>Forget Password?</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={[{ paddingHorizontal: 16 }]}>
                            <LinearGradient
                                colors={['#147FC2', '#0A567D', '#093C5C']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.button}
                            >
                                <TouchableOpacity onPress={isRegistering ? handleRegister : handleLogin} disabled={loading}>
                                    <Text style={styles.buttonText}>{loading ? "Processing..." : isRegistering ? "SIGN UP" : "LOG IN"}</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                            {showResendVerification && (
                                <LinearGradient
                                    colors={['#147FC2', '#0A567D', '#093C5C']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.button, {marginTop: 22}]}
                                >
                                    <TouchableOpacity style={styles.button} onPress={resendVerificationEmail} disabled={loading}>
                                        <Text style={styles.buttonText}>RESEND VERIFICATION</Text>
                                    </TouchableOpacity>
                                </LinearGradient>
                            )}
                        </View>
                    </>
                )}
            </View>
        </SafeAreaView>
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
        marginTop: 36,
        fontFamily: "Nunito Sans 10pt SemiCondensed",
        fontWeight: 'normal',
        fontSize: 40,
        fontStyle: 'normal',
        lineHeight: 50,
        letterSpacing: 0.64,
        textAlign: 'center',
        color: '#1881C2',
    },

    buttonContainer: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
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

    button: {
        borderRadius: 30,
        height: 50
    },

    text: {
        fontFamily: "Nunito Sans 10pt",
        fontSize: 24,
        fontStyle: 'normal',
        lineHeight: 30,
        textAlign: 'center',
        color: '#1881C2',
    },

    verificationContainer: {
        height: '80%',
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

    errorInput: {
        borderColor: 'red',
        borderWidth: 1,
    },

    defaultInput: {
        borderColor: '#147FC2',
        borderWidth: 2,
    },

    errorMessage: {
        color: 'red',
        marginBottom: 10,
    },

    switchText: {
        fontFamily: "Nunito Sans 10pt SemiCondensed",
        fontSize: 22,
        color: '#147FC2',
        textAlign: 'center',
        lineHeight: 25,
        marginTop: 16,
    },

    forgetText: {
        fontFamily: "Nunito Sans 10pt SemiCondensed",
        fontSize: 22,
        color: '#147FC2',
        textAlign: 'center',
        lineHeight: 25,
        textDecorationLine: 'underline',
        marginTop: 16,
    },

    buttonWrapper: {
        flexDirection: 'row',
        marginTop: 15
    },

    image: {
        position: 'relative',
        bottom: '-5%',
        width: '100%',
        height: 248,
        alignSelf: 'center',
        /* resizeMode: 'contain', */
    }
});

export default LoginPage;