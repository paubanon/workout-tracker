import React from 'react';
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface GlowCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    level?: 's' | 'm' | 'l';
}

/**
 * GlowCard - A card component with top-down lighting effect for dark mode
 * 
 * In dark mode: Creates a gradient from slightly lighter (top) to base color (bottom)
 * Plus a dark shadow casting downward, simulating light from above.
 * 
 * In light mode: Uses standard shadows for depth.
 */
export const GlowCard: React.FC<GlowCardProps> = ({
    children,
    style,
    level = 'm'
}) => {
    const { colors, isDark } = useTheme();

    // Gradient config - set to 0 to disable gradient effect
    const gradientConfig = {
        s: {
            topColor: 'rgba(255,255,255,0.12)',
            bottomColor: 'transparent',
            height: 0,
        },
        m: {
            topColor: 'rgba(255,255,255,0.18)',
            bottomColor: 'transparent',
            height: 0,
        },
        l: {
            topColor: 'rgba(255,255,255,0.25)',
            bottomColor: 'transparent',
            height: 0,
        }
    };

    const config = gradientConfig[level];
    const shadowStyle = isDark ? Theme.TopLight[level] : Theme.Shadows.light[level];

    if (isDark) {
        return (
            <View style={[styles.container, { backgroundColor: colors.surface }, shadowStyle, style]}>
                <LinearGradient
                    colors={[config.topColor, config.bottomColor]}
                    style={[styles.gradientOverlay, { height: config.height }]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
                {children}
            </View>
        );
    }

    // Light mode - just use shadow, no gradient needed
    return (
        <View style={[styles.container, { backgroundColor: colors.surface }, shadowStyle, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
});
