import React, { useRef, useEffect, useState } from 'react';
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
    onActionSelected: (action: TradeAction) => void;
    actions?: TradeActionConfig[];
    /** The action currently armed in the trade state machine (null if nothing armed yet) */
    activeActionType: TradeActionType | null;
    /** Whether the armed action has everything it needs to confirm (drives the arrow) */
    isReady: boolean;
    selectedCount: number;
    /** Whether the post currently on top of the player's deck is among the selected posts */
    topCardIsSelected: boolean;
    isQueryMode: boolean;
    queryPostSelected: boolean;
    onQueryPostSelect: () => void;
    onQueryPostDeselect: () => void;
    onActionChange?: (actionType: TradeActionType) => void;
}

// ─── Button pattern helpers ───────────────────────────────────────────────────

interface SelectButtonProps {
    color: string;
    isActive: boolean;
    selectedCount: number;
    onPress: () => void;
    disabled: boolean;
}

const SelectButton: React.FC<SelectButtonProps> = ({ color, isActive, selectedCount, onPress, disabled }) => (
    <TouchableOpacity
        activeOpacity={1}
        style={[styles.actionButton, styles.selectButton, {
            borderColor: color,
            backgroundColor: isActive ? color : 'transparent',
        }]}
        onPress={onPress}
        disabled={disabled}
    >
        <Text style={[styles.timerText, { color: isActive ? '#000' : color }]}>
            {String(selectedCount).padStart(2, '0')}
        </Text>
        <FontAwesome6 name={isActive ? 'circle-check' : 'circle'} size={26} color={isActive ? '#000' : color} />
    </TouchableOpacity>
);

