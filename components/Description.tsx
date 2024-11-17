import React from "react";
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet, Clipboard } from "react-native";

interface Props {
    description: string;
}

const Description: React.FC<Props> = ({ description }) => {
    const copyHandler = async (text: string) => {
        try {
            Clipboard.setString(text);
            Alert.alert("Скопировано в буфер обмена!");
        } catch (error) {
            console.error("Ошибка при копировании:", error);
            Alert.alert("Ошибка при копировании.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.textarea} onPress={() => { copyHandler(description); }}>
                {description}
            </Text>

            <TouchableOpacity onPress={() => copyHandler(description)}>
                <Image source={require('../assets/img/copy.png')} style={styles.img} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        borderWidth: 2,
        borderColor: '#1881C2',
        borderRadius:15,
    },
    textarea: {
        flex: 1,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        marginRight: 10,
        backgroundColor: '#f9f9f9',
    },
    img: {
        width: 24,
        height: 24,
    },
});

export default Description;
