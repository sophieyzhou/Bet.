import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Alert,
    ActivityIndicator
} from 'react-native';

export default function JoinGroupModal({ visible, onClose, onJoinSuccess }) {
    const [joinCode, setJoinCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleJoin = async () => {
        // Validation
        if (!joinCode.trim()) {
            Alert.alert('Error', 'Please enter a join code');
            return;
        }

        if (joinCode.trim().length !== 6) {
            Alert.alert('Error', 'Join code must be 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            await onJoinSuccess(joinCode.trim().toUpperCase());
            // Reset form
            setJoinCode('');
        } catch (error) {
            // Error handled in parent
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setJoinCode('');
        onClose();
    };

    const handleCodeChange = (text) => {
        // Auto-uppercase and limit to 6 characters
        setJoinCode(text.toUpperCase().slice(0, 6));
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleCancel}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Join Group</Text>

                    <Text style={styles.helperText}>Enter the 6-digit group code</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="ABC123"
                        value={joinCode}
                        onChangeText={handleCodeChange}
                        autoCapitalize="characters"
                        maxLength={6}
                        editable={!isLoading}
                        autoFocus
                    />

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancel}
                            disabled={isLoading}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.joinButton, isLoading && styles.disabledButton]}
                            onPress={handleJoin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.joinButtonText}>Join</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#2A2A2A',
        borderRadius: 15,
        padding: 25,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 10,
        textAlign: 'center',
    },
    helperText: {
        fontSize: 14,
        color: '#7f8c8d',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#e1e8ed',
        borderRadius: 8,
        padding: 15,
        fontSize: 24,
        color: '#2c3e50',
        textAlign: 'center',
        fontWeight: 'bold',
        letterSpacing: 5,
        fontFamily: 'monospace',
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#e1e8ed',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#7f8c8d',
        fontSize: 16,
        fontWeight: '600',
    },
    joinButton: {
        flex: 1,
        backgroundColor: '#4285f4',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.6,
    },
});
