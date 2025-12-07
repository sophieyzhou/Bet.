import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Clipboard,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { Dialog, TextInput, Button, Text, Portal } from 'react-native-paper';

const screenHeight = Dimensions.get('window').height;

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
        <Portal>
            <Dialog visible={visible} onDismiss={handleCancel} style={{ maxHeight: screenHeight * 0.9 }}>
                <Dialog.Title>Join Group</Dialog.Title>
                {Platform.OS !== 'web' ? (
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                        style={styles.keyboardView}
                    >
                        <Dialog.Content style={styles.dialogContent}>
                            <Text variant="bodyMedium" style={styles.helperText}>
                                Enter the 6-digit group code
                            </Text>

                            <TextInput
                                label="Join Code"
                                value={joinCode}
                                onChangeText={handleCodeChange}
                                mode="outlined"
                                autoCapitalize="characters"
                                maxLength={6}
                                disabled={isLoading}
                                autoFocus
                                error={joinCode.length > 0 && joinCode.length !== 6}
                                style={styles.input}
                                contentStyle={styles.inputContent}
                                returnKeyType="done"
                                blurOnSubmit={true}
                                textContentType="none"
                                keyboardType="default"
                            />
                            {joinCode.length > 0 && joinCode.length !== 6 && (
                                <Text variant="bodySmall" style={styles.errorText}>
                                    Code must be exactly 6 characters
                                </Text>
                            )}
                            {errorMessage && (
                                <View style={styles.errorContainer}>
                                    <Text variant="bodySmall" style={styles.errorMessageText}>
                                        {errorMessage}
                                    </Text>
                                </View>
                            )}
                        </Dialog.Content>
                    </KeyboardAvoidingView>
                ) : (
                    <Dialog.Content style={styles.dialogContent}>
                        <Text variant="bodyMedium" style={styles.helperText}>
                            Enter the 6-digit group code
                        </Text>

                        <TextInput
                            label="Join Code"
                            value={joinCode}
                            onChangeText={handleCodeChange}
                            mode="outlined"
                            autoCapitalize="characters"
                            maxLength={6}
                            disabled={isLoading}
                            autoFocus
                            error={joinCode.length > 0 && joinCode.length !== 6}
                            style={styles.input}
                            contentStyle={styles.inputContent}
                            returnKeyType="done"
                            blurOnSubmit={true}
                            textContentType="none"
                            keyboardType="default"
                        />
                        {joinCode.length > 0 && joinCode.length !== 6 && (
                            <Text variant="bodySmall" style={styles.errorText}>
                                Code must be exactly 6 characters
                            </Text>
                        )}
                        {errorMessage && (
                            <View style={styles.errorContainer}>
                                <Text variant="bodySmall" style={styles.errorMessageText}>
                                    {errorMessage}
                                </Text>
                            </View>
                        )}
                    </Dialog.Content>
                )}
                <Dialog.Actions>
                    <Button onPress={handleCancel} disabled={isLoading}>Cancel</Button>
                    <Button
                        mode="contained"
                        onPress={handleJoin}
                        disabled={isLoading || joinCode.length !== 6}
                        loading={isLoading}
                    >
                        Join
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}

const styles = StyleSheet.create({
    keyboardView: {
        flexShrink: 1,
    },
    dialogContent: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        minHeight: 100,
    },
    helperText: {
        textAlign: 'center',
        marginBottom: 20,
        color: '#7f8c8d',
    },
    input: {
        marginTop: 10,
        marginBottom: 10,
    },
    inputContent: {
        fontSize: 24,
        textAlign: 'center',
        fontWeight: 'bold',
        letterSpacing: 5,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : Platform.OS === 'web' ? 'monospace' : 'monospace',
    },
    errorText: {
        color: '#e74c3c',
        marginTop: -10,
        marginBottom: 10,
        textAlign: 'center',
    },
    errorContainer: {
        backgroundColor: '#ffebee',
        borderWidth: 1,
        borderColor: '#e74c3c',
        borderRadius: 8,
        padding: 12,
        marginTop: 10,
        marginBottom: 10,
    },
    errorMessageText: {
        color: '#e74c3c',
        textAlign: 'center',
    },
});
