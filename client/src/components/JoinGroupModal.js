import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ActivityIndicator
} from 'react-native';

export default function JoinGroupModal({ visible, onClose, onJoinSuccess }) {
    const [joinCode, setJoinCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleJoin = async () => {
        // Clear any previous errors
        setErrorMessage('');
        
        // Validation
        if (!joinCode.trim()) {
            setErrorMessage('Please enter a join code');
            return;
        }

        if (joinCode.trim().length !== 6) {
            setErrorMessage('Join code must be 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            await onJoinSuccess(joinCode.trim().toUpperCase());
            // Success - reset form and close modal (handled by parent)
            setJoinCode('');
            setErrorMessage('');
        } catch (error) {
            // Display error in modal - keep modal open
            const errorMsg = error.message || 'Failed to join group. Please try again.';
            setErrorMessage(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setJoinCode('');
        setErrorMessage('');
        onClose();
    };

    const handleCodeChange = (text) => {
        // Auto-uppercase and limit to 6 characters
        setJoinCode(text.toUpperCase().slice(0, 6));
        // Clear error when user starts typing
        if (errorMessage) {
            setErrorMessage('');
        }
    };

    // Clear error when modal closes/opens
    useEffect(() => {
        if (!visible) {
            setErrorMessage('');
            setJoinCode('');
        }
    }, [visible]);

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
                        style={[styles.input, joinCode.length > 0 && joinCode.length !== 6 && styles.inputError]}
                        placeholder="Enter code"
                        placeholderTextColor="#bdc3c7"
                        value={joinCode}
                        onChangeText={handleCodeChange}
                        autoCapitalize="characters"
                        maxLength={6}
                        editable={!isLoading}
                        autoFocus
                    />
                    {joinCode.length > 0 && joinCode.length !== 6 && (
                        <Text style={styles.errorText}>Code must be exactly 6 characters</Text>
                    )}
                    {errorMessage && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorMessageText}>{errorMessage}</Text>
                        </View>
                    )}

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancel}
                            disabled={isLoading}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.joinButton, (isLoading || joinCode.length !== 6) && styles.disabledButton]}
                        onPress={handleJoin}
                        disabled={isLoading || joinCode.length !== 6}
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
        backgroundColor: '#fff',
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
        backgroundColor: '#f8f9fa',
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
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#e1e8ed',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginRight: 10,
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
    inputError: {
        borderColor: '#e74c3c',
    },
    errorText: {
        color: '#e74c3c',
        fontSize: 12,
        marginTop: -15,
        marginBottom: 10,
        textAlign: 'center',
    },
    errorContainer: {
        backgroundColor: '#fee',
        borderWidth: 1,
        borderColor: '#e74c3c',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
    },
    errorMessageText: {
        color: '#e74c3c',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
});
