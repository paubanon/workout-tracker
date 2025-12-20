import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { GlowCard } from '../../components/GlowCard';

export const CreateScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, isDark } = useTheme();

    // Dynamic Styles
    const containerStyle = { backgroundColor: colors.background };
    const cardStyle = { backgroundColor: colors.surface };
    const shadowStyle = isDark ? Theme.TopLight.m : Theme.Shadows.light.m;
    const textStyle = { color: colors.text };
    const textMutedStyle = { color: colors.textMuted };

    // Icon container - lighter bg with shadow for depth
    const iconBgStyle = { backgroundColor: isDark ? colors.bgLight : colors.surface };
    const iconShadowStyle = isDark ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
    } : Theme.Shadows.light.s;

    return (
        <SafeAreaView style={[styles.container, containerStyle]} edges={['top']}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, textStyle]}>Create</Text>
            </View>

            <View style={styles.content}>
                <GlowCard style={styles.card} level="m">
                    <TouchableOpacity
                        style={styles.cardContent}
                        onPress={() => navigation.navigate('CreateWorkout')}
                    >
                        <View style={[styles.iconContainer, iconBgStyle, iconShadowStyle]}>
                            <Ionicons name="add-circle" size={32} color={colors.primary} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.cardTitle, textStyle]}>New Routine</Text>
                            <Text style={[styles.cardDesc, textMutedStyle]}>Create a reusable workout template</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                </GlowCard>

                <GlowCard style={styles.card} level="m">
                    <TouchableOpacity
                        style={styles.cardContent}
                        onPress={() => navigation.navigate('CreateExercise')}
                    >
                        <View style={[styles.iconContainer, iconBgStyle, iconShadowStyle]}>
                            <Ionicons name="barbell" size={32} color={colors.primary} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.cardTitle, textStyle]}>New Exercise</Text>
                            <Text style={[styles.cardDesc, textMutedStyle]}>Add a custom movement to your database.</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                </GlowCard>

                <GlowCard style={styles.card} level="m">
                    <TouchableOpacity
                        style={styles.cardContent}
                        onPress={() => navigation.navigate('ExerciseList')}
                    >
                        <View style={[styles.iconContainer, iconBgStyle, iconShadowStyle]}>
                            <Ionicons name="list" size={32} color={colors.primary} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.cardTitle, textStyle]}>Exercise Library</Text>
                            <Text style={[styles.cardDesc, textMutedStyle]}>Manage your exercises</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                </GlowCard>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Theme.Spacing.m,
        paddingBottom: Theme.Spacing.m,
        paddingTop: Theme.Spacing.s,
    },
    headerTitle: {
        fontSize: Theme.Typography.scale.xl,
        fontWeight: 'bold',
    },
    content: {
        padding: Theme.Spacing.m,
        flex: 1,
    },
    card: {
        borderRadius: 12,
        marginBottom: Theme.Spacing.m,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.Spacing.m,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Theme.Spacing.m,
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: Theme.Typography.scale.md,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: Theme.Typography.scale.sm,
    },
});
