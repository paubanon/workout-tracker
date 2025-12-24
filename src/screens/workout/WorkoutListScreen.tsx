import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';
import { WorkoutTemplate } from '../../models';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { GlowCard } from '../../components/GlowCard';
import { ThemedSafeAreaView } from '../../components/ThemedSafeAreaView';

export const WorkoutListScreen = () => {
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const navigation = useNavigation<any>();
    const { colors, isDark } = useTheme();

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadTemplates();
        });
        loadTemplates(); // Initial load
        return unsubscribe;
    }, [navigation]);

    const loadTemplates = async () => {
        const data = await supabaseService.getTemplates();
        setTemplates(data);
    };


    const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const handleAction = (template: WorkoutTemplate) => {
        setSelectedTemplate(template);
        setModalVisible(true);
    };

    const handleDelete = async () => {
        if (!selectedTemplate) return;
        setModalVisible(false);
        // Maybe confirmation? For now just delete.
        await supabaseService.deleteTemplate(selectedTemplate.id);
        loadTemplates();
    };

    const handleEdit = () => {
        if (!selectedTemplate) return;
        setModalVisible(false);
        navigation.navigate('CreateWorkout', { templateToEdit: selectedTemplate });
    };

    // Dynamic Styles
    const containerStyle = { backgroundColor: colors.background };
    const textStyle = { color: colors.text };
    const subtitleStyle = { color: colors.textMuted };
    const cardStyle = { backgroundColor: colors.surface };
    const quickStartButtonStyle = { backgroundColor: colors.surface };
    const shadowStyle = isDark ? Theme.TopLight.m : Theme.Shadows.light.m;

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={[styles.title, textStyle]}>Workout</Text>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, subtitleStyle]}>Quick Start</Text>
                <TouchableOpacity
                    style={[styles.startButton, { backgroundColor: colors.primary }, shadowStyle]}
                    onPress={() => navigation.navigate('ActiveSession', { templateId: null })}
                    accessibilityRole="button"
                    accessibilityLabel="Start empty workout"
                >
                    <Text style={styles.startButtonText}>+ Start Empty Workout</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, subtitleStyle]}>Routines</Text>
            </View>
        </View>
    );

    const renderItem = ({ item }: { item: WorkoutTemplate }) => (
        <GlowCard style={styles.card} level="m">
            <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, textStyle]}>{item.name}</Text>
                <TouchableOpacity
                    onPress={() => handleAction(item)}
                    style={{ padding: 4 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Options for ${item.name}`}
                >
                    <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
                </TouchableOpacity>
            </View>
            <Text style={[styles.cardSubtitle, subtitleStyle]}>{item.exercises?.length || 0} Exercises</Text>

            <TouchableOpacity
                style={[styles.startButton, { backgroundColor: colors.primary }, shadowStyle]}
                onPress={() => navigation.navigate('ActiveSession', { templateId: item.id })}
                accessibilityRole="button"
                accessibilityLabel={`Start ${item.name} routine`}
            >
                <Text style={styles.startButtonText}>Start Routine</Text>
            </TouchableOpacity>
        </GlowCard>
    );

    return (
        <ThemedSafeAreaView style={[styles.container, containerStyle]} edges={['top']}>
            <FlatList
                data={templates}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                extraData={colors}
            />

            {/* Custom Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, textStyle]}>Manage Routine</Text>
                        <Text style={[styles.modalSubtitle, subtitleStyle]}>{selectedTemplate?.name}</Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={handleEdit}
                                accessibilityRole="button"
                                accessibilityLabel="Edit routine"
                            >
                                <Text style={[styles.modalButtonText, { color: colors.primary }]}>Edit</Text>
                            </TouchableOpacity>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={handleDelete}
                                accessibilityRole="button"
                                accessibilityLabel="Delete routine"
                            >
                                <Text style={[styles.modalButtonText, { color: colors.danger }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setModalVisible(false)}
                            accessibilityRole="button"
                            accessibilityLabel="Cancel"
                        >
                            <Text style={[styles.cancelButtonText, subtitleStyle]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </ThemedSafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Theme.Spacing.m,
    },
    header: {
        marginBottom: Theme.Spacing.l,
    },
    title: {
        fontSize: Theme.Typography.scale.xl,
        fontWeight: 'bold',
        marginBottom: Theme.Spacing.l,
    },
    section: {
        marginBottom: Theme.Spacing.l,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Theme.Spacing.s,
    },
    sectionTitle: {
        fontSize: Theme.Typography.scale.lg,
        fontWeight: '600',
        marginBottom: Theme.Spacing.s,
    },
    quickStartButton: {
        padding: Theme.Spacing.m,
        borderRadius: 12,
        alignItems: 'center',
    },
    quickStartText: {
        fontSize: Theme.Typography.scale.md,
        fontWeight: '600',
    },
    card: {
        padding: Theme.Spacing.m,
        borderRadius: 12,
        marginBottom: Theme.Spacing.m,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Theme.Spacing.s,
    },
    cardTitle: {
        fontSize: Theme.Typography.scale.md,
        fontWeight: '600',
    },
    cardSubtitle: {
        fontSize: Theme.Typography.scale.sm,
        marginBottom: Theme.Spacing.m,
    },
    startButton: {
        paddingVertical: Theme.Spacing.s,
        borderRadius: 8,
        alignItems: 'center',
    },
    startButtonText: {
        fontSize: Theme.Typography.scale.md,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    iconButton: {
        fontSize: 24,
    },
    libraryCard: {
        padding: Theme.Spacing.m,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardSubtitleNoBottom: {
        fontSize: Theme.Typography.scale.sm,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Theme.Spacing.l,
    },
    modalContent: {
        borderRadius: 20,
        width: '100%',
        maxWidth: 320,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 24,
        textAlign: 'center',
    },
    modalActions: {
        width: '100%',
        marginBottom: 16,
    },
    modalButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 17,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 4,
    },
    cancelButton: {
        marginTop: 8,
    },
    cancelButtonText: {
        fontSize: 17,
        fontWeight: '600',
    }
});
