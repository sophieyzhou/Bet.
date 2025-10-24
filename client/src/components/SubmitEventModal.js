import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function SubmitEventModal({ visible, onClose, members, rules, onSubmit }) {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRuleId, setSelectedRuleId] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        // Validation
        if (!selectedUserId) {
            Alert.alert('Error', 'Please select a member');
            return;
        }

        if (!selectedRuleId) {
            Alert.alert('Error', 'Please select a rule');
            return;
        }

        setIsLoading(true);

        try {
            await onSubmit({
                userId: selectedUserId,
                ruleId: selectedRuleId,
                description: description.trim()
            });

            // Reset form
            setSelectedUserId('');
            setSelectedRuleId('');
            setDescription('');

            onClose();
        } catch (error) {
            // Error handled in parent
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        // Reset form
        setSelectedUserId('');
        setSelectedRuleId('');
        setDescription('');
        onClose();
    };

    const getSelectedRule = () => {
        return rules.find(r => r._id === selectedRuleId);
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
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalTitle}>Submit Event</Text>

                        {/* Select Member */}
                        <Text style={styles.label}>Submit for: *</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedUserId}
                                onValueChange={(value) => setSelectedUserId(value)}
                                enabled={!isLoading}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select a member..." value="" />
                                {members.map((member) => (
                                    <Picker.Item
                                        key={member.userId}
                                        label={member.name}
                                        value={member.userId}
                                    />
                                ))}
                            </Picker>
                        </View>

                        {/* Select Rule */}
                        <Text style={styles.label}>Rule: *</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedRuleId}
                                onValueChange={(value) => setSelectedRuleId(value)}
                                enabled={!isLoading}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select a rule..." value="" />
                                {rules.map((rule) => (
                                    <Picker.Item
                                        key={rule._id}
                                        label={`${rule.description} (${rule.points > 0 ? '+' : ''}${rule.points} pts)`}
                                        value={rule._id}
                                    />
                                ))}
                            </Picker>
                        </View>

                        {/* Show selected rule details */}
                        {getSelectedRule() && (
                            <View style={styles.ruleInfo}>
                                <Text style={styles.ruleInfoText}>
                                    Points: {getSelectedRule().points > 0 ? '+' : ''}{getSelectedRule().points}
                                </Text>
                                <Text style={styles.ruleInfoText}>
                                    Veto Threshold: {getSelectedRule().vetoThreshold} votes
                                </Text>
                            </View>
                        )}

                        {/* Description/Notes */}
                        <Text style={styles.label}>Notes (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Add any additional details..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            editable={!isLoading}
                        />

                        {/* Buttons */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCancel}
                                disabled={isLoading}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitButton, isLoading && styles.disabledButton]}
                                onPress={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Submit Event</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
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
        padding: 20,
        width: '100%',
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
        marginTop: 10,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#e1e8ed',
        borderRadius: 8,
        backgroundColor: '#2A2A2A',
        marginBottom: 10,
    },
    picker: {
        height: 50,
    },
    ruleInfo: {
        backgroundColor: '#1A1A1A',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    ruleInfoText: {
        fontSize: 14,
        color: '#2c3e50',
        marginBottom: 4,
    },
    input: {
        backgroundColor: '#2A2A2A',
        borderWidth: 1,
        borderColor: '#e1e8ed',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#2c3e50',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
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
    submitButton: {
        flex: 1,
        backgroundColor: '#4285f4',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.6,
    },
});
