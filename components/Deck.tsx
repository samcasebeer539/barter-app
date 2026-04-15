import React, {
  useRef, useState, useEffect, useMemo, useCallback,
  useImperativeHandle, forwardRef,
} from 'react';
import {
  View, StyleSheet, Dimensions, Animated, PanResponder,
} from 'react-native';
import PostCard from './CardItem';
import UserCard from './CardUser';
import BlankCard from './CardBlank';
import CardDateTime from './CardDateTime';
import CardLocation from './CardMeetingLocation';
import { Post, User, Locations } from '@/types/index';
import { colors } from '@/styles/globalStyles';

interface DeckProps {
  posts: Post[];
  user?: User;
  cardWidth?: number;
  enabled?: boolean;
  onHorizontalGestureStart?: () => void;
  onGestureEnd?: () => void;
  isSelectMode?: boolean;
  selectedPosts?: number[];
  onTopCardChange?: (postIndex: number | null) => void;
  onTopCardTypeChange?: (type: 'user' | 'post' | 'datetime' | 'location') => void;
  selectColor?: string;
  showDateTime?: boolean;
  showLocation?: boolean;
  isEditMode?: boolean;
  onExitEdit?: () => void;
  onEnterEdit?: () => void;
  isUser?: boolean;
  isPostEditMode?: boolean;
  onExitPostEdit?: () => void;
  onEnterPostEdit?: () => void;
  onSaveUser?: (updated: User) => void;
  onSavePost?: (updated: Post) => void;
  jumpToken?: number;
  jumpToCardIndex?: number;
  initialLocations?: Locations[];
  onConfirmLocations?: (locations: Locations[]) => void;
  externalLocations?: Locations[];
  onSelectLocation?: (location: Locations | null) => void;
  isQueryMode?: boolean;
  querySelectedPostIndex?: number | null;
  onSelectPost?: (postIndex: number) => void;
}

type DeckItem =
  | { type: 'user' }
  | { type: 'post'; post: Post; postIndex: number }
  | { type: 'datetime' }
  | { type: 'location' };

const SLOT_POSITIONS = [
  { x: 0,  y: 0  },
  { x: 6,  y: 6  },
  { x: 12, y: 12 },
];

interface SlotHandle {
  setCard: (item: DeckItem | null, isFront: boolean) => void;
  setZIndex: (z: number) => void;
  setShadow: (enabled: boolean) => void;
}

interface CardSlotProps {
  slotAnim: { position: Animated.ValueXY; swipeX: Animated.Value };
  initialCard: DeckItem | null;
  initialIsFront: boolean;
  initialZIndex: number;
  screenWidth: number;
  finalCardWidth: number;
  isUser: boolean;
  isSelectMode: boolean;
  selectedPosts: number[];
  selectColor: string;
  user: User;
  mapActiveRef: React.MutableRefObject<boolean>;
  isEditMode: boolean;
  isPostEditMode: boolean;
  onExitEdit?: () => void;
  onEnterEdit?: () => void;
  onExitPostEdit?: () => void;
  onEnterPostEdit?: () => void;
  onSaveUser?: (u: User) => void;
  onSavePost?: (updated: Post) => void;
  initialLocations?: Locations[];
  onConfirmLocations?: (locations: Locations[]) => void;
  externalLocations?: Locations[];
  onSelectLocation?: (location: Locations | null) => void;
  isQueryMode: boolean;
  querySelectedPostIndex: number | null;
  onQueryPostTap?: (postIndex: number) => void;
  onSelectPost?: (postIndex: number) => void;
}

