import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';
import { WorkoutTemplate } from '../../models';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export const WorkoutListScreen = () => {
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const navigation = useNavigation<any>();

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

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.title}>Workout</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Start</Text>
                <TouchableOpacity
                    style={styles.quickStartButton}
                    onPress={() => navigation.navigate('ActiveSession', { templateId: null })}
                >
                    <Text style={styles.quickStartText}>+ Start Empty Workout</Text>
                </TouchableOpacity>
            </View>



            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Routines</Text>
            </View>
        </View>
    );

    const renderItem = ({ item }: { item: WorkoutTemplate }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <TouchableOpacity onPress={() => handleAction(item)} style={{ padding: 4 }}>
                    <Ionicons name="ellipsis-horizontal" size={20} color={Theme.Colors.textSecondary} />
                </TouchableOpacity>
            </View>
            <Text style={styles.cardSubtitle}>{item.exercises?.length || 0} Exercises</Text>

            <TouchableOpacity
                style={styles.startButton}
                onPress={() => navigation.navigate('ActiveSession', { templateId: item.id })}
            >
                <Text style={styles.startButtonText}>Start Routine</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={templates}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
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
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Manage Routine</Text>
                        <Text style={styles.modalSubtitle}>{selectedTemplate?.name}</Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalButton} onPress={handleEdit}>
                                <Text style={styles.modalButtonText}>Edit</Text>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.modalButton} onPress={handleDelete}>
                                <Text style={[styles.modalButtonText, { color: Theme.Colors.danger }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.Colors.background,
    },
    content: {
        padding: Theme.Spacing.m,
    },
    header: {
        marginBottom: Theme.Spacing.l,
    },
    title: {
        ...Theme.Typography.title,
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
        ...Theme.Typography.subtitle,
        marginBottom: Theme.Spacing.s,
    },
    quickStartButton: {
        backgroundColor: Theme.Colors.surface,
        padding: Theme.Spacing.m,
        borderRadius: 12,
        alignItems: 'center',
    },
    quickStartText: {
        ...Theme.Typography.body,
        fontWeight: '600',
        color: Theme.Colors.text,
    },
    card: {
        backgroundColor: Theme.Colors.surface,
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
        ...Theme.Typography.body,
        fontWeight: '600',
    },
    cardSubtitle: {
        ...Theme.Typography.caption,
        marginBottom: Theme.Spacing.m,
    },
    startButton: {
        backgroundColor: Theme.Colors.primary,
        paddingVertical: Theme.Spacing.s,
        borderRadius: 8,
        alignItems: 'center',
    },
    startButtonText: {
        ...Theme.Typography.body,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    iconButton: {
        fontSize: 24,
        color: Theme.Colors.text,
    },
    libraryCard: {
        backgroundColor: Theme.Colors.surface,
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
        backgroundColor: Theme.Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardSubtitleNoBottom: {
        ...Theme.Typography.caption,
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
        backgroundColor: Theme.Colors.surface,
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
        color: Theme.Colors.textSecondary,
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
        color: Theme.Colors.primary,
    },
    divider: {
        height: 1,
        backgroundColor: Theme.Colors.border,
        marginVertical: 4,
    },
    cancelButton: {
        marginTop: 8,
    },
    cancelButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: Theme.Colors.textSecondary,
    }
});
