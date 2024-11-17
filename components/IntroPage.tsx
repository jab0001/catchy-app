import React from "react";
import { View, Text, Image, TouchableOpacity, SafeAreaView, Alert, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from '@react-navigation/stack';

interface IntroProps {
    switchPage: (arg0: boolean) => void;
    navigation: IntroScreenNavigationProp;
}

type IntroScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

type RootStackParamList = {
    /*  Intro: undefined; */
    Login: undefined;
    Registration: undefined;
};

const Intro: React.FC<IntroProps> = ({ switchPage }) => {
    const navigation = useNavigation<IntroScreenNavigationProp>();

    const handlerSwitchPage = (method: string) => {
        if (method === 'login') {
        }
        if (method === 'registration') {
            switchPage(true);
        }

        navigation.navigate('Login'); // Update the route name as per your navigation setup
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Image source={require("../assets/img/logo.png")} style={styles.logo} />
                <Image source={require("../assets/img/logoPicture.png")} style={styles.logoPicture} />
                <View>
                    <Text style={styles.title}>Create engaging{'\n'}titles in seconds!</Text>
                    <Text style={styles.text}>Boost your views with{'\n'}AI SMM assistant.</Text>
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={() => handlerSwitchPage('registration')} style={[styles.button, styles.register]}>
                        <Text style={styles.buttonText}>Get Started</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handlerSwitchPage('login')} style={[styles.button, styles.login]}>
                        <Text style={styles.buttonText}>Log In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },

    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 9
    },

    buttonContainer: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    buttonText: {
        fontFamily: "Nunito Sans 10pt SemiCondensed",
        fontSize: 26,
        fontStyle: 'normal',
        lineHeight: 50,
        letterSpacing: 1,
        color: '#FFF',
        textAlign: 'center'
    },

    button: {
        borderRadius: 35,
        borderWidth: 3,
        borderColor: '#147FC2',
        backgroundColor: '#1881C2',
    },

    login: {
        width: '40%',
    },

    register: {
        width: '55%',
    },

    title: {
        fontFamily: "Nunito Sans 10pt SemiCondensed",
        fontWeight: 'bold',
        fontSize: 32,
        fontStyle: 'normal',
        lineHeight: 40,
        letterSpacing: 0.64,
        textAlign: 'left',
        color: '#1881C2',
    },

    text: {
        fontFamily: "Nunito Sans 10pt SemiCondensed",
        fontSize: 30,
        fontStyle: 'normal',
        lineHeight: 40,
        textAlign: 'right',
        color: '#1881C2',
        marginLeft: 'auto',
        fontWeight: 'normal',

        marginTop: '10%',
    },

    logo: {
        width: '100%',
        margin: 0,
        alignSelf: 'center',
        resizeMode: 'contain',
    },

    logoPicture: {
        width: 212,
        height: 212,
        margin: 0,
        alignSelf: 'center',
        resizeMode: 'contain',
    }
});

export default Intro;