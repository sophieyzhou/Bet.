import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Alert
} from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';

export default function RuleInput({ onAddRule, onCancel, initialRule = null }) {
    const [description, setDescription] = useState('');
    const [points, setPoints] = useState('');
    const [vetoThreshold, setVetoThreshold] = useState('1');

    // Populate form when editing an existing rule
    useEffect(() => {
        if (initialRule) {
            setDescription(initialRule.description || '');
            setPoints(initialRule.points?.toString() || '');
            setVetoThreshold(initialRule.vetoThreshold?.toString() || '1');
        } else {
            // Reset form when not editing
            setDescription('');
            setPoints('');
            setVetoThreshold('1');
        }
    }, [initialRule]);

    const handleAdd = () => {
        // Validation
        if (!description.trim()) {
            Alert.alert('Error', 'Rule description is required');
            return;
        }

        if (description.trim().length < 3 || description.trim().length > 100) {
            Alert.alert('Error', 'Rule description must be between 3 and 100 characters');
            return;
        }

        if (!points || points.trim() === '') {
            Alert.alert('Error', 'Points value is required');
            return;
        }

        const pointsNum = parseInt(points, 10);
        if (isNaN(pointsNum) || pointsNum < -1000 || pointsNum > 1000) {
            Alert.alert('Error', 'Points must be between -1000 and 1000');
            return;
        }

        const vetoNum = parseInt(vetoThreshold, 10);
        if (isNaN(vetoNum) || vetoNum < 0 || vetoNum > 100) {
            Alert.alert('Error', 'Veto threshold must be between 0 and 100');
            return;
        }

        // Create rule object
        const rule = {
            description: description.trim(),
            points: pointsNum,
            vetoThreshold: vetoNum
        };

        onAddRule(rule);

        // Reset form only if not editing (editing state is managed by parent)
        if (!initialRule) {
            setDescription('');
            setPoints('');
            setVetoThreshold('0');
        }
    };

    return (
        <Surface style={styles.container} elevation={0}>
            <TextInput
                label="Rule Description *"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                maxLength={100}
                placeholder="e.g., Run a mile"
                style={styles.input}
                returnKeyType="next"
                blurOnSubmit={false}
                textContentType="none"
            />

            <TextInput
                label="Points *"
                value={points}
                onChangeText={setPoints}
                mode="outlined"
                keyboardType="numeric"
                placeholder="e.g., 10 or -5"
                style={styles.input}
                returnKeyType="next"
                blurOnSubmit={false}
                textContentType="none"
            />
            <Text variant="bodySmall" style={styles.hint}>
                Can be negative for penalties
            </Text>

            <TextInput
                label="Veto Threshold *"
                value={vetoThreshold}
                onChangeText={setVetoThreshold}
                mode="outlined"
                keyboardType="number-pad"
                placeholder="1"
                style={styles.input}
                textContentType="none"
            />
            <Text variant="bodySmall" style={styles.hint}>
                Number of votes needed to veto
            </Text>

            <View style={styles.buttonRow}>
                <Button
                    mode="outlined"
                    onPress={onCancel}
                    style={styles.cancelButton}
                    textColor="#4285f4"
                    labelStyle={styles.buttonLabel}
                    contentStyle={styles.buttonContent}
                    compact
                >
                    Cancel
                </Button>
                <Button
                    mode="contained"
                    onPress={handleAdd}
                    style={styles.addButton}
                    textColor="#ffffff"
                    labelStyle={styles.buttonLabel}
                    contentStyle={styles.buttonContent}
                    compact
                >
                        {initialRule ? 'Update' : 'Add'}
                </Button>
            </View>
        </Surface>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 15,
    },
    input: {
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    hint: {
        color: '#7f8c8d',
        marginTop: -8,
        marginBottom: 8,
        marginLeft: 4,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
        gap: 10,
    },
    cancelButton: {
        flex: 1,
    },
    addButton: {
        flex: 1,
    },
    buttonLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    buttonContent: {
        minHeight: 40,
        paddingHorizontal: 6,
    },
});
