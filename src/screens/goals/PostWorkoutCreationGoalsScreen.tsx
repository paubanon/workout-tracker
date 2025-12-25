import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { GlowCard } from '../../components/GlowCard';
import { TemplateExercise, Exercise } from '../../models';

interface PostWorkoutGoalsParams {
    exercises: { exerciseId: string; exerciseName: string; enabledMetrics: string[]; repsType?: string }[];
}

export const PostWorkoutCreationGoalsScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { colors } = useTheme();
    const { exercises } = route.params as PostWorkoutGoalsParams;
    const [goalsAdded, setGoalsAdded] = useState<Set<string>>(new Set());

    const handleAddGoal = (exercise: { exerciseId: string; exerciseName: string; enabledMetrics: string[]; repsType?: string }) => {
        navigation.navigate('CreateGoal', {
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            enabledMetrics: exercise.enabledMetrics,
            repsType: exercise.repsType
        });
        setGoalsAdded(prev => new Set(prev).add(exercise.exerciseId));
    };

    const handleSkip = () => {
        navigation.goBack();
    };

    const handleDone = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={handleSkip}>
                    <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Set Goals</Text>
                <TouchableOpacity onPress={handleDone}>
                    <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.intro}>
                <Ionicons name="flag" size={48} color={colors.primary} />
                <Text style={[styles.introTitle, { color: colors.text }]}>
                    Set goals for your exercises
                </Text>
                <Text style={[styles.introSubtitle, { color: colors.textMuted }]}>
                    Track progress and celebrate when you hit your targets!
                </Text>
            </View>

            <FlatList
                data={exercises}
                keyExtractor={item => item.exerciseId}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <GlowCard style={styles.card} level="m">
                        <TouchableOpacity
                            style={styles.cardContent}
                            onPress={() => handleAddGoal(item)}
                        >
                            <View style={styles.cardLeft}>
                                <Text style={[styles.exerciseName, { color: colors.text }]}>
                                    {item.exerciseName}
                                </Text>
                                {goalsAdded.has(item.exerciseId) && (
                                    <Text style={[styles.goalAdded, { color: colors.success }]}>
                                        ✓ Goal added
                                    </Text>
                                )}
                            </View>
                            <View style={[styles.addButton, { backgroundColor: colors.primary }]}>
                                <Ionicons name="add" size={20} color="white" />
                            </View>
                        </TouchableOpacity>
                    </GlowCard>
                )}
            />
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
        padding: Theme.Spacing.m,
        borderBottomWidth: 1,
    },
    skipText: {
        fontSize: 17,
    },
    headerTitle: {
        fontSize: Theme.Typography.scale.lg,
        fontWeight: '600',
    },
    doneText: {
        fontSize: 17,
        fontWeight: '600',
    },
    intro: {
        alignItems: 'center',
        padding: Theme.Spacing.l,
    },
    introTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: Theme.Spacing.m,
        textAlign: 'center',
    },
    introSubtitle: {
        fontSize: 14,
        marginTop: Theme.Spacing.s,
        textAlign: 'center',
    },
    list: {
        padding: Theme.Spacing.m,
    },
    card: {
        borderRadius: 12,
        marginBottom: Theme.Spacing.s,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Theme.Spacing.m,
    },
    cardLeft: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 17,
        fontWeight: '500',
    },
    goalAdded: {
        fontSize: 13,
        marginTop: 4,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
