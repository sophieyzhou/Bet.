import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Alert,
    ActivityIndicator,
    Clipboard
} from 'react-native';
import RuleInput from './RuleInput';

export default function CreateGroupModal({ visible, onClose, onCreateSuccess, editMode = false, initialData = null, onUpdateSuccess = null, groupId = null }) {
    const [groupName, setGroupName] = useState('');
    const [description, setDescription] = useState('');
    const [rules, setRules] = useState([]);
    const [showRuleInput, setShowRuleInput] = useState(false);
    const [editingRuleIndex, setEditingRuleIndex] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [rulesError, setRulesError] = useState(null);

    // Populate form when in edit mode
    useEffect(() => {
        if (visible && editMode && initialData) {
            setGroupName(initialData.name || '');
            setDescription(initialData.description || '');
            // Convert rules from server format to form format
            const formattedRules = (initialData.rules || []).map(rule => ({
                description: rule.description,
                points: rule.points,
                vetoThreshold: rule.vetoThreshold
            }));
            setRules(formattedRules);
        } else if (visible && !editMode) {
            // Reset form when opening in create mode
            setGroupName('');
            setDescription('');
            setRules([]);
            setRulesError(null);
        }
        // Reset editing state when modal opens/closes
        setEditingRuleIndex(null);
        setShowRuleInput(false);
        setRulesError(null);
    }, [visible, editMode, initialData]);

    const handleAddRule = (rule) => {
        if (editingRuleIndex !== null) {
            // Editing existing rule
            const newRules = [...rules];
            newRules[editingRuleIndex] = rule;
            setRules(newRules);
            setEditingRuleIndex(null);
        } else {
            // Adding new rule
            if (rules.length >= 20) {
                Alert.alert('Maximum Reached', 'You can only add up to 20 rules');
                return;
            }
            setRules([...rules, rule]);
        }
        setShowRuleInput(false);
        setRulesError(null);
    };

    const handleEditRule = (index) => {
        setEditingRuleIndex(index);
        setShowRuleInput(true);
        setRulesError(null);
    };

    const handleRemoveRule = (index) => {
        const newRules = rules.filter((_, i) => i !== index);
        setRules(newRules);
    };

    const handleCancelRuleInput = () => {
        setShowRuleInput(false);
        setEditingRuleIndex(null);
    };

    const handleCreate = async () => {
        // Validation
        if (!groupName.trim()) {
            Alert.alert('Error', 'Group name is required');
            return;
        }

        if (groupName.trim().length < 3 || groupName.trim().length > 50) {
            Alert.alert('Error', 'Group name must be between 3 and 50 characters');
            return;
        }

        if (description.length > 200) {
            Alert.alert('Error', 'Description must be less than 200 characters');
            return;
        }

        if (rules.length === 0) {
            setRulesError('At least one rule is required');
            Alert.alert('Error', 'At least one rule is required');
            return;
        }

        const groupData = {
            name: groupName.trim(),
            description: description.trim(),
            rules: rules
        };

        setIsLoading(true);

        try {
            if (editMode && onUpdateSuccess) {
                // Edit mode: call update handler
                await onUpdateSuccess(groupId, groupData);
                // Don't show success modal for edit, just close
                handleCancel();
            } else {
                // Create mode: call create handler
                const result = await onCreateSuccess(groupData);
                // Show success modal with join code
                if (result && result.joinCode) {
                    setJoinCode(result.joinCode);
                    setShowSuccessModal(true);
                }
            }
        } catch (error) {
            // Error handling is done in the parent
        } finally {
            setIsLoading(false);
        }
    };

    const handleShowSuccess = (code) => {
        setJoinCode(code);
        setShowSuccessModal(true);
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        setJoinCode('');
        // Reset form
        setGroupName('');
        setDescription('');
        setRules([]);
        setShowRuleInput(false);
        setRulesError(null);
        // Call onClose to trigger refresh in parent
        onClose();
    };

    const handleCopyCode = () => {
        Clipboard.setString(joinCode);
        Alert.alert('Copied!', 'Join code copied to clipboard');
    };

    const handleCancel = () => {
        // Reset form
        setGroupName('');
        setDescription('');
        setRules([]);
        setShowRuleInput(false);
        setRulesError(null);
        onClose();
    };

    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                transparent={true}
                onRequestClose={handleCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>
                                {editMode ? 'Edit Group' : 'Create New Group'}
                            </Text>

                            <Text style={styles.label}>Group Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter group name"
                                value={groupName}
                                onChangeText={setGroupName}
                                maxLength={50}
                                editable={!isLoading}
                            />

                            <Text style={styles.label}>Description (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="What is this group about?"
                                value={description}
                                onChangeText={setDescription}
                                maxLength={200}
                                multiline
                                numberOfLines={3}
                                editable={!isLoading}
                            />

                            <View style={styles.rulesSection}>
                                <View style={styles.rulesSectionHeader}>
                                    <Text style={styles.label}>Rules * (Minimum 1)</Text>
                                    <Text style={styles.ruleCount}>{rules.length}/20</Text>
                                </View>

                                {rules.map((rule, index) => (
                                    <View key={index} style={styles.ruleCard}>
                                        <View style={styles.ruleContent}>
                                            <Text style={styles.ruleDescription}>{rule.description}</Text>
                                            <View style={styles.ruleDetails}>
                                                <Text style={styles.rulePoints}>
                                                    {rule.points > 0 ? '+' : ''}{rule.points} pts
                                                </Text>
                                                <Text style={styles.ruleVeto}>
                                                    Veto: {rule.vetoThreshold}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.ruleActions}>
                                            <TouchableOpacity
                                                onPress={() => handleEditRule(index)}
                                                style={styles.editButton}
                                                disabled={isLoading}
                                            >
                                                <Text style={styles.editButtonText}>Edit</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => handleRemoveRule(index)}
                                                style={styles.removeButton}
                                                disabled={isLoading}
                                            >
                                                <Text style={styles.removeButtonText}>×</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}

                                {showRuleInput ? (
                                    <RuleInput
                                        onAddRule={handleAddRule}
                                        onCancel={handleCancelRuleInput}
                                        initialRule={editingRuleIndex !== null ? rules[editingRuleIndex] : null}
                                    />
                                ) : (
                                    <TouchableOpacity
                                        style={styles.addRuleButton}
                                        onPress={() => {
                                            setShowRuleInput(true);
                                            setRulesError(null);
                                        }}
                                        disabled={isLoading || rules.length >= 20}
                                    >
                                        <Text style={styles.addRuleButtonText}>+ Add Rule</Text>
                                    </TouchableOpacity>
                                )}

                                {rulesError && (
                                    <Text style={styles.errorText}>{rulesError}</Text>
                                )}
                            </View>

                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={handleCancel}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.createButton, isLoading && styles.disabledButton]}
                                    onPress={handleCreate}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.createButtonText}>
                                            {editMode ? 'Update Group' : 'Create Group'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                animationType="fade"
                transparent={true}
                onRequestClose={handleSuccessClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.successModal}>
                        <Text style={styles.successTitle}>🎉 Group Created!</Text>
                        <Text style={styles.successMessage}>
                            Share this code with friends to let them join:
                        </Text>
                        <View style={styles.codeContainer}>
                            <Text style={styles.joinCodeText}>{joinCode}</Text>
                        </View>
                        <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
                            <Text style={styles.copyButtonText}>Copy Code</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.doneButton} onPress={handleSuccessClose}>
                            <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

