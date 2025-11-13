import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Alert,
    Clipboard
} from 'react-native';
import { Platform } from 'react-native';

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
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Share Group</Text>
                    <Text style={styles.helperText}>
                        Share this code with friends to let them join:
                    </Text>
                    
                    <View style={styles.codeContainer}>
                        <Text style={styles.joinCodeText}>{joinCode}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.copyButton, copied && styles.copyButtonCopied]}
                        onPress={handleCopy}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.copyButtonText}>
                            {copied ? '✓ Copied!' : 'Copy Code'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
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
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 10,
        textAlign: 'center',
    },
    helperText: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
        marginBottom: 20,
    },
    codeContainer: {
        backgroundColor: '#f8f9fa',
        paddingVertical: 20,
        paddingHorizontal: 40,
        borderRadius: 10,
        marginBottom: 20,
        width: '100%',
        alignItems: 'center',
    },
    joinCodeText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#4285f4',
        letterSpacing: 5,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    copyButton: {
        backgroundColor: '#4285f4',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        marginBottom: 10,
        width: '100%',
        alignItems: 'center',
    },
    copyButtonCopied: {
        backgroundColor: '#27ae60',
    },
    copyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    closeButton: {
        backgroundColor: '#e1e8ed',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#7f8c8d',
        fontSize: 16,
        fontWeight: '600',
    },
});

