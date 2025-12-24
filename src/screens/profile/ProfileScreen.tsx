import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, TextInput } from 'react-native';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, WorkoutSession } from '../../models';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { GlowCard } from '../../components/GlowCard';
import { ThemedSafeAreaView } from '../../components/ThemedSafeAreaView';
import { SimpleDropdown } from '../../components/SimpleDropdown';
import { sanitizeDecimal } from '../../utils/inputValidation';

export const ProfileScreen = () => {
    const { signOut } = useAuth();
    const navigation = useNavigation<any>();
    const { colors, isDark, formatDate } = useTheme();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);

    // Edit Profile Modal State
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editSex, setEditSex] = useState<string>('male');
    const [isSaving, setIsSaving] = useState(false);

    // Log Weight Modal State
    const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);
    const [inputWeight, setInputWeight] = useState('');

    const SEX_OPTIONS = ['Male', 'Female', 'Other'];

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadData();
        });
        loadData();
        return unsubscribe;
    }, [navigation]);

    const loadData = async () => {
        const userProfile = await supabaseService.getUserProfile();
        setProfile(userProfile);

        // Fetch recent sessions (history)
        const history = await supabaseService.getWorkoutSessions(5);
        setRecentSessions(history);
    };

    const handleEditProfile = () => {
        navigation.navigate('Settings');
    };

    const handleOpenEditModal = () => {
        // Populate modal with current values
        setEditFirstName(profile?.firstName || '');
        setEditLastName(profile?.lastName || '');
        setEditSex(profile?.sex || 'male');
        setIsEditModalVisible(true);
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        await supabaseService.updateUserProfile({
            firstName: editFirstName.trim(),
            lastName: editLastName.trim(),
            sex: editSex.toLowerCase() as 'male' | 'female' | 'other',
        });
        await loadData();
        setIsSaving(false);
        setIsEditModalVisible(false);
    };

    const handleSeeAllHistory = () => {
        navigation.navigate('History');
    };

    // Derived properties
    const displayName = profile ? `${profile.firstName} ${profile.lastName} `.trim() || 'User' : 'User';
    // weightHistory might be empty or undefined if profile logic changes, safe access
    const currentWeightKg = profile?.weightHistory?.[0]?.weightKg ?? null;
    const lastWeightDate = profile?.weightHistory?.[0]?.date
        ? formatDate(profile.weightHistory[0].date)
        : 'No data';

    const handleLogWeight = () => {
        setInputWeight(currentWeightKg?.toString() || '');
        setIsWeightModalVisible(true);
    };

    const handleSaveWeight = async () => {
        const w = parseFloat(inputWeight);
        if (w && !isNaN(w) && w > 0) {
            await supabaseService.addWeightEntry(w);
            await loadData();
            setIsWeightModalVisible(false);
        }
    };

    const handleSeeWeightHistory = () => {
        navigation.navigate('WeightHistory');
    };

    // Dynamic Styles
    const containerStyle = { backgroundColor: colors.background };
    const textStyle = { color: colors.text };
    const textMutedStyle = { color: colors.textMuted };
    const cardStyle = { backgroundColor: colors.surface };
    const shadowStyle = isDark ? Theme.TopLight.m : Theme.Shadows.light.m;

    return (
        <ThemedSafeAreaView style={[styles.container, containerStyle]} edges={['top']}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, textStyle]}>Profile</Text>
                <TouchableOpacity
                    onPress={handleEditProfile}
                    style={styles.settingsButton}
                    accessibilityRole="button"
                    accessibilityLabel="Settings"
                >
                    <Ionicons name="settings-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={[styles.avatarContainer, { backgroundColor: colors.surface }]}>
                        {profile?.avatarUrl ? (
                            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
                        ) : (
                            <Text style={[styles.avatarInitials, textMutedStyle]}>
                                {displayName.charAt(0)}
                            </Text>
                        )}
                        <TouchableOpacity
                            style={[styles.cameraButton, { backgroundColor: colors.surface }]}
                            accessibilityRole="button"
                            accessibilityLabel="Change profile photo"
                        >
                            <Ionicons name="camera" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.nameRow}>
                        <Text style={[styles.userName, textStyle]}>{displayName}</Text>
                        <TouchableOpacity
                            onPress={handleOpenEditModal}
                            style={styles.editPencilButton}
                            accessibilityRole="button"
                            accessibilityLabel="Edit profile information"
                        >
                            <Ionicons name="pencil" size={18} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.userEmail, textMutedStyle]}>{profile?.email}</Text>
                </View>

                {/* Body Metrics */}
                <Text style={[styles.sectionTitle, textMutedStyle]}>BODY METRICS</Text>
                <GlowCard style={styles.metricsCard} level="m">
                    <View style={styles.metricRow}>
                        <View>
                            <Text style={[styles.metricLabel, textMutedStyle]}>Current Weight</Text>
                            <Text style={[styles.metricValue, textStyle]}>
                                {currentWeightKg ? `${currentWeightKg} kg` : '-'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.logButton, { backgroundColor: colors.background }]}
                            onPress={handleLogWeight}
                            accessibilityRole="button"
                            accessibilityLabel="Log weight"
                        >
                            <Text style={[styles.logButtonText, { color: colors.primary }]}>Log Weight</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <TouchableOpacity
                        style={styles.metricRow}
                        onPress={handleSeeWeightHistory}
                        accessibilityRole="button"
                        accessibilityLabel="See weight history"
                    >
                        <View>
                            <Text style={[styles.metricLabel, textMutedStyle]}>Weight History</Text>
                            <Text style={[styles.metricSubValue, textMutedStyle]}>
                                {lastWeightDate}
                            </Text>
                        </View>
                        <View style={styles.linkRow}>
                            <Text style={[styles.metricValueSmall, textStyle]}>
                                {currentWeightKg ? `${currentWeightKg} kg` : ''}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                        </View>
                    </TouchableOpacity>
                </GlowCard>

                {/* Recent Workouts */}
                <Text style={[styles.sectionTitle, textMutedStyle]}>RECENT WORKOUTS</Text>
                <GlowCard style={styles.historyList} level="m">
                    {recentSessions.length === 0 ? (
                        <View style={{ padding: 16 }}>
                            <Text style={textMutedStyle}>No recent workouts</Text>
                        </View>
                    ) : (
                        recentSessions.map((session, index) => (
                            <View key={session.id}>
                                <TouchableOpacity
                                    style={styles.historyItem}
                                    onPress={() => navigation.navigate('WorkoutHistoryDetail', { session })}
                                    accessibilityRole="button"
                                    accessibilityLabel={`View ${session.name} workout from ${new Date(session.date).toLocaleDateString()}`}
                                >
                                    <View>
                                        <Text style={[styles.historyName, textStyle]}>{session.name}</Text>
                                        <Text style={[styles.historyDate, textMutedStyle]}>
                                            {formatDate(session.date)}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={[styles.historyVolume, textStyle]}>
                                            {session.sets.reduce((acc, s: any) => acc + (s.loadKg || 0) * (s.reps || 0), 0)} kg
                                        </Text>
                                        <Text style={[styles.historySets, textMutedStyle]}>{session.sets.length} Sets</Text>
                                    </View>
                                </TouchableOpacity>
                                {index < recentSessions.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                            </View>
                        ))
                    )}
                </GlowCard>

                <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: colors.border }]}
                    onPress={handleSeeAllHistory}
                    accessibilityRole="button"
                    accessibilityLabel="See all workout history"
                >
                    <Text style={[styles.secondaryButtonText, { color: colors.text }]}>See All History</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                visible={isEditModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, textStyle]}>Edit Profile</Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, textMutedStyle]}>First Name</Text>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={editFirstName}
                                onChangeText={setEditFirstName}
                                placeholder="First Name"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, textMutedStyle]}>Last Name</Text>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={editLastName}
                                onChangeText={setEditLastName}
                                placeholder="Last Name"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, textMutedStyle]}>Sex</Text>
                            <SimpleDropdown
                                value={editSex.charAt(0).toUpperCase() + editSex.slice(1)}
                                options={SEX_OPTIONS}
                                onSelect={(val) => setEditSex(val.toLowerCase())}
                                style={{ width: '100%' }}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}
                                onPress={() => setIsEditModalVisible(false)}
                            >
                                <Text style={[styles.modalButtonText, textStyle]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                                onPress={handleSaveProfile}
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

            {/* Log Weight Modal */}
            <Modal
                visible={isWeightModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsWeightModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, textStyle]}>Log Weight</Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, textMutedStyle]}>Weight (kg)</Text>
                            <TextInput
                                style={[styles.textInput, styles.weightInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
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
                                onPress={() => setIsWeightModalVisible(false)}
                            >
                                <Text style={[styles.modalButtonText, textStyle]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                                onPress={handleSaveWeight}
                            >
                                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ThemedSafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.Spacing.m,
        marginBottom: Theme.Spacing.m,
    },
    headerTitle: {
        fontSize: Theme.Typography.scale.xl,
        fontWeight: 'bold',
    },
    editButton: {
        fontSize: Theme.Typography.scale.md,
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: Theme.Spacing.m,
        paddingBottom: 40,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: Theme.Spacing.xl,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Theme.Spacing.m,
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarInitials: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    userName: {
        fontSize: Theme.Typography.scale.lg,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: Theme.Typography.scale.md,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: Theme.Spacing.s,
        marginLeft: 4,
    },
    metricsCard: {
        borderRadius: 12,
        padding: Theme.Spacing.m,
        marginBottom: Theme.Spacing.l,
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    metricLabel: {
        fontSize: Theme.Typography.scale.sm,
        marginBottom: 4,
    },
    metricValue: {
        fontSize: Theme.Typography.scale.xl,
        fontWeight: 'bold',
    },
    metricValueSmall: {
        fontSize: Theme.Typography.scale.md,
        fontWeight: '600',
    },
    metricSubValue: {
        fontSize: Theme.Typography.scale.sm,
    },
    logButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    logButtonText: {
        fontSize: Theme.Typography.scale.sm,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        width: '100%',
    },
    historyList: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: Theme.Spacing.xl,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Theme.Spacing.m,
    },
    historyName: {
        fontSize: Theme.Typography.scale.md,
        fontWeight: '600',
        marginBottom: 4,
    },
    historyDate: {
        fontSize: Theme.Typography.scale.sm,
    },
    historyVolume: {
        fontSize: Theme.Typography.scale.md,
        fontWeight: '600',
        textAlign: 'right',
    },
    historySets: {
        fontSize: Theme.Typography.scale.sm,
        textAlign: 'right',
    },
    secondaryButton: {
        paddingVertical: 12,
        paddingHorizontal: Theme.Spacing.m,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: Theme.Spacing.l,
    },
    secondaryButtonText: {
        fontSize: Theme.Typography.scale.md,
        fontWeight: '600',
    },
    footer: {
        marginTop: Theme.Spacing.m,
        marginBottom: Theme.Spacing.xl,
    },
    logoutButton: {
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.Colors.danger,
    },
    logoutText: {
        color: Theme.Colors.danger,
        fontSize: Theme.Typography.scale.md,
        fontWeight: '600',
    },
    settingsButton: {
        padding: 4,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.Spacing.xs,
    },
    editPencilButton: {
        marginLeft: Theme.Spacing.s,
        padding: Theme.Spacing.xs,
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
        fontSize: Theme.Typography.body.fontSize,
        paddingVertical: Theme.Spacing.s,
        paddingHorizontal: Theme.Spacing.m,
        borderRadius: Theme.BorderRadius.m,
        borderWidth: 1,
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
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.Spacing.xs,
    },
    weightInput: {
        fontSize: Theme.Typography.h2.fontSize,
        textAlign: 'center',
    },
});
