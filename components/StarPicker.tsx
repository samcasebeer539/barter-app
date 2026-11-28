import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { colors } from '../styles/globalStyles';

interface StarPickerProps {
    /** 1-5, or null for none picked yet. */
    rating: number | null;
    onChange: (rating: number) => void;
    color?: string;
}

// REVIEW's star row: a box with both top corners rounded, sitting above the
// review text box. Tap a star to rate that many.
export default function StarPicker({ rating, onChange, color = colors.actions.review }: StarPickerProps) {
    return (
        <View style={[styles.box, { borderColor: color }]}>
            {[1, 2, 3, 4, 5].map(n => {
                const filled = rating !== null && n <= rating;
                return (
                    <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`} accessibilityState={{ selected: rating === n }}>
                        <FontAwesome6 name="star" size={24} color={color} solid={filled} />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    box: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        borderWidth: 3,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        paddingVertical: 6,
        minHeight: 40,
    },
});