const CardSlot = forwardRef<SlotHandle, CardSlotProps>(({
  slotAnim, initialCard, initialIsFront, initialZIndex,
  screenWidth, finalCardWidth, isUser, isSelectMode, selectedPosts,
  selectColor, user, mapActiveRef, isEditMode, isPostEditMode,
  onExitEdit, onEnterEdit, onExitPostEdit, onEnterPostEdit,
  onSaveUser, onSavePost, initialLocations, onConfirmLocations,
  externalLocations, onSelectLocation,
  isQueryMode, querySelectedPostIndex, onQueryPostTap,
  onSelectPost,
}, ref) => {
  const [card, setCardState] = useState<DeckItem | null>(initialCard);
  const [isFront, setIsFront] = useState(initialIsFront);
  const wrapperRef = useRef<View>(null);
  const cardRef = useRef<View>(null);

  useImperativeHandle(ref, () => ({
    setCard(item, front) { setCardState(item); setIsFront(front); },
    setZIndex(z) { wrapperRef.current?.setNativeProps({ style: { zIndex: z } }); },
    setShadow(enabled) {
      cardRef.current?.setNativeProps({
        style: { shadowOpacity: enabled ? 0.5 : 0, elevation: enabled ? 8 : 0 },
      });
    },
  }));

  const rotate = slotAnim.swipeX.interpolate({
    inputRange: [-screenWidth, 0, screenWidth],
    outputRange: ['-10deg', '0deg', '10deg'],
  });
  const translateX = isFront
    ? Animated.add(slotAnim.position.x, slotAnim.swipeX)
    : slotAnim.position.x;

  const isQuerySelected = card?.type === 'post' && querySelectedPostIndex === card.postIndex;

  return (
    <View ref={wrapperRef} style={[slotStyles.wrapper, { zIndex: initialZIndex }]}>
      <Animated.View
        ref={cardRef}
        style={[slotStyles.card, slotStyles.shadowBase, {
          transform: [
            { translateX },
            { translateY: slotAnim.position.y },
            ...(isFront ? [{ rotate }] : []),
          ],
        }]}
      >
        {card?.type === 'user' && (
          <UserCard user={user} scale={1} cardWidth={finalCardWidth} isUser={isUser}
            isEditable={isFront && isEditMode} onExitEdit={onExitEdit}
            onEnterEdit={onEnterEdit} onSave={onSaveUser} />
        )}
        {card?.type === 'datetime' && <CardDateTime cardWidth={finalCardWidth} />}
        {card?.type === 'location' && (
          <CardLocation cardWidth={finalCardWidth} mapActiveRef={mapActiveRef} isUser={isUser}
            initialLocations={isUser ? initialLocations : undefined}
            onConfirm={isUser ? onConfirmLocations : undefined}
            externalLocations={!isUser ? externalLocations : undefined}
            onSelectLocation={!isUser ? onSelectLocation : undefined} />
        )}
        {card?.type === 'post' && (
          <PostCard
            post={card.post} scale={1} cardWidth={finalCardWidth}
            isSelectMode={isFront && isSelectMode}
            isSelected={selectedPosts.includes(card.postIndex)}
            selectColor={selectColor} isUser={isUser}
            isEditable={isFront && isPostEditMode}
            onEnterEdit={onEnterPostEdit} onExitEdit={onExitPostEdit} onSave={onSavePost}
            isQueryMode={isFront && isQueryMode}
            isQuerySelected={isQuerySelected}
            onSelect={
              isFront && isQueryMode
                ? () => onQueryPostTap?.(card.postIndex)
                : isFront && !isQueryMode
                ? () => onSelectPost?.(card.postIndex)
                : undefined
            }
          />
        )}
      </Animated.View>
    </View>
  );
});

const slotStyles = StyleSheet.create({
  wrapper: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  card: { position: 'absolute', top: 0, left: 0, backgroundColor: '#fff', borderRadius: 8 },
  shadowBase: {
    shadowColor: colors.ui.secondary,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0, shadowRadius: 2, elevation: 0,
  },
});

// ─── Deck ─────────────────────────────────────────────────────────────────────

