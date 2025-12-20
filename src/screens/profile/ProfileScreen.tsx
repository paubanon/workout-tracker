import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, WorkoutSession } from '../../models';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { GlowCard } from '../../components/GlowCard';

export const ProfileScreen = () => {
    const { signOut } = useAuth();
    const navigation = useNavigation<any>();
    const { colors, isDark } = useTheme();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);

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

    const handleSeeAllHistory = () => {
        navigation.navigate('History');
    };

    // Derived properties
    const displayName = profile ? `${profile.firstName} ${profile.lastName} `.trim() || 'User' : 'User';
    // weightHistory might be empty or undefined if profile logic changes, safe access
    const currentWeightKg = profile?.weightHistory?.[0]?.weightKg ?? null;
    const lastWeightDate = profile?.weightHistory?.[0]?.date
        ? new Date(profile.weightHistory[0].date).toLocaleDateString()
        : 'No data';

    const handleLogWeight = () => {
        Alert.prompt(
            "Log Weight",
            "Enter your current weight in kg:",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Save",
                    onPress: async (weight?: string) => {
                        const w = parseFloat(weight || '');
                        if (w && !isNaN(w)) {
                            await supabaseService.addWeightEntry(w);
                            loadData();
                        }
                    }
                }
            ],
            "plain-text",
            currentWeightKg?.toString()
        );
    };

    // Dynamic Styles
    const containerStyle = { backgroundColor: colors.background };
    const textStyle = { color: colors.text };
    const textMutedStyle = { color: colors.textMuted };
    const cardStyle = { backgroundColor: colors.surface };
    const shadowStyle = isDark ? Theme.TopLight.m : Theme.Shadows.light.m;

    return (
        <SafeAreaView style={[styles.container, containerStyle]} edges={['top']}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, textStyle]}>Profile</Text>
                <TouchableOpacity onPress={handleEditProfile} style={styles.settingsButton}>
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
                        <TouchableOpacity style={[styles.cameraButton, { backgroundColor: colors.surface }]}>
                            <Ionicons name="camera" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.userName, textStyle]}>{displayName}</Text>
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
                        <TouchableOpacity style={[styles.logButton, { backgroundColor: colors.background }]} onPress={handleLogWeight}>
                            <Text style={[styles.logButtonText, { color: colors.primary }]}>Log Weight</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.metricRow}>
                        <View>
                            <Text style={[styles.metricLabel, textMutedStyle]}>Recent History</Text>
                            <Text style={[styles.metricSubValue, textMutedStyle]}>
                                {lastWeightDate}
                            </Text>
                        </View>
                        <Text style={[styles.metricValueSmall, textStyle]}>
                            {currentWeightKg ? `${currentWeightKg} kg` : ''}
                        </Text>
                    </View>
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
                                >
                                    <View>
                                        <Text style={[styles.historyName, textStyle]}>{session.name}</Text>
                                        <Text style={[styles.historyDate, textMutedStyle]}>
                                            {new Date(session.date).toLocaleDateString()}
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
                >
                    <Text style={[styles.secondaryButtonText, { color: colors.text }]}>See All History</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
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
    }
});
