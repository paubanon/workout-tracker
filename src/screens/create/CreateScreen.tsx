import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

export const CreateScreen = () => {
    const navigation = useNavigation<any>();

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.headerTitle}>Create</Text>

            <View style={styles.content}>
                <Text style={styles.subtitle}>Expand your library</Text>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('CreateExercise')}
                >
                    <View style={[styles.iconBox, { backgroundColor: '#E8F2FF' }]}>
                        <Ionicons name="barbell" size={32} color={Theme.Colors.primary} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>New Exercise</Text>
                        <Text style={styles.description}>Add a custom movement to your database.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={Theme.Colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('CreateWorkout')}
                >
                    <View style={[styles.iconBox, { backgroundColor: '#FFF0E6' }]}>
                        <Ionicons name="list" size={32} color="#FF9500" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>New Routine</Text>
                        <Text style={styles.description}>Combine exercises into a reusable template.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={Theme.Colors.textSecondary} />
                </TouchableOpacity>
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
        marginBottom: Theme.Spacing.xl,
        marginTop: Theme.Spacing.m,
    },
    content: {
        flex: 1,
    },
    subtitle: {
        ...Theme.Typography.subtitle,
        color: Theme.Colors.textSecondary,
        marginBottom: Theme.Spacing.m,
        fontSize: 15,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.Colors.surface,
        padding: Theme.Spacing.m,
        borderRadius: 16,
        marginBottom: Theme.Spacing.m,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Theme.Spacing.m,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        ...Theme.Typography.body,
        fontWeight: '600',
        marginBottom: 4,
    },
    description: {
        ...Theme.Typography.caption,
        lineHeight: 18,
    },
});
