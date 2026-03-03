import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, NativeScrollEvent, NativeSyntheticEvent, TouchableOpacity, Animated } from 'react-native';
import { globalFonts, colors } from '../styles/globalStyles';
import { FontAwesome6 } from '@expo/vector-icons';
import { TRADE_ACTIONS, TradeActionType, TradeActionConfig } from '../config/tradeConfig';
import { LinearGradient } from 'expo-linear-gradient';

export interface TradeAction {
    actionType: TradeActionType;
    subAction?: 'add' | 'remove' | 'write' | 'select';
    data?: unknown;
}

interface TradeUIProps {
    onActionSelected?: (action: TradeAction) => void;
    onQueryToggle?: (isOpen: boolean) => void;
    actions?: TradeActionConfig[];
    isSelectMode?: boolean;
    selectedCount?: number;
    topCardIsSelected?: boolean;
}

const TradeUI: React.FC<TradeUIProps> = ({ onActionSelected, onQueryToggle, actions = TRADE_ACTIONS, isSelectMode = false, selectedCount = 0, topCardIsSelected = false }) => {
    const ITEM_HEIGHT = 54;
    const INITIAL_SCROLL_DELAY = 100;
    const ITEM_VISIBLE_HEIGHT = ITEM_HEIGHT - 8;

    const scrollViewRef = useRef<ScrollView>(null);
    const isScrollingRef = useRef(false);
    const [currentActionIndex, setCurrentActionIndex] = useState(0);
    const [isActionSelected, setIsActionSelected] = useState(false);
    const [isQueryOpen, setIsQueryOpen] = useState(false);
    const currentOffsetRef = useRef(ITEM_HEIGHT * actions.length);

    const shimmerAnim1 = useRef(new Animated.Value(0)).current;
    const shimmerAnim2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const runShimmer = (anim: Animated.Value, delay: number) => {
            anim.setValue(0);
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 4000,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                anim.setValue(0);
                runShimmer(anim, 0);
            });
        };

        runShimmer(shimmerAnim1, 0);
        runShimmer(shimmerAnim2, 1800);
    }, []);

    const shimmerTranslate1 = shimmerAnim1.interpolate({
        inputRange: [0, 1],
        outputRange: [400, -400],
    });

    const shimmerTranslate2 = shimmerAnim2.interpolate({
        inputRange: [0, 1],
        outputRange: [400, -400],
    });

    const infiniteActions = Array(10).fill(actions).flat();
    const currentAction = actions[currentActionIndex];

    const getButtonProps = (isInTopSpot: boolean) => ({
        opacity: isInTopSpot ? 1 : 0.3,
        disabled: !isInTopSpot,
    });

    const playAction = (subAction?: 'add' | 'remove' | 'write' | 'select', index: number = currentActionIndex) => {
        if (!isActionSelected && !subAction) return;

        const tradeAction: TradeAction = {
            actionType: currentAction.actionType,
            subAction,
        };

        onActionSelected?.(tradeAction);

        if (currentAction.actionType !== 'offer' &&
            currentAction.actionType !== 'trade' &&
            currentAction.actionType !== 'rescind') {
            const actualIndex = index % actions.length;
            if (actualIndex === currentActionIndex) {
                setIsActionSelected((prev) => !prev);
            }
        }
    };

    const handleQueryPress = (isInTopSpot: boolean) => {
        if (!isInTopSpot) return;
        const next = !isQueryOpen;
        setIsQueryOpen(next);
        onQueryToggle?.(next);

        // also fire the action so parent knows
        const tradeAction: TradeAction = {
            actionType: 'query',
            subAction: 'write',
        };
        onActionSelected?.(tradeAction);
    };

    const handleActionTextPress = () => {
        const snappedOffset = Math.round(currentOffsetRef.current / ITEM_HEIGHT) * ITEM_HEIGHT;
        const nextOffset = snappedOffset + ITEM_HEIGHT;
        scrollViewRef.current?.scrollTo({ y: nextOffset, animated: true });
        if (isQueryOpen) {
            setIsQueryOpen(false);
            onQueryToggle?.(false);
        }
    };

    const isActionInTopSpot = (index: number) => index % actions.length === currentActionIndex;

    const calculateItemIndex = (offsetY: number): number => {
        let itemIndex = Math.round(offsetY / ITEM_HEIGHT) % actions.length;
        return itemIndex < 0 ? (itemIndex + actions.length) % actions.length : itemIndex;
    };

    useEffect(() => {
        setCurrentActionIndex(0);
        const timer = setTimeout(() => {
            scrollViewRef.current?.scrollTo({
                y: ITEM_HEIGHT * actions.length,
                animated: false,
            });
        }, INITIAL_SCROLL_DELAY);
        return () => clearTimeout(timer);
    }, [actions]);

    const handleScrollBeginDrag = () => {
        isScrollingRef.current = true;
        setIsActionSelected(false);
        if (isQueryOpen) {
            setIsQueryOpen(false);
            onQueryToggle?.(false);
        }
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        currentOffsetRef.current = event.nativeEvent.contentOffset.y;
        const offsetY = event.nativeEvent.contentOffset.y;
        const itemIndex = calculateItemIndex(offsetY);
        if (itemIndex !== currentActionIndex) {
            setIsActionSelected(false);
            setCurrentActionIndex(itemIndex);
        }
    };

    const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!isScrollingRef.current) return;
        const offsetY = event.nativeEvent.contentOffset.y;
        const contentHeight = ITEM_HEIGHT * actions.length;
        if (offsetY < contentHeight * 2) {
            const newOffset = offsetY + contentHeight * 5;
            scrollViewRef.current?.scrollTo({ y: newOffset, animated: false });
            setCurrentActionIndex(calculateItemIndex(newOffset));
        } else if (offsetY >= contentHeight * 8) {
            const newOffset = offsetY - contentHeight * 5;
            scrollViewRef.current?.scrollTo({ y: newOffset, animated: false });
            setCurrentActionIndex(calculateItemIndex(newOffset));
        }
        isScrollingRef.current = false;
    };

    const renderActionButton = (action: TradeActionConfig, isInTopSpot: boolean) => {
        if (!action.hasButtons) return null;
        const { opacity, disabled } = getButtonProps(isInTopSpot);

        switch (action.actionType) {
            case 'counter':
                return (
                    <>
                        <TouchableOpacity
                            style={[styles.counterMinusButton, { opacity, borderColor: currentAction?.color }]}
                            onPress={() => playAction('add')}
                            disabled={disabled}
                        >
                            <FontAwesome6 name="plus" size={22} color={currentAction?.color} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.counterPlusButton, { opacity, borderColor: currentAction?.color }]}
                            onPress={() => playAction('remove')}
                            disabled={disabled}
                        >
                            <FontAwesome6 name="minus" size={22} color={currentAction?.color} />
                        </TouchableOpacity>
                    </>
                );
            case 'query':
                return (
                    <TouchableOpacity
                        style={[
                            styles.queryButton,
                            {
                                opacity,
                                borderColor: currentAction?.color,
                                backgroundColor: isQueryOpen && isInTopSpot
                                    ? currentAction?.color + '50'
                                    : 'transparent',
                            },
                        ]}
                        onPress={() => handleQueryPress(isInTopSpot)}
                        disabled={disabled}
                    >
                        <FontAwesome6 name="question" size={26} color={currentAction?.color} />
                    </TouchableOpacity>
                );
            case 'offer':
                return (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.selectButton, {
                            opacity,
                            borderColor: currentAction?.color,
                            backgroundColor: topCardIsSelected ? currentAction?.color + '50' : 'transparent',
                        }]}
                        onPress={() => playAction('write')}
                        disabled={disabled}
                    >
                        <Text style={[styles.buttonText, { color: colors.actions.offer }]}>
                            {String(selectedCount).padStart(2, '0')}
                        </Text>
                        <FontAwesome6
                            name={topCardIsSelected ? 'circle-check' : 'circle-dot'}
                            size={26}
                            color={currentAction?.color}
                        />
                    </TouchableOpacity>
                );
            case 'trade':
                return (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.selectButton, {
                            opacity,
                            borderColor: currentAction?.color,
                            backgroundColor: topCardIsSelected ? currentAction?.color + '50' : 'transparent',
                        }]}
                        onPress={() => playAction('write')}
                        disabled={disabled}
                    >
                        <Text style={[styles.buttonText, { color: currentAction?.color }]}>
                            {String(selectedCount).padStart(2, '0')}
                        </Text>
                        <FontAwesome6
                            name={topCardIsSelected ? 'circle-check' : 'circle-dot'}
                            size={26}
                            color={currentAction?.color}
                        />
                    </TouchableOpacity>
                );
            case 'where':
                return (
                    <TouchableOpacity
                        style={[styles.actionButton, { opacity, borderColor: currentAction?.color }]}
                        onPress={() => playAction('select')}
                        disabled={disabled}
                    >
                        <FontAwesome6 name="location-dot" size={22} color={currentAction?.color} />
                    </TouchableOpacity>
                );
            case 'when':
                return (
                    <TouchableOpacity
                        style={[styles.actionButton, { opacity, borderColor: currentAction?.color }]}
                        onPress={() => playAction('select')}
                        disabled={disabled}
                    >
                        <FontAwesome6 name="clock" size={22} color={currentAction?.color} />
                    </TouchableOpacity>
                );
            case 'verify':
                return (
                    <TouchableOpacity
                        style={[styles.actionButton, { opacity, borderColor: currentAction?.color }]}
                        onPress={() => playAction('select')}
                        disabled={disabled}
                    >
                        <FontAwesome6 name="camera" size={22} color={currentAction?.color} />
                    </TouchableOpacity>
                );
            case 'rescind':
                return (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.selectButton, {
                            opacity,
                            borderColor: currentAction?.color,
                            backgroundColor: topCardIsSelected ? currentAction?.color + '50' : 'transparent',
                        }]}
                        onPress={() => playAction('write')}
                        disabled={disabled}
                    >
                        <Text style={[styles.buttonText, { color: currentAction?.color }]}>
                            {String(selectedCount).padStart(2, '0')}
                        </Text>
                        <FontAwesome6
                            name={topCardIsSelected ? 'circle-check' : 'circle-dot'}
                            size={26}
                            color={currentAction?.color}
                        />
                    </TouchableOpacity>
                );
            case 'play':
                return null;
            case 'wait':
                return null;
            case 'cancel':
                return null;
            default:
                return (
                    <TouchableOpacity
                        style={[styles.actionButton, { opacity, borderColor: currentAction?.color }]}
                        onPress={() => playAction('select')}
                        disabled={disabled}
                    >
                        <FontAwesome6 name="check" size={26} color={currentAction?.color} />
                    </TouchableOpacity>
                );
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <View style={[styles.scrollViewContainer, { height: ITEM_VISIBLE_HEIGHT }]}>
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.scrollView}
                        snapToInterval={ITEM_HEIGHT}
                        snapToAlignment="start"
                        decelerationRate="fast"
                        showsVerticalScrollIndicator={false}
                        onScrollBeginDrag={handleScrollBeginDrag}
                        onScroll={handleScroll}
                        onMomentumScrollEnd={handleMomentumScrollEnd}
                        scrollEventThrottle={16}
                    >
                        {infiniteActions.map((action, index) => {
                            const isInTopSpot = isActionInTopSpot(index);
                            return (
                                <View key={index} style={styles.tradeLine}>
                                    {renderActionButton(action, isInTopSpot)}
                                    <TouchableOpacity onPress={handleActionTextPress}>
                                        <Text style={[styles.tradeLineText, { color: action.color }]}>
                                            {action.text}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>

                <TouchableOpacity
                    style={[
                        styles.playButton,
                        {
                            backgroundColor: isActionSelected ? currentAction?.color : 'transparent',
                            borderColor: currentAction?.color,
                            shadowColor: currentAction?.color,
                        },
                    ]}
                    onPress={() => playAction()}
                    disabled={!isActionSelected}
                >
                    <FontAwesome6
                        name="arrow-left-long"
                        size={26}
                        color={isActionSelected ? '#000' : currentAction?.color}
                    />
                </TouchableOpacity>
            </View>

            {/* shimmer overlay */}
            <View pointerEvents="none" style={styles.shimmerOverlay}>
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            transform: [
                                { translateX: shimmerTranslate1 },
                                { skewX: '45deg' },
                            ],
                        },
                    ]}
                >
                    <LinearGradient
                        colors={[
                            currentAction?.color + '00',
                            currentAction?.color + '66',
                            currentAction?.color + '00',
                        ]}
                        locations={[0, 0.3, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>

                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            transform: [
                                { translateX: shimmerTranslate2 },
                                { skewX: '45deg' },
                            ],
                        },
                    ]}
                >
                    <LinearGradient
                        colors={[
                            currentAction?.color + '00',
                            currentAction?.color + '66',
                            currentAction?.color + '00',
                        ]}
                        locations={[0, 0.3, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'flex-start',
        width: '100%',
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        gap: 4,
    },
    scrollViewContainer: {
        overflow: 'hidden',
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    tradeLine: {
        flexDirection: 'row',
        gap: 2,
        height: 64,
        alignItems: 'center',
        marginBottom: -10,
        justifyContent: 'flex-end',
    },
    tradeLineText: {
        fontSize: 48,
        fontFamily: globalFonts.extrabold,
        bottom: 18,
        letterSpacing: -2,
    },
    playButton: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        width: 50,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 25,
        borderTopRightRadius: 25,
        borderBottomRightRadius: 2,
        borderWidth: 3,
    },
    shimmerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 25,
        borderTopRightRadius: 25,
        borderBottomRightRadius: 2,
        overflow: 'hidden',
        zIndex: 10,
    },
    actionButton: {
        justifyContent: 'flex-end',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 8,
        height: 40,
        flex: 1,
        bottom: 12,
        borderWidth: 3,
        borderTopRightRadius: 25,
        borderBottomRightRadius: 25,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 25,
    },
    counterMinusButton: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        height: 40,
        bottom: 12,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 2,
        borderTopRightRadius: 2,
        borderWidth: 3,
        borderColor: colors.actions.counter,
    },
    counterPlusButton: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        height: 40,
        bottom: 12,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 25,
        borderTopRightRadius: 25,
        borderWidth: 3,
        borderColor: colors.actions.counter,
    },
    queryButton: {
        justifyContent: 'flex-end',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 10,
        height: 40,
        flex: 1,
        bottom: 12,
        borderWidth: 3,
        borderTopRightRadius: 25,
        borderBottomRightRadius: 25,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 25,
    },
    locationButton: {
        flex: 1,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        borderColor: colors.actions.location,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
    },
    verifyButton: {
        flex: 1,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        borderColor: colors.actions.verify,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
    },
    stallButton: {
        flex: 1,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        borderColor: colors.actions.stall,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
    },
    timeButton: {
        flex: 1,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        borderColor: colors.actions.time,
        justifyContent: 'flex-end',
    },
    selectButton: {
        flex: 1,
        height: 40,
        borderTopRightRadius: 25,
        borderBottomRightRadius: 25,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 25,
        borderWidth: 3,
        justifyContent: 'flex-end',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 4,
        paddingHorizontal: 4,
    },
    buttonText: {
        fontSize: 20,
        fontFamily: globalFonts.bold,
    },
});

export default TradeUI;