const Deck: React.FC<DeckProps> = ({
  posts, user, cardWidth, enabled = true,
  onHorizontalGestureStart, onGestureEnd,
  isSelectMode = false, selectedPosts = [],
  onTopCardChange, onTopCardTypeChange,
  selectColor = colors.actions.offer,
  showDateTime = false, showLocation = true,
  isEditMode = false, onExitEdit, onEnterEdit,
  isUser = false, isPostEditMode = false,
  onExitPostEdit, onEnterPostEdit, onSaveUser, onSavePost,
  jumpToken, jumpToCardIndex,
  initialLocations = [], onConfirmLocations,
  externalLocations = [], onSelectLocation,
  isQueryMode = false, querySelectedPostIndex = null, onSelectPost
}) => {
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 38, 290);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);
  const deckContainerWidth  = finalCardWidth + SLOT_POSITIONS[2].x;
  const deckContainerHeight = cardHeight    + SLOT_POSITIONS[2].y;

  const SWIPE_THRESHOLD   = 10;
  const GESTURE_THRESHOLD = 3;
  const mapActiveRef = useRef(false);

  const defaultUser: User = {
    first_name: 'Jay', last_name: 'Wilson',
    email: 'jathwils@ucsc.edu', pronouns: '(she/he/they)',
    bio: 'pro smasher', phone: '',
    profileImageUrl: 'https://picsum.photos/seed/cat/400/400',
    email_visible: false, phone_visible: false,
    locations: [],
  };
  const userToRender = user ?? defaultUser;

  const cards = useMemo<DeckItem[]>(() => [
    { type: 'user' },
    ...(showDateTime ? [{ type: 'datetime' as const }] : []),
    ...(showLocation ? [{ type: 'location' as const }] : []),
    ...posts.map((post, i): DeckItem => ({ type: 'post', post, postIndex: i })),
  ], [posts, showDateTime, showLocation]);

  const cardsRef = useRef(cards);
  cardsRef.current = cards;

  const ci = useCallback((n: number) => {
    const len = cardsRef.current.length;
    return ((n % len) + len) % len;
  }, []);

  const slotAnims = useRef([
    { position: new Animated.ValueXY(SLOT_POSITIONS[0]), swipeX: new Animated.Value(0) },
    { position: new Animated.ValueXY(SLOT_POSITIONS[1]), swipeX: new Animated.Value(0) },
    { position: new Animated.ValueXY(SLOT_POSITIONS[2]), swipeX: new Animated.Value(0) },
  ]).current;

  const slotRefs = useRef<React.RefObject<SlotHandle>[]>([
    React.createRef<SlotHandle>(),
    React.createRef<SlotHandle>(),
    React.createRef<SlotHandle>(),
  ]).current;

  const rotatingFrontRef = useRef(0);
  const roleToSlot = (role: number) => (rotatingFrontRef.current + role) % 3;
  const slotZIndex = useRef([12, 11, 10]);
  const frontCardIndexRef = useRef(0);
  const [frontCardIndex, setFrontCardIndex] = useState(0);
  const isAnimatingRef = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    slotRefs[0].current?.setShadow(true);
    slotRefs[1].current?.setShadow(true);
    slotRefs[2].current?.setShadow(false);
  }, []);

  useEffect(() => {
    const front = rotatingFrontRef.current;
    const second = (front + 1) % 3;
    const third  = (front + 2) % 3;
    slotRefs[front].current?.setCard(cardsRef.current[ci(frontCardIndexRef.current)], true);
    slotRefs[second].current?.setCard(cardsRef.current[ci(frontCardIndexRef.current + 1)], false);
    slotRefs[third].current?.setCard(cardsRef.current[ci(frontCardIndexRef.current + 2)], false);
  }, [cards]);

  useEffect(() => {
    const topCard = cardsRef.current[frontCardIndex];
    if (topCard?.type === 'post') onTopCardChange?.(topCard.postIndex);
    else onTopCardChange?.(null);
    if (topCard) onTopCardTypeChange?.(topCard.type);
  }, [frontCardIndex, cards]);

  const prevJumpToken = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (jumpToken === undefined || jumpToken === prevJumpToken.current) return;
    prevJumpToken.current = jumpToken;
    if (jumpToCardIndex === undefined) return;
    const f = ci(jumpToCardIndex);
    const s = ci(jumpToCardIndex + 1);
    const t = ci(jumpToCardIndex + 2);
    const front  = rotatingFrontRef.current;
    const second = (front + 1) % 3;
    const third  = (front + 2) % 3;
    slotRefs[front].current?.setCard(cardsRef.current[f], true);
    slotRefs[second].current?.setCard(cardsRef.current[s], false);
    slotRefs[third].current?.setCard(cardsRef.current[t], false);
    slotRefs[front].current?.setShadow(true);
    slotRefs[second].current?.setShadow(true);
    slotRefs[third].current?.setShadow(false);
    frontCardIndexRef.current = f;
    setFrontCardIndex(f);
  }, [jumpToken]);

  const swipeOut = (direction: number) => {
    isAnimatingRef.current = true;
    const frontSlot  = roleToSlot(0);
    const secondSlot = roleToSlot(1);
    const thirdSlot  = roleToSlot(2);
    slotRefs[frontSlot].current?.setShadow(false);
    slotRefs[thirdSlot].current?.setShadow(true);
    Animated.parallel([
      Animated.timing(slotAnims[frontSlot].swipeX, { toValue: direction * screenWidth * 1.1, duration: 250, useNativeDriver: true }),
      Animated.timing(slotAnims[secondSlot].position, { toValue: SLOT_POSITIONS[0], duration: 250, useNativeDriver: true }),
      Animated.timing(slotAnims[thirdSlot].position, { toValue: SLOT_POSITIONS[1], duration: 250, useNativeDriver: true }),
    ]).start(() => {
      slotAnims[frontSlot].swipeX.setValue(0);
      slotAnims[frontSlot].position.setValue(SLOT_POSITIONS[2]);
      rotatingFrontRef.current = secondSlot;
      const newFrontCardIndex = ci(frontCardIndexRef.current + 1);
      slotRefs[frontSlot].current?.setCard(cardsRef.current[ci(frontCardIndexRef.current + 3)], false);
      slotRefs[secondSlot].current?.setCard(cardsRef.current[newFrontCardIndex], true);
      slotRefs[thirdSlot].current?.setCard(cardsRef.current[ci(frontCardIndexRef.current + 2)], false);
      slotZIndex.current[secondSlot] = 12;
      slotZIndex.current[thirdSlot]  = 11;
      slotZIndex.current[frontSlot]  = 10;
      slotRefs[secondSlot].current?.setZIndex(12);
      slotRefs[thirdSlot].current?.setZIndex(11);
      slotRefs[frontSlot].current?.setZIndex(10);
      frontCardIndexRef.current = newFrontCardIndex;
      setFrontCardIndex(newFrontCardIndex);
      isAnimatingRef.current = false;
      onExitEdit?.();
      onExitPostEdit?.();
    });
  };

  const resetPosition = () => {
    Animated.spring(slotAnims[roleToSlot(0)].swipeX, { toValue: 0, useNativeDriver: true, friction: 5 }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        if (mapActiveRef.current) return false;
        return enabledRef.current && !isAnimatingRef.current && Math.abs(g.dx) > GESTURE_THRESHOLD && Math.abs(g.dx) > Math.abs(g.dy) * 2;
      },
      onMoveShouldSetPanResponderCapture: (_, g) => {
        if (mapActiveRef.current) return false;
        return enabledRef.current && !isAnimatingRef.current && Math.abs(g.dx) > GESTURE_THRESHOLD && Math.abs(g.dx) > Math.abs(g.dy) * 2;
      },
      onPanResponderGrant: () => {
        if (!enabledRef.current) return;
        onHorizontalGestureStart?.();
        slotAnims[roleToSlot(0)].swipeX.setOffset(0);
        slotAnims[roleToSlot(0)].swipeX.setValue(0);
      },
      onPanResponderMove: (_, gesture) => { if (!enabledRef.current) return; slotAnims[roleToSlot(0)].swipeX.setValue(gesture.dx); },
      onPanResponderRelease: (_, gesture) => {
        if (!enabledRef.current) return;
        onGestureEnd?.();
        if (gesture.dx > SWIPE_THRESHOLD) swipeOut(1);
        else if (gesture.dx < -SWIPE_THRESHOLD) swipeOut(-1);
        else resetPosition();
      },
      onPanResponderTerminate: () => { onGestureEnd?.(); resetPosition(); },
    })
  ).current;

  const sharedProps = {
    screenWidth, finalCardWidth, isUser, isEditMode, isPostEditMode,
    isSelectMode, selectedPosts, selectColor, user: userToRender,
    onExitEdit, onEnterEdit, onExitPostEdit, onEnterPostEdit, onSaveUser, onSavePost,
    mapActiveRef, initialLocations, onConfirmLocations, externalLocations, onSelectLocation,
    isQueryMode, querySelectedPostIndex, onSelectPost,
  };

  return (
    <View
      style={[styles.deckContainer, { width: deckContainerWidth, height: deckContainerHeight }]}
      {...(enabled ? panResponder.panHandlers : {})}
    >
      <View style={styles.blankCard}>
        <BlankCard cardWidth={finalCardWidth} />
      </View>
      {[0, 1, 2].map(slot => (
        <CardSlot
          key={slot}
          ref={slotRefs[slot]}
          slotAnim={slotAnims[slot]}
          initialCard={cards[slot] ?? null}
          initialIsFront={slot === 0}
          initialZIndex={slotZIndex.current[slot]}
          {...sharedProps}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  deckContainer: { position: 'relative', alignItems: 'flex-start', justifyContent: 'flex-start', marginLeft: 24 },
  blankCard: {
    position: 'absolute', top: 0, left: 0,
    transform: [{ translateX: SLOT_POSITIONS[2].x }, { translateY: SLOT_POSITIONS[2].y }],
  },
});

export default Deck;