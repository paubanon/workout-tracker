import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

export const CreateScreen = () => {
    const navigation = useNavigation<any>();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={Theme.Typography.title}>Create</Text>
            </View>

            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('CreateWorkout')}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name="add-circle" size={32} color={Theme.Colors.primary} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.cardTitle}>New Routine</Text>
                        <Text style={styles.cardDesc}>Create a reusable workout template</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={Theme.Colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('CreateExercise')}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name="barbell" size={32} color={Theme.Colors.primary} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.cardTitle}>New Exercise</Text>
                        <Text style={styles.cardDesc}>Add a custom movement to your database.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={Theme.Colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('ExerciseList')}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name="list" size={32} color={Theme.Colors.primary} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.cardTitle}>Exercise Library</Text>
                        <Text style={styles.cardDesc}>Manage your exercises</Text>
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
    },
    header: {
        paddingHorizontal: Theme.Spacing.m,
        paddingBottom: Theme.Spacing.m,
        paddingTop: Theme.Spacing.s,
    },
    content: {
        padding: Theme.Spacing.m,
        flex: 1,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.Colors.surface,
        padding: Theme.Spacing.m,
        borderRadius: 12,
        marginBottom: Theme.Spacing.m,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Theme.Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Theme.Spacing.m,
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 4,
        color: Theme.Colors.text,
    },
    cardDesc: {
        fontSize: 14,
        color: Theme.Colors.textSecondary,
    },
});
