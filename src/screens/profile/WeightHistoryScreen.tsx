import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { GlowCard } from '../../components/GlowCard';
import { sanitizeDecimal, parseDecimal } from '../../utils/inputValidation';

interface WeightEntry {
    id: string;
    weightKg: number;
    date: string;
}

export const WeightHistoryScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, isDark, formatDate } = useTheme();
    const [entries, setEntries] = useState<WeightEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 50;

    // Add/Edit Modal
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
    const [inputWeight, setInputWeight] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadHistory(0);
    }, []);

    const loadHistory = async (offset: number) => {
        if (loading) return;
        setLoading(true);
        const data = await supabaseService.getWeightHistory(LIMIT, offset);

        if (data.length < LIMIT) {
            setHasMore(false);
        }

        if (offset === 0) {
            setEntries(data);
            setHasMore(data.length >= LIMIT);
        } else {
            setEntries(prev => [...prev, ...data]);
        }
        setLoading(false);
    };

    const handleLoadMore = () => {
        if (!hasMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        loadHistory(nextPage * LIMIT);
    };

    const handleOpenAddModal = () => {
        setEditingEntry(null);
        setInputWeight('');
        setIsModalVisible(true);
    };

    const handleOpenEditModal = (entry: WeightEntry) => {
        setEditingEntry(entry);
        setInputWeight(entry.weightKg.toString());
        setIsModalVisible(true);
    };

    const handleSave = async () => {
        const weight = parseFloat(inputWeight);
        if (isNaN(weight) || weight <= 0) {
            Alert.alert('Invalid Input', 'Please enter a valid weight.');
            return;
        }

        setIsSaving(true);
        if (editingEntry) {
            await supabaseService.updateWeightEntry(editingEntry.id, weight, editingEntry.date);
        } else {
            await supabaseService.addWeightEntry(weight);
        }
        setIsSaving(false);
        setIsModalVisible(false);
        setPage(0);
        loadHistory(0);
    };

    const handleDelete = (entry: WeightEntry) => {
        Alert.alert(
            'Delete Entry',
            `Are you sure you want to delete this weight entry (${entry.weightKg} kg)?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await supabaseService.deleteWeightEntry(entry.id);
                        setPage(0);
                        loadHistory(0);
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: WeightEntry }) => {
        const date = formatDate(item.date);

        return (
            <View style={styles.cardWrapper}>
                <GlowCard style={styles.card} level="m">
                    <TouchableOpacity
                        style={styles.cardContent}
                        onPress={() => handleOpenEditModal(item)}
                        onLongPress={() => handleDelete(item)}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.weightKg} kg</Text>
                            <Text style={[styles.cardDate, { color: colors.textMuted }]}>{date}</Text>
                        </View>
                    </TouchableOpacity>
                </GlowCard>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Weight History</Text>
                <TouchableOpacity
                    onPress={handleOpenAddModal}
                    accessibilityRole="button"
                    accessibilityLabel="Add weight entry"
                >
                    <Ionicons name="add" size={28} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {entries.length === 0 && !loading ? (
                <View style={styles.emptyState}>
                    <Ionicons name="scale-outline" size={64} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No weight entries yet</Text>
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.primary }]}
                        onPress={handleOpenAddModal}
                    >
                        <Text style={styles.addButtonText}>Log Your First Weight</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={entries}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={loading ? <ActivityIndicator color={colors.primary} /> : null}
                />
            )}

            {/* Add/Edit Modal */}
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {editingEntry ? 'Edit Weight' : 'Log Weight'}
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Weight (kg)</Text>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={inputWeight}
                                onChangeText={(val) => setInputWeight(sanitizeDecimal(val))}
                                placeholder="e.g. 75.5"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="decimal-pad"
                                autoFocus
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}
                                onPress={() => setIsModalVisible(false)}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                                onPress={handleSave}
                                disabled={isSaving}
                            >
                                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                                    {isSaving ? 'Saving...' : 'Save'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Theme.Spacing.m,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: Theme.Typography.h3.fontSize,
        fontWeight: Theme.Typography.h3.fontWeight,
    },
    list: {
        padding: Theme.Spacing.m,
    },
    cardWrapper: {
        marginBottom: Theme.Spacing.s,
    },
    card: {
        borderRadius: Theme.BorderRadius.m,
        padding: Theme.Spacing.m,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: Theme.Typography.subtitle.fontSize,
        fontWeight: Theme.Typography.subtitle.fontWeight,
    },
    cardDate: {
        fontSize: Theme.Typography.body.fontSize,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Theme.Spacing.xl,
    },
    emptyText: {
        fontSize: Theme.Typography.body.fontSize,
        marginTop: Theme.Spacing.m,
        marginBottom: Theme.Spacing.l,
    },
    addButton: {
        paddingVertical: Theme.Spacing.m,
        paddingHorizontal: Theme.Spacing.l,
        borderRadius: Theme.BorderRadius.m,
    },
    addButtonText: {
        color: '#fff',
        fontSize: Theme.Typography.body.fontSize,
        fontWeight: Theme.Typography.weight.semibold,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: Theme.Spacing.l,
    },
    modalContent: {
        borderRadius: Theme.BorderRadius.l,
        padding: Theme.Spacing.l,
    },
    modalTitle: {
        fontSize: Theme.Typography.h2.fontSize,
        fontWeight: Theme.Typography.h2.fontWeight,
        marginBottom: Theme.Spacing.l,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: Theme.Spacing.m,
    },
    inputLabel: {
        fontSize: Theme.Typography.body.fontSize,
        fontWeight: Theme.Typography.weight.medium,
        marginBottom: Theme.Spacing.xs,
    },
    textInput: {
        fontSize: Theme.Typography.h2.fontSize,
        paddingVertical: Theme.Spacing.m,
        paddingHorizontal: Theme.Spacing.m,
        borderRadius: Theme.BorderRadius.m,
        borderWidth: 1,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Theme.Spacing.l,
        gap: Theme.Spacing.m,
    },
    modalButton: {
        flex: 1,
        paddingVertical: Theme.Spacing.m,
        borderRadius: Theme.BorderRadius.m,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: Theme.Typography.body.fontSize,
        fontWeight: Theme.Typography.weight.semibold,
    },
});
