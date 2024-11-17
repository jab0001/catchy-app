import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { getAuth, confirmPasswordReset } from "firebase/auth";
import { useNavigation, RouteProp } from "@react-navigation/native"; 
import { StackNavigationProp } from "@react-navigation/stack";

type IntroScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Reset'>;

type RootStackParamList = {
    Intro: undefined;
    Login: undefined;
    Registration: undefined;
    Home: undefined;
    Payment: undefined;
    Main: undefined;
    Reset: { oobCode: string }; // Добавляем oobCode в параметры
};

type ResetPasswordPageProps = {
    route: RouteProp<RootStackParamList, 'Reset'>; // Для доступа к параметрам маршрута
};

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ route }) => {
    const [newPassword, setNewPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const navigation = useNavigation<IntroScreenNavigationProp>();

    const { oobCode } = route.params;

    const handlePasswordReset = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);

        if (!oobCode) {
            setError("Invalid reset code.");
            setLoading(false);
            return;
        }

        try {
            const auth = getAuth();
            await confirmPasswordReset(auth, oobCode, newPassword);
            setMessage("Password has been reset successfully.");
            navigation.navigate("Login");
        } catch (error) {
            setError("Failed to reset password. Please try again.");
            console.error("Password reset error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Reset Password</Text>
            {error && <Text style={styles.errorMessage}>{error}</Text>}
            {message && <Text style={styles.successMessage}>{message}</Text>}
            <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
                editable={!loading}
            />
            <TouchableOpacity
                style={styles.button}
                onPress={handlePasswordReset}
                disabled={loading || !newPassword}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
    },
    errorMessage: {
        color: "red",
        marginBottom: 10,
    },
    successMessage: {
        color: "green",
        marginBottom: 10,
    },
    input: {
        width: "100%",
        height: 40,
        borderColor: "#147FC2",
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    button: {
        backgroundColor: "#147FC2",
        padding: 10,
        borderRadius: 5,
        width: "100%",
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontSize: 16,
    },
});

export default ResetPasswordPage;