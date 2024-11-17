import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface DayLimitModalProps {
    isOpen: boolean;
    limit: number;
    onClose: () => void;
}

const DayLimitModal: React.FC<DayLimitModalProps> = ({ isOpen, onClose, limit }) => {
    return (
        <Modal
            transparent={true}
            visible={isOpen}
            animationType="slide"
            onRequestClose={onClose} // Handle back button on Android
        >
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>&times;</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Limit Reached</Text>
                    <Text style={styles.message}>У вас осталось ежедневных {limit} запросов</Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    },
    modalContent: {
        width: '80%',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
    closeButton: {
        alignSelf: 'flex-end',
    },
    closeButtonText: {
        fontSize: 24,
        color: 'black',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
    },
});

export default DayLimitModal;