import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, StyleSheet, Animated, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [photoAspectRatios, setPhotoAspectRatios] = useState<number[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const [draft, setDraft] = useState({
    name: post.name,
    description: post.description,
    photos: post.photos,
  });

  useEffect(() => {
    setDraft({
      name: post.name,
      description: post.description,
      photos: post.photos,
    });
  }, [post]);

  const updateDraft = (field: keyof typeof draft, value: any) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave?.({ ...post, ...draft });
    onExitEdit?.();
  };

  const handleCancel = () => {
    setDraft({ name: post.name, description: post.description, photos: post.photos });
    onExitEdit?.();
  };

  const handleRemovePhoto = (index: number) => {
    const updated = draft.photos.filter((_, i) => i !== index);
    updateDraft('photos', updated);
    if (currentPhotoIndex >= updated.length) {
      setCurrentPhotoIndex(Math.max(0, updated.length - 1));
    }
  };

  // ── Image picker ──────────────────────────────────────────────────────────
  const handleAddPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      const updated = [...draft.photos, uri];
      updateDraft('photos', updated);
      setCurrentPhotoIndex(updated.length - 1); // jump to new photo
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  const descriptionHeight = useRef(new Animated.Value(100)).current;
  const photoMode4Lines = 100;
  const descriptionModeHeight = 250;
  const photoBottom = useRef(new Animated.Value(photoMode4Lines)).current;

  useEffect(() => {
    const photos = isEditable ? draft.photos : post.photos;
    const ratios: number[] = [];
    let loadedCount = 0;
    if (photos.length === 0) { setPhotoAspectRatios([]); return; }
    photos.forEach((photo, index) => {
      Image.getSize(
        photo,
        (width, height) => {
          ratios[index] = width / height;
          loadedCount++;
          if (loadedCount === photos.length) setPhotoAspectRatios([...ratios]);
        },
        () => {
          ratios[index] = 1;
          loadedCount++;
          if (loadedCount === photos.length) setPhotoAspectRatios([...ratios]);
        }
      );
    });
  }, [post.photos, isEditable, draft.photos]);

  useEffect(() => {
    Animated.spring(descriptionHeight, {
      toValue: isDescriptionMode ? descriptionModeHeight : photoMode4Lines,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start();
    Animated.spring(photoBottom, {
      toValue: isDescriptionMode ? descriptionModeHeight : photoMode4Lines,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [isDescriptionMode]);

  const toggleMode = () => { if (!isEditable) setIsDescriptionMode(!isDescriptionMode); };

  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  const displayPhotos = isEditable ? draft.photos : post.photos;

  const handlePhotoTap = () => {
    if (displayPhotos.length <= 1) return;
    let newIndex = currentPhotoIndex;
    let newDirection = direction;
    if (direction === 'forward') {
      if (currentPhotoIndex < displayPhotos.length - 1) {
        newIndex = currentPhotoIndex + 1;
      } else {
        newDirection = 'backward';
        newIndex = currentPhotoIndex - 1;
      }
    } else {
      if (currentPhotoIndex > 0) {
        newIndex = currentPhotoIndex - 1;
      } else {
        newDirection = 'forward';
        newIndex = currentPhotoIndex + 1;
      }
    }
    setCurrentPhotoIndex(newIndex);
    setDirection(newDirection);
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>

            {/* Title: label + input in edit mode, ticker in view mode */}
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
                ellipsizeMode='tail'
              >
                {post.name}
              </TextTicker>
            )}

            {!isEditable && (
              <View style={{ flex: 1 }} />
            )}

            {/* Select icon (view mode only) */}
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

            {/* Edit mode: save + cancel */}
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

            {/* arrows-rotate always visible */}
            <View style={styles.iconContainer}>
              <FontAwesome6 name="arrows-rotate" size={24} color={colors.actions.trade} />
            </View>
          </View>
        </View>

        {/* ── VIEW MODE: absolute-positioned photo + description ── */}
        {!isEditable && (
          <>
            <Animated.View
              style={[styles.photoSectionWrapper, { bottom: photoBottom }]}
              pointerEvents="box-none"
            >
              <View style={styles.photoSection}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handlePhotoTap}
                  style={styles.photoTouchable}
                >
                  {displayPhotos.length > 0 && (
                    <View style={[styles.photoFrame, {
                      aspectRatio: photoAspectRatios[currentPhotoIndex] || 1,
                      maxHeight: '100%',
                      maxWidth: '100%',
                    }]}>
                      <Image
                        source={{ uri: displayPhotos[currentPhotoIndex] }}
                        style={styles.photo}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {displayPhotos.length > 1 && (
                <View style={styles.dotsContainer} pointerEvents="none">
                  {displayPhotos.map((_, index) => (
                    <View
                      key={index}
                      style={[styles.dot, {
                        backgroundColor: colors.ui.cardsecondary,
                        transform: [{ scale: index === currentPhotoIndex ? 1.4 : 1 }],
                        opacity: index === currentPhotoIndex ? 1 : 0.4,
                      }]}
                    />
                  ))}
                </View>
              )}
            </Animated.View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={toggleMode}
              style={styles.descriptionTouchable}
            >
              <Animated.View style={[styles.descriptionSection, { height: descriptionHeight }]}>
                <View style={styles.descriptionScroll}>
                  <Text
                    style={styles.descriptionText}
                    numberOfLines={isDescriptionMode ? undefined : 4}
                  >
                    {post.description}
                  </Text>
                </View>
              </Animated.View>
            </TouchableOpacity>
          </>
        )}

        {/* ── EDIT MODE: normal flow layout ── */}
        {isEditable && (
          <View style={styles.editBody}>
            {/* Photo area */}
            <View style={styles.editPhotoArea}>
              {displayPhotos.length > 0 ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={handlePhotoTap}
                  style={styles.editPhotoFrame}
                >
                  <Image
                    source={{ uri: displayPhotos[currentPhotoIndex] }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.emptyPhotoPlaceholder}>
                  <FontAwesome6 name="image" size={32} color={colors.ui.cardsecondary} />
                  <Text style={styles.emptyPhotoText}>No photos</Text>
                </View>
              )}

              {/* Photo controls row: delete / dots / add */}
              <View style={styles.editPhotoControls}>
                {/* Delete current photo */}
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

                {/* Dots */}
                <View style={styles.editDotsRow}>
                  {displayPhotos.map((_, index) => (
                    <View
                      key={index}
                      style={[styles.dot, {
                        backgroundColor: colors.ui.cardsecondary,
                        transform: [{ scale: index === currentPhotoIndex ? 1.4 : 1 }],
                        opacity: index === currentPhotoIndex ? 1 : 0.4,
                      }]}
                    />
                  ))}
                </View>

                {/* Add photo — now opens image picker */}
                <TouchableOpacity style={styles.photoNavButton} onPress={handleAddPhoto}>
                  <FontAwesome6 name="circle-plus" size={24} color={colors.ui.cardsecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Description — editable TextInput */}
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

        <View style={styles.dateWrapper}>
          <Text style={[styles.date, { color: colors.ui.cardsecondary }]}>{"\n"}11/26/24</Text>
        </View>

      </View>
    </Animated.View>
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
    borderWidth: 0,
    borderRadius: 2,
    shadowColor: colors.ui.secondary,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    flexShrink: 0,
  },
  selectIconContainer: {
    flexShrink: 0,
  },
  titleContainer: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  date: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
    textAlign: 'right',
  },
  dateWrapper: {
    position: 'absolute',
    right: 16,
    bottom: 10,
    zIndex: 30,
  },
  photoSectionWrapper: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    paddingBottom: 18,
  },
  photoSection: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  photoTouchable: {
    width: '100%',
    alignItems: 'center',
  },
  photoFrame: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    borderRadius: 2,
    position: 'relative',
  },
  photo: { width: '100%', height: '100%' },
  removePhotoButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    zIndex: 10,
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
    fontSize: 14,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
  },
  photoNavRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  photoNavButton: {
    padding: 0,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ui.cardsecondary },
  titleEditWrapper: {
    lineHeight: 22,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  editBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  editPhotoArea: {
    gap: 6,
  },
  editPhotoFrame: {
    width: '100%',
    aspectRatio: 3 / 2,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
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
  editDescriptionArea: {
    flex: 1,
    gap: 2,
  },
  descriptionTouchable: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  descriptionSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#fff',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  descriptionScroll: { flex: 1, flexDirection: 'row' },
  descriptionText: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.ui.background,
    fontFamily: globalFonts.regular,
    letterSpacing: -0.1,
  },
  descriptionInput: {
    flex: 1,
    paddingVertical: 2,
    textAlignVertical: 'top',
  },
  fieldLabel: {
    fontSize: 15,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  fieldLabelTitle: {
    fontSize: 18,
    
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.bold,
    marginBottom: 2,
  },
});

export default PostCard;