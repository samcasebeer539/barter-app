import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { globalFonts, colors } from '../styles/globalStyles';
import { useState } from 'react';

interface OffersTradesDealsBarProps {
    onQueriesPress?: () => void;
    onOffersPress?: () => void;
    onTradesPress?: () => void;
    onDealsPress?: () => void;
}

export default function OffersTradesDealsBar({
    onQueriesPress,
    onOffersPress,
    onTradesPress,
    onDealsPress,
}: OffersTradesDealsBarProps) {

    const [active, setActive] = useState<'open' | 'barter' | 'close'>('open');

    const handleOffers = () => {
        setActive('open');
        onOffersPress?.();
    };

    const handleTrades = () => {
        setActive('barter');
        onTradesPress?.();
    };

    const handleDeals = () => {
        setActive('close');
        onDealsPress?.();
    };

    return (
        <View style={styles.topBarContainer}>
            <TouchableOpacity style={styles.queriesButton} onPress={handleOffers}>
                <Text
                    style={[
                        styles.buttonText,
                        { color: active === 'open' ? '#fff' : colors.ui.secondarydisabled }
                    ]}
                >
                    OPEN
                </Text>
            </TouchableOpacity>

      
            <TouchableOpacity style={styles.tradesButton} onPress={handleTrades}>
                <Text
                    style={[
                        styles.buttonText,
                        { color: active === 'barter' ? '#fff' : colors.ui.secondarydisabled }
                    ]}
                >
                    BARTER
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dealsButton} onPress={handleDeals}>
                <Text
                    style={[
                        styles.buttonText,
                        { color: active === 'close' ? '#fff' : colors.ui.secondarydisabled }
                    ]}
                >
                    CLOSE
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    topBarContainer: {
        backgroundColor: colors.ui.background,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        zIndex: 10,
        paddingBottom: 72,
        paddingTop: 8,
        gap: 4,
        borderTopLeftRadius: 34,
        borderTopRightRadius: 34,

    },
    queriesButton: {
        flex: 1,
        height: 36,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 2,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        backgroundColor: colors.ui.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    offersButton: {
        flex: 1,
        height: 36,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 2,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        backgroundColor: colors.ui.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tradesButton: {
        width: 126,
        height: 36,
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        backgroundColor: colors.ui.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dealsButton: {
        flex: 1,
        height: 36,
        borderTopLeftRadius: 2,
        borderTopRightRadius: 22,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        backgroundColor: colors.ui.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 20,
        color: colors.actions.offer,
        fontFamily: globalFonts.bold,
    },
});