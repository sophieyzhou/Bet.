import React, { useState } from 'react';
import {
    StyleSheet,
    Clipboard,
    Dimensions
} from 'react-native';
import { Dialog, Button, Text, Card, Portal } from 'react-native-paper';
import { Platform } from 'react-native';

const screenHeight = Dimensions.get('window').height;

export default function ShareGroupModal({ visible, onClose, joinCode }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (joinCode) {
            Clipboard.setString(joinCode);
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        }
    };

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onClose} style={{ maxHeight: screenHeight * 0.9 }}>
                <Dialog.Title>Share Group</Dialog.Title>
                <Dialog.Content>
                    <Text variant="bodyMedium" style={styles.helperText}>
                        Share this code with friends to let them join:
                    </Text>
                    
                    <Card style={styles.codeContainer} mode="outlined">
                        <Card.Content>
                            <Text variant="displaySmall" style={styles.joinCodeText}>
                                {joinCode}
                            </Text>
                        </Card.Content>
                    </Card>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button
                        mode={copied ? "contained" : "outlined"}
                        onPress={handleCopy}
                        buttonColor={copied ? "#27ae60" : undefined}
                    >
                            {copied ? '✓ Copied!' : 'Copy Code'}
                    </Button>
                    <Button
                        mode="contained"
                        onPress={onClose}
                    >
                        Close
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}

const styles = StyleSheet.create({
    helperText: {
        textAlign: 'center',
        marginBottom: 20,
        color: '#7f8c8d',
    },
    codeContainer: {
        marginTop: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
    joinCodeText: {
        color: '#4285f4',
        letterSpacing: 5,
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
});

