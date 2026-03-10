import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, StyleSheet, Animated, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import TextTicker from 'react-native-text-ticker';
import { globalFonts, colors } from '../styles/globalStyles';

interface Post {
  name: string;
  description: string;
  photos: string[];
}

interface PostCardProps {
  post: Post;
  scale?: number;
  cardWidth?: number;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  selectColor?: string;
  isUser?: boolean;
  isEditable?: boolean;
  onSave?: (updated: Post) => void;
  onExitEdit?: () => void;
  onEnterEdit?: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const HEADER_HEIGHT    = 48;
const DESC_LINE_HEIGHT = 20;
const DESC_PAD_TOP     = 0;
const DESC_PAD_BOTTOM  = 8;
const DOTS_HEIGHT      = 24;
const GAP              = 8;
const BOTTOM_PADDING   = 16;
const DATE_HEIGHT      = 20;

const DESC_COLLAPSED_HEIGHT = DESC_PAD_TOP + DESC_LINE_HEIGHT * 2 + DESC_PAD_BOTTOM;
const DESC_EXPANDED_HEIGHT  = DESC_PAD_TOP + DESC_LINE_HEIGHT * 10 + DESC_PAD_BOTTOM;

// The date is pinned absolutely at the bottom — these are the only static values it needs
const DATE_BOTTOM = BOTTOM_PADDING;

// The animated zone covers: dots + gap + description. Date sits below, pinned absolutely.
const ANIMATED_ZONE_COLLAPSED = GAP + DOTS_HEIGHT + GAP + DESC_COLLAPSED_HEIGHT;
const ANIMATED_ZONE_EXPANDED  = GAP + DOTS_HEIGHT + GAP + DESC_EXPANDED_HEIGHT;

// Full bottom zone height (animated zone + gap + date + bottom padding)
const BOTTOM_ZONE_COLLAPSED = ANIMATED_ZONE_COLLAPSED + GAP + DATE_HEIGHT + BOTTOM_PADDING;
const BOTTOM_ZONE_EXPANDED  = ANIMATED_ZONE_EXPANDED  + GAP + DATE_HEIGHT + BOTTOM_PADDING;
// ─────────────────────────────────────────────────────────────────────────────

const PostCard: React.FC<PostCardProps> = ({
  post,
  scale = 1,
  cardWidth,
  isSelectMode = false,
  isSelected = false,
  onSelect,
  selectColor = colors.actions.offer,
  isUser = false,
  isEditable = false,
  onSave,
  onExitEdit,
  onEnterEdit,
}) => {
  const [isDescriptionMode, setIsDescriptionMode] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const [draft, setDraft] = useState({
    name: post.name,
    description: post.description,
    photos: post.photos,
  });

  useEffect(() => {
    setDraft({ name: post.name, description: post.description, photos: post.photos });
  }, [post]);

  const updateDraft = (field: keyof typeof draft, value: any) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const handleSave   = () => { onSave?.({ ...post, ...draft }); onExitEdit?.(); };
  const handleCancel = () => { setDraft({ name: post.name, description: post.description, photos: post.photos }); onExitEdit?.(); };

  const handleRemovePhoto = (index: number) => {
    const updated = draft.photos.filter((_, i) => i !== index);
    updateDraft('photos', updated);
    if (currentPhotoIndex >= updated.length) setCurrentPhotoIndex(Math.max(0, updated.length - 1));
  };

  const handleAddPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      const updated = [...draft.photos, result.assets[0].uri];
      updateDraft('photos', updated);
      setCurrentPhotoIndex(updated.length - 1);
    }
  };

  const descriptionHeight  = useRef(new Animated.Value(DESC_COLLAPSED_HEIGHT)).current;
  const animatedZoneHeight = useRef(new Animated.Value(ANIMATED_ZONE_COLLAPSED)).current;
  const bottomZoneHeight   = useRef(new Animated.Value(BOTTOM_ZONE_COLLAPSED)).current;

  useEffect(() => {
    Animated.spring(descriptionHeight, {
      toValue: isDescriptionMode ? DESC_EXPANDED_HEIGHT : DESC_COLLAPSED_HEIGHT,
      useNativeDriver: false, damping: 40, stiffness: 270,
    }).start();
    Animated.spring(animatedZoneHeight, {
      toValue: isDescriptionMode ? ANIMATED_ZONE_EXPANDED : ANIMATED_ZONE_COLLAPSED,
      useNativeDriver: false, damping: 40, stiffness: 270,
    }).start();
    Animated.spring(bottomZoneHeight, {
      toValue: isDescriptionMode ? BOTTOM_ZONE_EXPANDED : BOTTOM_ZONE_COLLAPSED,
      useNativeDriver: false, damping: 40, stiffness: 270,
    }).start();
  }, [isDescriptionMode]);

  const toggleMode = () => { if (!isEditable) setIsDescriptionMode(v => !v); };

  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  const displayPhotos = isEditable ? draft.photos : post.photos;

  const handlePhotoTap = () => {
    if (displayPhotos.length <= 1) return;
    let idx = currentPhotoIndex;
    let dir = direction;
    if (dir === 'forward') {
      if (idx < displayPhotos.length - 1) { idx++; } else { dir = 'backward'; idx--; }
    } else {
      if (idx > 0) { idx--; } else { dir = 'forward'; idx++; }
    }
    setCurrentPhotoIndex(idx);
    setDirection(dir);
  };

  return (
    <View style={[styles.container, { transform: [{ scale }] }]} onStartShouldSetResponder={() => true}>
      <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
        <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>

          {/* ── HEADER ─────────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              {isEditable ? (
                <View style={styles.titleEditWrapper}>
                  <Text style={styles.fieldLabelTitle}>Title:</Text>
                  <TextInput
                    style={[styles.title, styles.titleInput]}
                    value={draft.name}
                    onChangeText={v => updateDraft('name', v)}
                    placeholder="Item title"
                    placeholderTextColor={colors.ui.cardsecondary}
                  />
                </View>
              ) : (
                <TextTicker
                  key={isSelectMode ? 'select' : 'normal'}
                  style={[styles.title, { marginTop: 12 }]}
                  duration={8000}
                  loop
                  bounce={false}
                  repeatSpacer={20}
                  marqueeDelay={200}
                  ellipsizeMode="tail"
                >
                  {post.name}
                </TextTicker>
              )}

              {!isEditable && <View style={{ flex: 1 }} />}

              {!isEditable && (
                <TouchableOpacity
                  activeOpacity={0.2}
                  onPress={onSelect}
                  style={[styles.selectIconContainer, { backgroundColor: isSelected ? '#fff' : 'transparent' }]}
                >
                  {isSelectMode && (
                    <FontAwesome6
                      name={isSelected ? 'circle-check' : 'circle'}
                      size={24}
                      color={isSelected ? selectColor : 'transparent'}
                    />
                  )}
                </TouchableOpacity>
              )}

              {isEditable ? (
                <>
                  <TouchableOpacity style={styles.iconContainer} onPress={handleSave}>
                    <FontAwesome6 name="circle-check" size={24} color={colors.actions.trade} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconContainer} onPress={handleCancel}>
                    <FontAwesome6 name="circle-xmark" size={24} color={colors.ui.cardsecondary} />
                  </TouchableOpacity>
                </>
              ) : isUser ? (
                <TouchableOpacity style={styles.iconContainer} onPress={onEnterEdit}>
                  <FontAwesome6 name="square-pen" size={24} color={colors.ui.cardsecondary} />
                </TouchableOpacity>
              ) : null}

              <View style={styles.iconContainer}>
                <FontAwesome6 name="arrows-rotate" size={24} color={colors.actions.trade} />
              </View>
            </View>
          </View>

          {/* ── VIEW MODE ──────────────────────────────────────────────────── */}
          {!isEditable && (
            <>
              {/* Photo fills space between header and bottom zone */}
              <Animated.View style={[styles.photoWrapper, { bottom: bottomZoneHeight }]}>
                <TouchableOpacity
                  activeOpacity={displayPhotos.length > 1 ? 0.8 : 1}
                  onPress={handlePhotoTap}
                  style={styles.photoTouchable}
                >
                  {displayPhotos.length > 0 ? (
                    <Image
                      source={{ uri: displayPhotos[currentPhotoIndex] }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.photoPlaceholder} />
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Bottom zone — white background, grows with animation */}
              <Animated.View style={[styles.bottomZone, { height: bottomZoneHeight }]}>

                {/* Animated inner content: dots + description only */}
                <Animated.View style={{ height: animatedZoneHeight, overflow: 'hidden' }}>
                  <View style={styles.dotsRow}>
                    {displayPhotos.length > 1 && displayPhotos.map((_, index) => (
                      <View
                        key={index}
                        style={[styles.dot, {
                          transform: [{ scale: index === currentPhotoIndex ? 1.4 : 1 }],
                          opacity: index === currentPhotoIndex ? 1 : 0.4,
                        }]}
                      />
                    ))}
                  </View>

                  <TouchableOpacity activeOpacity={0.9} onPress={toggleMode}>
                    <Animated.View style={[styles.descriptionSection, { height: descriptionHeight }]}>
                      <Text
                        style={styles.descriptionText}
                        numberOfLines={isDescriptionMode ? undefined : 2}
                      >
                        {post.description}
                      </Text>
                    </Animated.View>
                  </TouchableOpacity>
                </Animated.View>

              </Animated.View>

              {/* Date — pinned absolutely to card bottom, never participates in animation */}
              <Text style={styles.date}>11/26/24</Text>
            </>
          )}

          {/* ── EDIT MODE ──────────────────────────────────────────────────── */}
          {isEditable && (
            <View style={styles.editBody}>
              <View style={styles.editPhotoArea}>
                {displayPhotos.length > 0 ? (
                  <TouchableOpacity activeOpacity={0.9} onPress={handlePhotoTap} style={styles.editPhotoFrame}>
                    <Image source={{ uri: displayPhotos[currentPhotoIndex] }} style={styles.photo} resizeMode="cover" />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.emptyPhotoPlaceholder}>
                    <FontAwesome6 name="image" size={32} color={colors.ui.cardsecondary} />
                    <Text style={styles.emptyPhotoText}>No photos</Text>
                  </View>
                )}

                <View style={styles.editPhotoControls}>
                  <TouchableOpacity
                    style={styles.photoNavButton}
                    onPress={() => handleRemovePhoto(currentPhotoIndex)}
                    disabled={displayPhotos.length === 0}
                  >
                    <FontAwesome6
                      name="circle-minus"
                      size={24}
                      color={displayPhotos.length === 0 ? 'transparent' : colors.ui.cardsecondary}
                    />
                  </TouchableOpacity>

                  <View style={styles.editDotsRow}>
                    {displayPhotos.map((_, index) => (
                      <View
                        key={index}
                        style={[styles.dot, {
                          transform: [{ scale: index === currentPhotoIndex ? 1.4 : 1 }],
                          opacity: index === currentPhotoIndex ? 1 : 0.4,
                        }]}
                      />
                    ))}
                  </View>

                  <TouchableOpacity style={styles.photoNavButton} onPress={handleAddPhoto}>
                    <FontAwesome6 name="circle-plus" size={24} color={colors.ui.cardsecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.editDescriptionArea}>
                <Text style={styles.fieldLabel}>Description:</Text>
                <TextInput
                  style={[styles.descriptionText, styles.descriptionInput]}
                  value={draft.description}
                  onChangeText={v => updateDraft('description', v)}
                  placeholder="Describe this item"
                  placeholderTextColor={colors.ui.cardsecondary}
                  multiline
                  scrollEnabled
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}

        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 2,
    shadowColor: colors.ui.secondary,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },

  // ── Header
  header: {
    paddingHorizontal: 16,
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: { flexShrink: 0 },
  selectIconContainer: { flexShrink: 0 },
  titleContainer: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    color: '#000',
    fontFamily: globalFonts.bold,
    flex: 1,
  },
  titleInput: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  titleEditWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  fieldLabelTitle: {
    lineHeight: 22,
    fontSize: 18,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.bold,
  },

  // ── Photo (view mode)
  photoWrapper: {
    position: 'absolute',
    top: HEADER_HEIGHT,
    left: 16,
    right: 16,
    // bottom is animated
    borderRadius: 2,
    overflow: 'hidden',
  },
  photoTouchable: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: colors.ui.cardsecondary,
    opacity: 0.1,
  },

  // ── Bottom zone (view mode)
  bottomZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: GAP,
    backgroundColor: '#fff',
    // height is animated — no gap/paddingBottom here so date is unaffected
  },
  dotsRow: {
    height: DOTS_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ui.cardsecondary,
  },
  descriptionSection: {
    overflow: 'hidden',
    paddingTop: DESC_PAD_TOP,
    paddingBottom: DESC_PAD_BOTTOM,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: DESC_LINE_HEIGHT,
    color: colors.ui.background,
    fontFamily: globalFonts.regular,
    letterSpacing: 0,
  },

  // Date is pinned absolutely to the card — outside all animated containers
  date: {
    position: 'absolute',
    bottom: DATE_BOTTOM,
    left: 16,
    fontSize: 16,
    lineHeight: DATE_HEIGHT,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
  },

  // ── Edit mode
  editBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  editPhotoArea: { gap: 6 },
  editPhotoFrame: {
    width: '100%',
    aspectRatio: 3 / 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  editPhotoControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  editDotsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  photoNavButton: { padding: 0 },
  editDescriptionArea: { flex: 1, gap: 2 },
  descriptionInput: {
    flex: 1,
    paddingVertical: 2,
    textAlignVertical: 'top',
  },
  fieldLabel: {
    fontSize: 16,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  emptyPhotoPlaceholder: {
    width: '100%',
    aspectRatio: 4 / 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ui.cardsecondary,
    borderStyle: 'dashed',
    borderRadius: 2,
    gap: 8,
  },
  emptyPhotoText: {
    fontSize: 16,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
  },
});

export default PostCard;