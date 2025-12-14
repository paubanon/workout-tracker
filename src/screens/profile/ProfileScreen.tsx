import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../theme';

export const ProfileScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={Theme.Typography.title}>Profile</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Theme.Colors.background,
    },
});
