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

    const [active, setActive] = useState<'offers' | 'trades' | 'deals' | 'queries'>('offers');
    const handleQueries = () => {
        setActive('queries');
        onQueriesPress?.();
    };

    const handleOffers = () => {
        setActive('offers');
        onOffersPress?.();
    };

    const handleTrades = () => {
        setActive('trades');
        onTradesPress?.();
    };

    const handleDeals = () => {
        setActive('deals');
        onDealsPress?.();
    };

    return (
        <View style={styles.topBarContainer}>
            <TouchableOpacity style={styles.queriesButton} onPress={handleQueries}>
                <Text
                    style={[
                        styles.buttonText,
                        { color: active === 'queries' ? colors.actions.query : colors.ui.secondarydisabled }
                    ]}
                >
                    QUERIES
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.offersButton} onPress={handleOffers}>
                <Text
                    style={[
                        styles.buttonText,
                        { color: active === 'offers' ? colors.actions.offer : colors.ui.secondarydisabled }
                    ]}
                >
                    OFFERS
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tradesButton} onPress={handleTrades}>
                <Text
                    style={[
                        styles.buttonText,
                        { color: active === 'trades' ? colors.actions.trade : colors.ui.secondarydisabled }
                    ]}
                >
                    TRADES
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dealsButton} onPress={handleDeals}>
                <Text
                    style={[
                        styles.buttonText,
                        { color: active === 'deals' ? colors.actions.accept : colors.ui.secondarydisabled }
                    ]}
                >
                    DEALS
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
        paddingBottom: 80,
        paddingTop: 8,
        gap: 4,
    },
    queriesButton: {
        flex: 1,
        height: 36,
        borderTopLeftRadius: 2,
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
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        backgroundColor: colors.ui.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tradesButton: {
        flex: 1,
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
        borderTopRightRadius: 2,
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