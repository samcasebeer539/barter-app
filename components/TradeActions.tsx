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
    isQueryMode?: boolean;
    queryPostSelected?: boolean;
    onQueryPostSelect?: () => void;
    onQueryPostDeselect?: () => void;
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
    return <TouchableOpacity style={btnStyle} onPress={onPress} disabled={disabled}>{content}</TouchableOpacity>;
};

const IconButton: React.FC<IconButtonProps> = ({ color, isActive, icon, iconSize = 26, onPress, disabled, fillOnActive = false }) => (
    <TouchableOpacity
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

// ─── Component ────────────────────────────────────────────────────────────────

const TradeUI: React.FC<TradeUIProps> = ({
    onActionSelected,
    onQueryToggle,
    actions = TRADE_ACTIONS,
    isSelectMode = false,
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

    const scrollViewRef = useRef<ScrollView>(null);
    const isScrollingRef = useRef(false);
    const [currentActionIndex, setCurrentActionIndex] = useState(0);
    const [playButtonState, setPlayButtonState] = useState<'idle' | 'ready' | 'played'>('idle');
    const isActionSelected = playButtonState === 'played';
    const [isQueryOpen, setIsQueryOpen] = useState(false);
    const currentOffsetRef = useRef(ITEM_HEIGHT * actions.length);

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

    // Signal from an action button that it was pressed — move play button to 'ready'
    const markReady = () => {
        setPlayButtonState(prev => prev === 'played' ? 'ready' : 'ready');
    };

    const playAction = (subAction?: 'add' | 'remove' | 'write' | 'select', index: number = currentActionIndex) => {
        if (playButtonState === 'idle' && !subAction) return;
        onActionSelected?.({ actionType: currentAction.actionType, subAction });
        if (!subAction) {
            // Play button pressed — toggle between played and ready
            setPlayButtonState(prev => prev === 'played' ? 'ready' : 'played');
        }
    };

    const handleQueryPress = (active: boolean) => {
        if (!active) return;
        if (queryPostSelected) {
            onQueryPostDeselect?.();
            if (isQueryOpen) { setIsQueryOpen(false); onQueryToggle?.(false); }
        } else {
            onQueryPostSelect?.();
            const next = !isQueryOpen;
            setIsQueryOpen(next);
            onQueryToggle?.(next);
        }
        onActionSelected?.({ actionType: 'query', subAction: 'write' });
        markReady();
    };

    const handleActionTextPress = () => {
        const snapped = Math.round(currentOffsetRef.current / ITEM_HEIGHT) * ITEM_HEIGHT;
        scrollViewRef.current?.scrollTo({ y: snapped + ITEM_HEIGHT, animated: true });
        if (isQueryOpen) { setIsQueryOpen(false); onQueryToggle?.(false); }
    };

    useEffect(() => {
        setCurrentActionIndex(0);
        setPlayButtonState('idle');
        const t = setTimeout(() => scrollViewRef.current?.scrollTo({ y: ITEM_HEIGHT * actions.length, animated: false }), INITIAL_SCROLL_DELAY);
        return () => clearTimeout(t);
    }, [actions]);

    const handleScrollBeginDrag = () => {
        isScrollingRef.current = true;
        setPlayButtonState('idle');
        if (isQueryOpen) { setIsQueryOpen(false); onQueryToggle?.(false); }
        if (queryPostSelected) onQueryPostDeselect?.();
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        currentOffsetRef.current = offsetY;
        const itemIndex = calculateItemIndex(offsetY);
        if (itemIndex !== currentActionIndex) {
            setPlayButtonState('idle');
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

    // For select-style buttons: arrow shows when selectedCount > 0
    const selectButtonReady = selectedCount > 0;

    const renderActionButton = (action: TradeActionConfig, active: boolean) => {
        if (!action.hasButtons) return null;
        const color = currentAction?.color;
        const disabled = !active;
        const opacity = active ? 1 : 0.3;

        // Actions that use the select-count pattern
        if (['offer', 'barter', 'rescind'].includes(action.actionType)) {
            return (
                <SelectButton
                    color={color}
                    isActive={topCardIsSelected}
                    selectedCount={selectedCount}
                    onPress={() => {
                        if (active && selectedCount > 0) markReady();
                        playAction('write');
                    }}
                    disabled={disabled}
                />
            );
        }

        // Icon-only actions
        const iconMap: Partial<Record<TradeActionType, { icon: string; size?: number; subAction: 'select' | 'write' | 'add' | 'remove' }>> = {
            where:  { icon: 'circle-dot', subAction: 'select' },
            when:   { icon: 'clock', subAction: 'select' },
            verify: { icon: 'camera-rotate', size: 22, subAction: 'select' },
            stall:  { icon: 'circle-check', subAction: 'select' },
            accept: { icon: 'circle-check', subAction: 'select' },
            acceptFinal: { icon: 'circle-check', subAction: 'select' },
            decline: { icon: 'circle-check', subAction: 'select' },
        };

        if (iconMap[action.actionType]) {
            const { icon, size, subAction } = iconMap[action.actionType]!;
            return (
                <IconButton
                    color={color}
                    isActive={(playButtonState === 'ready' || playButtonState === 'played') && active}
                    icon={icon}
                    iconSize={size}
                    onPress={() => { markReady(); playAction(subAction); }}
                    disabled={disabled}
                    fillOnActive
                />
            );
        }

        switch (action.actionType) {
            case 'counter':
                return (
                    <>
                        <TouchableOpacity
                            style={[styles.counterMinusButton, { opacity, borderColor: color }]}
                            onPress={() => { markReady(); playAction('add'); }}
                            disabled={disabled}
                        >
                            <FontAwesome6 name="plus" size={22} color={color} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.counterPlusButton, { opacity, borderColor: color }]}
                            onPress={() => { markReady(); playAction('remove'); }}
                            disabled={disabled}
                        >
                            <FontAwesome6 name="minus" size={22} color={color} />
                        </TouchableOpacity>
                    </>
                );
            case 'query':
                return (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.selectButton, {
                            opacity,
                            borderColor: color,
                            backgroundColor: queryPostSelected && active ? color : 'transparent',
                        }]}
                        onPress={() => handleQueryPress(active)}
                        disabled={disabled}
                    >
                        <FontAwesome6
                            name={queryPostSelected && active ? 'circle-question' : 'circle'}
                            size={26}
                            color={queryPostSelected && active ? '#000' : color}
                        />
                    </TouchableOpacity>
                );
            case 'play':
                return (
                    <TimerButton
                        color={color}
                        isActive={(playButtonState === 'ready' || playButtonState === 'played') && active}
                        onPress={() => { markReady(); playAction('select'); }}
                        disabled={disabled}
                    />
                );
            case 'wait':
                return (
                    <TimerButton
                        color={color}
                        isActive={false}
                        disabled={true}
                    />
                );
            case 'offer':
                return (
                    <IconButton
                      color={color}
                      isActive={topCardIsSelected}
                      icon="check"
                      onPress={() => {
                        markReady();
                        playAction('write');
                      }}
                      disabled={disabled}
                      fillOnActive
                    />
                );
            default:
                return (
                    <IconButton
                        color={color}
                        isActive={(playButtonState === 'ready' || playButtonState === 'played') && active}
                        icon="circle-check"
                        onPress={() => { markReady(); playAction('select'); }}
                        disabled={disabled}
                        fillOnActive
                    />
                );
        }
    };

    // Determine play button appearance
    // For select-type actions, 'ready' is derived from selectedCount > 0, not from button press
    const isSelectAction = ['offer', 'barter', 'rescind'].includes(currentAction?.actionType);
    const effectivePlayState = isSelectAction
        ? (selectedCount > 0 ? (playButtonState === 'played' ? 'played' : 'ready') : 'idle')
        : playButtonState;

    const showArrow = effectivePlayState !== 'idle';
    const arrowFilled = effectivePlayState === 'played';

    const handlePlayPress = () => {
        if (!showArrow) return;
        onActionSelected?.({ actionType: currentAction.actionType });
        setPlayButtonState(prev => prev === 'played' ? 'ready' : 'played');
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
                    style={[styles.playButton, {
                        backgroundColor: arrowFilled ? currentAction?.color : 'transparent',
                        borderColor: currentAction?.color,
                        shadowColor: currentAction?.color,
                    }]}
                    onPress={handlePlayPress}
                    disabled={!showArrow}
                >
                    {showArrow && (
                        <FontAwesome6
                            name="arrow-left-long"
                            size={22}
                            color={arrowFilled ? '#000' : currentAction?.color}
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
        position: 'absolute', top: 0, left: 0, right: 0, height: 40, overflow: 'hidden', zIndex: 10,
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