// Expose method to show success from parent
CreateGroupModal.showSuccess = function (modalRef, code) {
    if (modalRef && modalRef.current) {
        modalRef.current.handleShowSuccess(code);
    }
};

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
        padding: 20,
        width: '100%',
        maxHeight: '90%',
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
        marginBottom: 5,
        marginTop: 10,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e1e8ed',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#2c3e50',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    rulesSection: {
        marginTop: 15,
    },
    rulesSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ruleCount: {
        fontSize: 12,
        color: '#7f8c8d',
    },
    ruleCard: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
        alignItems: 'center',
    },
    ruleContent: {
        flex: 1,
    },
    ruleDescription: {
        fontSize: 16,
        color: '#2c3e50',
        marginBottom: 5,
    },
    ruleDetails: {
        flexDirection: 'row',
        gap: 15,
    },
    rulePoints: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4285f4',
    },
    ruleVeto: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    ruleActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    editButton: {
        backgroundColor: '#4285f4',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    removeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#e74c3c',
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    addRuleButton: {
        backgroundColor: '#e1e8ed',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    addRuleButtonText: {
        color: '#4285f4',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        color: '#e74c3c',
        fontSize: 14,
        marginTop: 8,
        fontWeight: '500',
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
    createButton: {
        flex: 1,
        backgroundColor: '#4285f4',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.6,
    },
    // Success Modal Styles
    successModal: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 30,
        width: '90%',
        alignItems: 'center',
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
    },
    successMessage: {
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
    },
    joinCodeText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#4285f4',
        letterSpacing: 5,
    },
    copyButton: {
        backgroundColor: '#e1e8ed',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        marginBottom: 10,
    },
    copyButtonText: {
        color: '#4285f4',
        fontSize: 16,
        fontWeight: '600',
    },
    doneButton: {
        backgroundColor: '#4285f4',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
    },
    doneButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
