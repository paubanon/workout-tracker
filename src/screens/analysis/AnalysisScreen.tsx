import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

export const AnalysisScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.headerTitle}>Analysis</Text>

            <View style={styles.emptyState}>
                <Ionicons name="stats-chart" size={80} color="#E5E5EA" />
                <Text style={styles.emptyText}>Not enough data yet</Text>
                <Text style={styles.emptySubtext}>Complete more workouts to unlock insights.</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.Colors.background,
        padding: Theme.Spacing.m,
    },
    headerTitle: {
        ...Theme.Typography.title,
        marginTop: Theme.Spacing.m,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        ...Theme.Typography.subtitle,
        marginTop: Theme.Spacing.l,
        color: Theme.Colors.textSecondary,
    },
    emptySubtext: {
        ...Theme.Typography.caption,
        textAlign: 'center',
        marginTop: Theme.Spacing.s,
        maxWidth: 200,
    }
});
