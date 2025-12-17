import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';

export const SettingsScreen = () => {
    const [trackRpe, setTrackRpe] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const profile = await supabaseService.getUserProfile();
        if (profile) {
            setTrackRpe(profile.preferences?.trackRpe ?? false);
        }
        setLoading(false);
    };

    const toggleRpe = async (value: boolean) => {
        setTrackRpe(value);
        try {
            const profile = await supabaseService.getUserProfile();
            if (profile) {
                await supabaseService.updateUserProfile({
                    preferences: {
                        ...profile.preferences,
                        trackRpe: value
                    }
                });
            }
        } catch (error) {
            Alert.alert("Error", "Failed to update settings");
            setTrackRpe(!value); // Revert on error
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.row}>
                    <View>
                        <Text style={styles.optionTitle}>Track RPE</Text>
                        <Text style={styles.optionSubtitle}>Rate Perceived Exertion (1-10) after each set</Text>
                    </View>
                    <Switch
                        trackColor={{ false: "#767577", true: Theme.Colors.primary }}
                        thumbColor={trackRpe ? "#f4f3f4" : "#f4f3f4"}
                        onValueChange={toggleRpe}
                        value={trackRpe}
                        disabled={loading}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.Colors.background,
    },
    header: {
        paddingHorizontal: Theme.Spacing.m,
        paddingTop: Theme.Spacing.m,
        marginBottom: Theme.Spacing.l,
    },
    headerTitle: {
        ...Theme.Typography.title,
    },
    section: {
        paddingHorizontal: Theme.Spacing.m,
    },
    sectionTitle: {
        ...Theme.Typography.subtitle,
        fontSize: 13,
        textTransform: 'uppercase',
        color: Theme.Colors.textSecondary,
        marginBottom: Theme.Spacing.s,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Theme.Colors.surface,
        padding: 16,
        borderRadius: 12,
    },
    optionTitle: {
        fontSize: 17,
        fontWeight: '500',
        color: Theme.Colors.text,
        marginBottom: 4,
    },
    optionSubtitle: {
        fontSize: 13,
        color: Theme.Colors.textSecondary,
        maxWidth: 240,
    }
});
