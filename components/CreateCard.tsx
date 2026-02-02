import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import * as ImagePicker from 'expo-image-picker';
import { defaultTextStyle, globalFonts, colors } from '../styles/globalStyles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CreateCardProps {
  scale?: number;
  cardWidth?: number;
  /** Called whenever any editable field changes */
  onChange?: (value: {
    type: 'good' | 'service';
    name: string;
    description: string;
    photos: string[];
  }) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const CreateCard: React.FC<CreateCardProps> = ({ scale = 1, cardWidth, onChange }) => {
  // ── editable state ──────────────────────────────────────────────────────
  const [type, setType] = useState<'good' | 'service'>('good');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  // ── UI state (mirrors PostCard) ─────────────────────────────────────────
  const [isDescriptionMode, setIsDescriptionMode] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photoAspectRatios, setPhotoAspectRatios] = useState<number[]>([]);

  // ── animated values (mirrors PostCard) ─────────────────────────────────
  const photoMode4Lines = 100;
  const descriptionModeHeight = 250;
  const descriptionHeight = useRef(new Animated.Value(photoMode4Lines)).current;
  const photoBottom = useRef(new Animated.Value(photoMode4Lines)).current;

  // ── dimensions (mirrors PostCard) ──────────────────────────────────────
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);
  const photoContainerWidth = finalCardWidth - 32;

  // ── bubble onChange up ──────────────────────────────────────────────────
  useEffect(() => {
    onChange?.({ type, name, description, photos });
  }, [type, name, description, photos]);

  // ── load aspect ratios when photos change ──────────────────────────────
  useEffect(() => {
    const ratios: number[] = [];
    let loadedCount = 0;
    if (photos.length === 0) {
      setPhotoAspectRatios([]);
      return;
    }
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
  }, [photos]);

  // ── animate description panel (mirrors PostCard) ───────────────────────
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

  // ── helpers ─────────────────────────────────────────────────────────────
  const toggleMode = () => setIsDescriptionMode((prev) => !prev);

  const toggleType = () => setType((prev) => (prev === 'good' ? 'service' : 'good'));

  const pickPhotos = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      const newUris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...newUris]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePhotoScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (photoContainerWidth + 16));
    if (index >= 0 && index < photos.length) setCurrentPhotoIndex(index);
  };

  // ── render ──────────────────────────────────────────────────────────────
  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>

        {/* ── Header (icon toggle + title input) ── */}
        <View style={styles.header}>
          {/* Tappable icon toggles good ↔ service */}
          <TouchableOpacity
            onPress={toggleType}
            activeOpacity={0.7}
            style={styles.iconContainer}
          >
            <FontAwesome6
              name={type === 'good' ? 'cube' : 'stopwatch'}
              size={24}
              color={type === 'good' ? '#FFA600' : '#ff536a'}
            />
          </TouchableOpacity>

          {/* Title input */}
          <TextInput
            style={styles.titleInput}
            value={name}
            onChangeText={setName}
            placeholder="Title"
            placeholderTextColor="#aaa"
            numberOfLines={1}
            autoCorrect={false}
          />
        </View>

        {/* ── Photo section (absolute, mirrors PostCard positioning) ── */}
        <Animated.View
          style={[styles.photoSectionWrapper, { bottom: photoBottom }]}
          pointerEvents="box-none"
        >
          <View style={styles.photoSection}>
            {photos.length === 0 ? (
              /* Empty state – single centered tap target */
              <TouchableOpacity
                onPress={pickPhotos}
                activeOpacity={0.7}
                style={[styles.photoPlaceholder, { width: photoContainerWidth }]}
              >
                <FontAwesome6 name="plus" size={36} color="#ccc" />
                <Text style={styles.placeholderText}>Tap to add photos</Text>
              </TouchableOpacity>
            ) : (
              <>
                {/* Horizontal photo scroll – same as PostCard */}
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={handlePhotoScroll}
                  scrollEventThrottle={16}
                  snapToInterval={photoContainerWidth + 16}
                  decelerationRate="fast"
                  contentContainerStyle={styles.scrollContent}
                >
                  {photos.map((photo, index) => (
                    <View
                      key={index}
                      style={[
                        styles.photoContainer,
                        {
                          width: photoContainerWidth,
                          marginRight: index < photos.length - 1 ? 16 : 0,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        activeOpacity={1}
                        onPress={toggleMode}
                        style={styles.photoTouchable}
                      >
                        <View
                          style={[
                            styles.photoFrame,
                            {
                              aspectRatio: photoAspectRatios[index] || 1,
                              maxHeight: '100%',
                              maxWidth: '100%',
                            },
                          ]}
                        >
                          <Image
                            source={{ uri: photo }}
                            style={styles.photo}
                            resizeMode="cover"
                          />
                          {/* Inner-shadow gradients (mirrors PostCard) */}
                          <View style={styles.innerShadowContainer} pointerEvents="none">
                            <LinearGradient
                              colors={['rgba(0,0,0,0.1)', 'transparent']}
                              style={styles.gradientTop}
                              pointerEvents="none"
                            />
                            <LinearGradient
                              colors={['transparent', 'rgba(0,0,0,0.1)']}
                              style={styles.gradientBottom}
                              pointerEvents="none"
                            />
                          </View>

                          {/* Per-photo delete button */}
                          <TouchableOpacity
                            onPress={() => removePhoto(index)}
                            activeOpacity={0.6}
                            style={styles.deleteButton}
                          >
                            <View style={styles.deleteButtonBg}>
                              <FontAwesome6 name="xmark" size={12} color="#fff" />
                            </View>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>

                {/* Pagination dots (mirrors PostCard) */}
                {photos.length > 1 && (
                  <View style={styles.dotsContainer} pointerEvents="none">
                    {photos.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.dot,
                          {
                            backgroundColor:
                              index === currentPhotoIndex ? '#000' : '#d4d4d4',
                            transform: [{ scale: index === currentPhotoIndex ? 1.2 : 1 }],
                          },
                        ]}
                      />
                    ))}
                  </View>
                )}

                {/* "+" button to add more photos */}
                <TouchableOpacity
                  onPress={pickPhotos}
                  activeOpacity={0.7}
                  style={styles.addMoreButton}
                >
                  <View style={styles.addMoreButtonBg}>
                    <FontAwesome6 name="plus" size={16} color="#fff" />
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>

        {/* ── Description panel (animated, mirrors PostCard) ── */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={toggleMode}
          style={styles.descriptionTouchable}
        >
          <Animated.View style={[styles.descriptionSection, { height: descriptionHeight }]}>
            <TextInput
              style={[styles.descriptionInput, isDescriptionMode ? undefined : { flex: 1 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description…"
              placeholderTextColor="#aaa"
              multiline
              textAlignVertical="top"
              scrollEnabled={isDescriptionMode}
              numberOfLines={isDescriptionMode ? undefined : 4}
              autoCorrect={true}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ---------------------------------------------------------------------------
// Styles – card chrome mirrors PostCard; only editable-specific bits added
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 0,
    borderRadius: 6,
    shadowColor: colors.ui.secondary,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 10,
    position: 'relative',
  },

  // ── header ──
  header: {
    padding: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  iconContainer: { flexShrink: 0, paddingBottom: 12 },
  titleInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: '#000',
    fontFamily: globalFonts.bold,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 2,
  },

  // ── photo section (absolute layer – mirrors PostCard) ──
  photoSectionWrapper: { position: 'absolute', top: 60, left: 16, right: 16 },
  photoSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { alignItems: 'center' },
  photoContainer: { justifyContent: 'center', alignItems: 'center', height: '100%' },
  photoTouchable: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  photoFrame: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    borderRadius: 4,
    position: 'relative',
  },
  photo: { width: '100%', height: '100%' },
  innerShadowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 10,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  dotsContainer: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },

  // ── empty-state placeholder ──
  photoPlaceholder: {
    height: 140,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fafafa',
  },
  placeholderText: {
    fontSize: 14,
    color: '#aaa',
    fontFamily: globalFonts.regular,
  },

  // ── per-photo delete "×" ──
  deleteButton: { position: 'absolute', top: 6, right: 6, zIndex: 10 },
  deleteButtonBg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── "+" add-more button (bottom-right of photo area) ──
  addMoreButton: { position: 'absolute', bottom: 10, right: 0, zIndex: 10 },
  addMoreButtonBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },

  // ── description panel ──
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
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#fff',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  descriptionInput: {
    fontSize: 15,
    lineHeight: 21,
    color: '#000000',
    ...defaultTextStyle,
  },
});

export default CreateCard;