interface IconButtonProps {
    color: string;
    isActive: boolean;
    icon: string;
    iconSize?: number;
    onPress: () => void;
    disabled: boolean;
    fillOnActive?: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({ color, isActive, icon, iconSize = 26, onPress, disabled, fillOnActive = false }) => (
    <TouchableOpacity
        activeOpacity={1}
        style={[styles.actionButton, {
            borderColor: color,
            backgroundColor: fillOnActive && isActive ? color : 'transparent',
        }]}
        onPress={onPress}
        disabled={disabled}
    >
        <FontAwesome6 name={icon} size={iconSize} color={fillOnActive && isActive ? '#000' : color} />
    </TouchableOpacity>
);

interface TimerButtonProps {
    color: string;
    isActive: boolean;
    onPress?: () => void;
    disabled: boolean;
}

const TIMER_DURATION_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

const TimerButton: React.FC<TimerButtonProps> = ({ color, isActive, onPress, disabled }) => {
    // In real usage, startTime would come from props/store. We simulate a fixed 2-day countdown from now.
    const [remaining, setRemaining] = useState(TIMER_DURATION_MS);

    useEffect(() => {
        const tick = setInterval(() => {
            setRemaining(prev => Math.max(0, prev - 1000));
        }, 1000);
        return () => clearInterval(tick);
    }, []);

    const totalSecs = Math.floor(remaining / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const label = hours > 0
        ? `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
        : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const filled = isActive && !!onPress;

    const btnStyle = [styles.actionButton, { borderColor: color, backgroundColor: filled ? color : 'transparent', gap: 6 }];
    const iconColor = filled ? '#000' : color;
    const content = (
        <>
            <Text style={[styles.timerText, { color: iconColor }]}>{label}</Text>
            <FontAwesome6 name="clock" size={26} color={iconColor} />
        </>
    );

    if (!onPress) return <View style={btnStyle}>{content}</View>;
    return <TouchableOpacity activeOpacity={1} style={btnStyle} onPress={onPress} disabled={disabled}>{content}</TouchableOpacity>;
};

// Icons for the simple "arm on tap" actions. Once armed (activeActionType
// matches), the icon swaps to a check regardless of what's listed here.
const SIMPLE_ICONS: Partial<Record<TradeActionType, { icon: string; size?: number }>> = {
    where:  { icon: 'circle-dot' },
    when:   { icon: 'clock' },
    verify: { icon: 'camera-rotate', size: 22 },
    stall:  { icon: 'circle' },
    accept: { icon: 'circle' },
    acceptFinal: { icon: 'circle' },
    decline: { icon: 'circle' },
};

// ─── Component ────────────────────────────────────────────────────────────────

const TradeUI: React.FC<TradeUIProps> = ({
    onActionSelected,
    actions = TRADE_ACTIONS,
    activeActionType,
    isReady,
    selectedCount = 0,
    topCardIsSelected = false,
    isQueryMode = false,
    queryPostSelected = false,
    onQueryPostSelect,
    onQueryPostDeselect,
    onActionChange,
}) => {
    const ITEM_HEIGHT = 54;
    const INITIAL_SCROLL_DELAY = 100;
    const ITEM_VISIBLE_HEIGHT = ITEM_HEIGHT - 8;
    const PLAY_FILL_HOLD_MS = 400;

    const scrollViewRef = useRef<ScrollView>(null);
    const isScrollingRef = useRef(false);
    const [currentActionIndex, setCurrentActionIndex] = useState(0);
    const currentOffsetRef = useRef(ITEM_HEIGHT * actions.length);

    // Brief tactile fill on tap (held for PLAY_FILL_HOLD_MS) — purely a
    // press-feedback flourish for fast devices/fast network conditions.
    const [isPlayPressed, setIsPlayPressed] = useState(false);
    const playPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // True for the entire duration of an in-flight confirm — from the
    // moment the arrow is tapped until the parent's handleConfirm actually
    // resolves and resets the trade state. Unlike isPlayPressed, this has
    // no fixed timer; it's cleared only by the activeActionType/isReady
    // reset effect below, so the fill can never "time out" before the real
    // network call finishes — which was the root cause of the colored
    // (unfilled) arrow flashing during slow requests.
    const [isPlaySubmitting, setIsPlaySubmitting] = useState(false);

    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const runShimmer = (anim: Animated.Value, delay: number) => {
            anim.setValue(0);
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(anim, { toValue: 1, duration: 4000, useNativeDriver: true }),
            ]).start(() => { anim.setValue(0); runShimmer(anim, 1000); });
        };
        runShimmer(shimmerAnim, 0);
    }, []);

    const shimmerTranslate = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [400, -400] });

    const infiniteActions = Array(10).fill(actions).flat();
    const currentAction = actions[currentActionIndex];

    const isInTopSpot = (index: number) => index % actions.length === currentActionIndex;

    const calculateItemIndex = (offsetY: number): number => {
        const i = Math.round(offsetY / ITEM_HEIGHT) % actions.length;
        return i < 0 ? (i + actions.length) % actions.length : i;
    };

    const handleQueryPress = (active: boolean) => {
        if (!active) return;

        // Arm 'query' first — setSubflowData is a no-op until activeAction
        // is already 'query', so this must come before the select/deselect call.
        onActionSelected({ actionType: 'query', subAction: 'write' });

        if (queryPostSelected) {
            onQueryPostDeselect();
        } else {
            onQueryPostSelect();
        }
    };

    const handleActionTextPress = () => {
        const snapped = Math.round(currentOffsetRef.current / ITEM_HEIGHT) * ITEM_HEIGHT;
        scrollViewRef.current?.scrollTo({ y: snapped + ITEM_HEIGHT, animated: true });
    };

    useEffect(() => {
        setCurrentActionIndex(0);
        const t = setTimeout(() => scrollViewRef.current?.scrollTo({ y: ITEM_HEIGHT * actions.length, animated: false }), INITIAL_SCROLL_DELAY);
        return () => clearTimeout(t);
    }, [actions]);

    const handleScrollBeginDrag = () => {
        isScrollingRef.current = true;
        // Leaving the wheel away from an in-progress query clears the
        // selected partner post, so a stale pick doesn't carry over.
        if (queryPostSelected) onQueryPostDeselect?.();
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        currentOffsetRef.current = offsetY;
        const itemIndex = calculateItemIndex(offsetY);
        if (itemIndex !== currentActionIndex) {
            setCurrentActionIndex(itemIndex);
            onActionChange?.(actions[itemIndex].actionType);
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

    const renderActionButton = (action: TradeActionConfig, active: boolean) => {
        if (!action.hasButtons) return null;
        const color = currentAction?.color;
        const disabled = !active;
        const opacity = active ? 1 : 0.3;
        const isArmed = action.actionType === activeActionType;

        // Multi-select: offer / barter / rescind — icon tap toggles the
        // current top card; fills once that specific card is selected.
        if (['offer', 'barter', 'rescind'].includes(action.actionType)) {
            return (
                <SelectButton
                    color={color}
                    isActive={active && isArmed && topCardIsSelected}
                    selectedCount={selectedCount}
                    onPress={() => onActionSelected({ actionType: action.actionType, subAction: 'write' })}
                    disabled={disabled}
                />
            );
        }

        // Counter: dedicated +/- buttons instead of a single icon
        if (action.actionType === 'counter') {
            return (
                <>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.counterMinusButton, { opacity, borderColor: color }]}
                        onPress={() => onActionSelected({ actionType: action.actionType, subAction: 'remove' })}
                        disabled={disabled}
                    >
                        <FontAwesome6 name="minus" size={22} color={color} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.counterPlusButton, { opacity, borderColor: color }]}
                        onPress={() => onActionSelected({ actionType: action.actionType, subAction: 'add' })}
                        disabled={disabled}
                    >
                        <FontAwesome6 name="plus" size={22} color={color} />
                    </TouchableOpacity>
                </>
            );
        }

        // Query: select a partner post, then type a question (TradeTurns)
        if (action.actionType === 'query') {
            return (
                <TouchableOpacity
                    activeOpacity={1}
                    style={[
                        styles.actionButton,
                        {
                            borderColor: color,
                            backgroundColor: queryPostSelected && active ? color : 'transparent',
                        },
                    ]}
                    onPress={() => handleQueryPress(active)}
                    disabled={disabled}
                >
                    <FontAwesome6
                        name={queryPostSelected ? 'circle-question' : 'circle'}
                        size={26}
                        color={queryPostSelected ? '#000' : color}
                    />
                </TouchableOpacity>
            );
        }

        // Play / Wait: countdown timer display
        if (action.actionType === 'play') {
            return (
                <TimerButton
                    color={color}
                    isActive={active && isArmed}
                    onPress={() => onActionSelected({ actionType: action.actionType, subAction: 'write' })}
                    disabled={disabled}
                />
            );
        }
        if (action.actionType === 'wait') {
            return <TimerButton color={color} isActive={false} disabled={true} />;
        }

        // Everything else: where, when, verify, stall, accept, acceptFinal,
        // decline — a single icon that fills and swaps to a check once armed.
        const mapped = SIMPLE_ICONS[action.actionType];
        return (
            <IconButton
                color={color}
                isActive={active && isArmed}
                icon={(active && isArmed) ? 'circle-check' : (mapped?.icon ?? 'circle')}
                iconSize={mapped?.size}
                onPress={() => onActionSelected({ actionType: action.actionType, subAction: 'write' })}
                disabled={disabled}
                fillOnActive
            />
        );
    };

    // Arrow only shows once the wheel is scrolled to the action that's
    // actually armed, and that action has everything it needs to confirm.
    const isOnArmedAction = activeActionType !== null && activeActionType === currentAction?.actionType;
    const showArrow = isOnArmedAction && isReady;

    // Keep showing a filled arrow through the entire press-hold AND
    // in-flight-submit window, even if showArrow flips false underneath
    // mid-fill — otherwise there's a flash of unfilled colored arrow
    // between the fill ending and the arrow actually disappearing.
    const arrowVisible = showArrow || isPlayPressed || isPlaySubmitting;
    const isFilled = isPlayPressed || isPlaySubmitting;

    useEffect(() => {
        setIsPlayPressed(false);
        setIsPlaySubmitting(false);
        if (playPressTimeoutRef.current) {
            clearTimeout(playPressTimeoutRef.current);
            playPressTimeoutRef.current = null;
        }
    }, [activeActionType, isReady]);

    useEffect(() => {
        return () => {
            if (playPressTimeoutRef.current) clearTimeout(playPressTimeoutRef.current);
        };
    }, []);

    const handlePlayPressIn = () => {
        if (!showArrow) return;
        if (playPressTimeoutRef.current) {
            clearTimeout(playPressTimeoutRef.current);
            playPressTimeoutRef.current = null;
        }
        setIsPlayPressed(true);
    };

    const handlePlayPressOut = () => {
        // Hold the brief tactile fill for a beat after release — onPressOut
        // alone is too short to register visually. This is independent of
        // isPlaySubmitting, which takes over for the actual network wait.
        playPressTimeoutRef.current = setTimeout(() => setIsPlayPressed(false), PLAY_FILL_HOLD_MS);
    };

    const handlePlayPress = () => {
        if (!showArrow || !currentAction || isPlaySubmitting) return;
        setIsPlaySubmitting(true);
        onActionSelected({ actionType: currentAction.actionType, subAction: 'select' });
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
                            const active = isInTopSpot(index);
                            return (
                                <View key={index} style={styles.tradeLine}>
                                    {renderActionButton(action, active)}
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
                    activeOpacity={1}
                    style={[styles.playButton, {
                        backgroundColor: arrowVisible && isFilled ? currentAction?.color : 'transparent',
                        borderColor: currentAction?.color,
                        shadowColor: currentAction?.color,
                    }]}
                    onPress={handlePlayPress}
                    onPressIn={handlePlayPressIn}
                    onPressOut={handlePlayPressOut}
                    disabled={!showArrow || isPlaySubmitting}
                >
                    {arrowVisible && (
                        <FontAwesome6
                            name="arrow-left-long"
                            size={22}
                            color={isFilled ? '#000' : currentAction?.color}
                        />
                    )}
                </TouchableOpacity>
            </View>

            <View pointerEvents="none" style={styles.shimmerOverlay}>
                <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: shimmerTranslate }, { skewX: '315deg' }] }]}>
                    <LinearGradient
                        colors={[currentAction?.color + '00', currentAction?.color + '50', currentAction?.color + '00']}
                        locations={[0, 0.1, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            </View>
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const BORDER_RADIUS = { tl2br25: { borderTopLeftRadius: 2, borderBottomLeftRadius: 25 }, tr25bl2: { borderTopRightRadius: 25, borderBottomRightRadius: 2 } };

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'flex-start', width: '100%', overflow: 'hidden' },
    row: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 4 },
    scrollViewContainer: { overflow: 'hidden', flex: 1 },
    scrollView: { flex: 1 },
    tradeLine: { flexDirection: 'row', gap: 2, height: 64, alignItems: 'center', marginBottom: -10, justifyContent: 'flex-end' },
    tradeLineText: { fontSize: 56, fontFamily: globalFonts.extrabold, bottom: 13, letterSpacing: -3 },
    playButton: {
        justifyContent: 'center', alignItems: 'center', height: 40, width: 50,
        borderTopLeftRadius: 2, borderBottomLeftRadius: 25, borderTopRightRadius: 25, borderBottomRightRadius: 2, borderWidth: 3,
    },
    shimmerOverlay: {
        position: 'absolute', top: 0, right: 0, width: 50, height: 40, overflow: 'hidden', zIndex: 10,
        borderTopLeftRadius: 2, borderBottomLeftRadius: 25, borderTopRightRadius: 25, borderBottomRightRadius: 2,
    },
    actionButton: {
        justifyContent: 'flex-end', alignItems: 'center', flexDirection: 'row', paddingHorizontal: 4,
        height: 40, flex: 1, bottom: 12, borderWidth: 3,
        borderTopRightRadius: 25, borderBottomRightRadius: 25, borderTopLeftRadius: 2, borderBottomLeftRadius: 25,
    },
    selectButton: { gap: 4 },
    counterMinusButton: {
        justifyContent: 'center', alignItems: 'center', flex: 1, height: 40, bottom: 12, borderWidth: 3,
        borderTopLeftRadius: 2, borderBottomLeftRadius: 25, borderBottomRightRadius: 2, borderTopRightRadius: 2,
        borderColor: colors.actions.counter,
    },
    counterPlusButton: {
        justifyContent: 'center', alignItems: 'center', flex: 1, height: 40, bottom: 12, borderWidth: 3,
        borderTopLeftRadius: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 25, borderTopRightRadius: 25,
        borderColor: colors.actions.counter,
    },
    timerText: { fontSize: 20, fontFamily: globalFonts.bold },
});

export default TradeUI;