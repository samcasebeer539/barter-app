import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, Animated, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { globalFonts, colors } from '../styles/globalStyles';
import { User } from '@/types/index';
import { uploadProfilePhoto, getUserReviews, UserReview } from '@/services/userService';

// ─── Star rating ──────────────────────────────────────────────────────────────

// Filled and half stars in the review color, empty ones as gray outlines.
const StarRating = ({ rating = 0, size = 20 }: { rating?: number; size?: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  return (
    <View style={[styles.starRow, { gap: Math.round(size / 8) }]}>
      {[0, 1, 2, 3, 4].map(i => {
        if (i < fullStars) return <FontAwesome6 key={i} name="star" size={size} color={colors.actions.review} solid />;
        if (i === fullStars && hasHalf) return <FontAwesome6 key={i} name="star-half-stroke" size={size} color={colors.actions.review} solid />;
        return <FontAwesome6 key={i} name="star" size={size} color={colors.ui.cardsecondary} />;
      })}
    </View>
  );
};

// "Today", "3 days ago", "Nov 12" (this year) or "Nov 12, 2025".
function formatReviewDate(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }),
  });
}


interface UserCardProps {
  user: User;
  isUser?: boolean;
  isEditable?: boolean;
  onSave?: (updated: User) => void;
  onExitEdit?: () => void;
  onEnterEdit?: () => void;
  scale?: number;
  cardWidth?: number;
  onMenuPress?: () => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  isUser = false,
  isEditable = false,
  onSave,
  onExitEdit,
  onEnterEdit,
  scale = 1,
  cardWidth,
  onMenuPress,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  const photoExpanded = finalCardWidth - 96;
  const photoCollapsed = 80;

  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  // Reviews: tapping the stars or count opens the list in place of the
  // contacts and bio (and collapses the photo). Loaded on first open.
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [reviews, setReviews] = useState<UserReview[] | null>(null);
  const [reviewsError, setReviewsError] = useState(false);
  const reviewsLoadedFor = useRef<string | null>(null);
  const reviewCount = user.reviewCount ?? 0;

  // Reload when the person or their review count changes (a new review).
  const reviewsKey = user._id ? `${user._id}:${reviewCount}` : null;
  useEffect(() => {
    if (!isReviewsOpen || !reviewsKey || reviewsLoadedFor.current === reviewsKey) return;
    reviewsLoadedFor.current = reviewsKey;
    setReviews(null);
    setReviewsError(false);
    getUserReviews(user._id!)
      .then(setReviews)
      .catch(err => {
        console.error('Failed to load reviews:', err);
        setReviewsError(true);
        reviewsLoadedFor.current = null; // retry on next open
      });
  }, [isReviewsOpen, reviewsKey]);

  useEffect(() => {
    if (isEditable) setIsReviewsOpen(false);
  }, [isEditable]);
  const [emailVisible, setEmailVisible] = useState(user.email_visible);
  const [phoneVisible, setPhoneVisible] = useState(user.phone_visible);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoHeight = useRef(new Animated.Value(photoExpanded)).current;

  const [draft, setDraft] = useState({
    pronouns: user.pronouns,
    bio: user.bio,
    phone: user.phone,
    profileImageUrl: user.profileImageUrl,
  });

  useEffect(() => {
    setDraft({
      pronouns: user.pronouns,
      bio: user.bio,
      phone: user.phone,
      profileImageUrl: user.profileImageUrl,
    });
    setEmailVisible(user.email_visible);
    setPhoneVisible(user.phone_visible);
  }, [user]);

  const updateDraft = (field: keyof typeof draft, value: string) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave?.({ ...user, ...draft, email_visible: emailVisible, phone_visible: phoneVisible });
    onExitEdit?.();
  };

  const handleCancel = () => {
    setDraft({
      pronouns: user.pronouns,
      bio: user.bio,
      phone: user.phone,
      profileImageUrl: user.profileImageUrl,
    });
    setEmailVisible(user.email_visible);
    setPhoneVisible(user.phone_visible);
    onExitEdit?.();
  };

  const handleEmailVisibleToggle = () => {
    const next = !emailVisible;
    setEmailVisible(next);
    onSave?.({ ...user, email_visible: next });
  };

  const handlePhoneVisibleToggle = () => {
    const next = !phoneVisible;
    setPhoneVisible(next);
    onSave?.({ ...user, phone_visible: next });
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        setIsUploadingPhoto(true);
        const remoteUrl = await uploadProfilePhoto(result.assets[0].uri);
        updateDraft('profileImageUrl', remoteUrl);
      } catch (err) {
        console.error('Photo upload failed:', err);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  useEffect(() => {
    const target = isEditable || isInfoExpanded || isReviewsOpen ? photoCollapsed : photoExpanded;
    Animated.spring(photoHeight, {
      toValue: target,
      useNativeDriver: false,
      damping: 40,
      stiffness: 270,
    }).start();
  }, [isInfoExpanded, isEditable, isReviewsOpen]);

  // Stars + "(N reviews)", left-aligned; tap to show or hide the reviews.
  const reviewSummary = (
    <TouchableOpacity
      style={styles.reviewSummary}
      onPress={() => setIsReviewsOpen(open => !open)}
      hitSlop={8}
      activeOpacity={0.7}
    >
      <StarRating rating={user.rating ?? 0} size={20} />
      <Text style={styles.reviewCountText}>
        ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
      </Text>
    </TouchableOpacity>
  );

  // Only show contacts that are marked visible
  const visibleContacts = [
    user.email_visible ? user.email : null,
    user.phone_visible && user.phone ? user.phone : null,
  ].filter(Boolean).join(' · ');
  const contactString = visibleContacts || 'No contacts shared';

  return (
    <View
      style={[styles.container, { transform: [{ scale }] }]}
      onStartShouldSetResponder={() => true}
    >
      <View style={[styles.container, { transform: [{ scale }] }]} pointerEvents="box-none">
        <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>

          <View
            style={[StyleSheet.absoluteFill, styles.gestureOverlay]}
            onStartShouldSetResponder={() => false}
            onMoveShouldSetResponder={() => false}
          />

          {/* Photo */}
          <TouchableOpacity
            activeOpacity={isEditable || isInfoExpanded || isReviewsOpen ? 0.8 : 1}
            onPress={() => {
              if (isEditable) {
                handlePickPhoto();
              } else if (isReviewsOpen) {
                setIsReviewsOpen(false);
              } else if (isInfoExpanded) {
                setIsInfoExpanded(false);
              }
            }}
            style={styles.photoTouchable}
            disabled={isUploadingPhoto}
          >
            <Animated.View style={[styles.photoSection, { height: photoHeight }]}>
              <Image
                source={{ uri: draft.profileImageUrl || 'https://picsum.photos/seed/camera3/600/600' }}
                style={styles.photo}
                resizeMode="cover"
              />
              {isEditable && (
                <View style={styles.photoEditOverlay} pointerEvents="none">
                  {isUploadingPhoto
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <FontAwesome6 name="camera" size={24} color="#fff" />
                  }
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>

          {/* Info section */}
          <TouchableOpacity
            activeOpacity={isEditable || isReviewsOpen ? 1 : 0.9}
            onPress={() => !isEditable && !isReviewsOpen && setIsInfoExpanded(true)}
            style={[styles.infoSection, isReviewsOpen && styles.infoSectionCompact]}
          >
            {/* Name row */}
            <View style={[styles.headerRow, { marginBottom: 8 }]}>
              <Text style={styles.name} numberOfLines={1}>
                {user.first_name} {user.last_name}
                {!isEditable && user.pronouns
                  ? <Text style={styles.pronouns}> {user.pronouns}</Text>
                  : null}
              </Text>

              {isEditable ? (
                <>
                  <TouchableOpacity style={styles.actionButton} onPress={handleSave} disabled={isUploadingPhoto}>
                    <FontAwesome6 name="circle-check" size={24} color={isUploadingPhoto ? colors.ui.cardsecondary : colors.actions.accept} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={handleCancel}>
                    <FontAwesome6 name="circle-xmark" size={24} color={colors.ui.cardsecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <FontAwesome6 name="circle-user" size={24} color={colors.ui.cardsecondary} />
                  </TouchableOpacity>
                </>
              ) : isUser ? (
                <>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={e => { e.stopPropagation(); onEnterEdit?.(); }}
                  >
                    <FontAwesome6 name="square-pen" size={24} color={colors.ui.cardsecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <FontAwesome6 name="circle-user" size={24} color={colors.ui.cardsecondary} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.actionButton}>
                    <FontAwesome6 name="ban" size={24} color={colors.ui.cardsecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <FontAwesome6 name="circle-exclamation" size={24} color={colors.ui.cardsecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <FontAwesome6 name="circle-user" size={24} color={colors.ui.cardsecondary} />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Pronouns */}
            {isEditable && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Pronouns:</Text>
                <TextInput
                  style={[styles.location, styles.editableText, { flex: 1 }]}
                  value={draft.pronouns}
                  onChangeText={v => updateDraft('pronouns', v)}
                  placeholder="optional"
                  placeholderTextColor={colors.ui.cardsecondary}
                />
              </View>
            )}

            {/* Reviews open: the summary moves up under the name, replacing
                the contacts and bio. */}
            {isReviewsOpen && reviewSummary}

            {/* Contacts */}
            {isReviewsOpen ? null : isEditable ? (
              <>
                {/* Email — read-only with visibility toggle */}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Email:</Text>
                  <Text style={[styles.location, { flex: 1 }]}>
                    {emailVisible ? user.email : '••••••••••••'}
                  </Text>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleEmailVisibleToggle}
                  >
                    <FontAwesome6
                      name={emailVisible ? 'eye' : 'eye-slash'}
                      size={22}
                      color={colors.ui.cardsecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Phone — editable with visibility toggle */}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Phone:</Text>
                  <TextInput
                    style={[styles.location, styles.editableText, { flex: 1 }]}
                    value={draft.phone}
                    onChangeText={v => updateDraft('phone', v)}
                    placeholder="optional"
                    placeholderTextColor={colors.ui.cardsecondary}
                    keyboardType="phone-pad"
                    secureTextEntry={!phoneVisible}
                  />
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handlePhoneVisibleToggle}
                  >
                    <FontAwesome6
                      name={phoneVisible ? 'eye' : 'eye-slash'}
                      size={22}
                      color={colors.ui.cardsecondary}
                    />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.headerRow}>
                <View style={styles.locationRow}>
                  <Text style={styles.location}>
                    {`Contacts: ${contactString}`}
                  </Text>
                </View>
              </View>
            )}

            {/* Bio */}
            {isReviewsOpen ? null : isEditable ? (
              <View>
                <Text style={styles.fieldLabel}>Bio:</Text>
                <TextInput
                  style={[styles.bio, styles.editableText, { flexShrink: 1 }]}
                  value={draft.bio}
                  onChangeText={v => updateDraft('bio', v)}
                  placeholder="Tell others about yourself"
                  placeholderTextColor={colors.ui.cardsecondary}
                  multiline
                />
              </View>
            ) : (
              <Text style={styles.bio} numberOfLines={isInfoExpanded ? undefined : 2}>
                {user.bio}
              </Text>
            )}
          </TouchableOpacity>

          {/* Reviews list (open) or the summary in the bottom row (closed) */}
          {isReviewsOpen ? (
            <ScrollView
              style={styles.reviewList}
              contentContainerStyle={styles.reviewListContent}
              showsVerticalScrollIndicator={false}
            >
              {reviews === null && !reviewsError ? (
                <ActivityIndicator style={styles.reviewsState} color={colors.ui.cardsecondary} />
              ) : reviewsError ? (
                <Text style={[styles.reviewsStateText, styles.reviewsState]}>Couldn't load reviews</Text>
              ) : reviews!.length === 0 ? (
                <Text style={[styles.reviewsStateText, styles.reviewsState]}>No reviews yet</Text>
              ) : (
                reviews!.map(review => (
                  <View key={review._id} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewerName} numberOfLines={1}>{review.reviewerName}</Text>
                      <Text style={styles.reviewDate}>{formatReviewDate(review.createdAt)}</Text>
                    </View>
                    <StarRating rating={review.rating} size={14} />
                    {review.text ? <Text style={styles.reviewText}>{review.text}</Text> : null}
                  </View>
                ))
              )}
            </ScrollView>
          ) : !isEditable ? (
            <View style={styles.ratingsRow}>{reviewSummary}</View>
          ) : null}

        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 2,
    shadowColor: colors.ui.secondary,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-start',
    padding: 16,
    gap: 12,
  },
  gestureOverlay: {
    zIndex: 0,
    backgroundColor: 'transparent',
  },
  photoTouchable: {
    width: '100%',
  },
  photoSection: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 2,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoEditOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    padding: 6,
  },
  infoSection: {
    flex: 1,
    gap: 2,
  },
  // While reviews are open the info section is just name + summary; the
  // list below takes the remaining height.
  infoSectionCompact: {
    flex: 0,
  },
  name: {
    fontSize: 18,
    color: '#000000',
    fontFamily: globalFonts.bold,
    marginRight: 'auto',
  },
  pronouns: {
    fontSize: 18,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  location: {
    fontSize: 16,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
    letterSpacing: -0.1,
  },
  fieldLabel: {
    fontSize: 16,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
    letterSpacing: -0.1,
    marginRight: 6,
  },
  bio: {
    fontSize: 16,
    lineHeight: 20,
    color: '#000000',
    fontFamily: globalFonts.regular,
    letterSpacing: -0.1,
    marginTop: 10,
  },
  ratingsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    backgroundColor: '#ffffff',
    paddingTop: 8,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
  },
  reviewCountText: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
  },
  reviewList: {
    flex: 1,
  },
  // Reviews are separated by space alone: 4px within a review, 20px
  // between reviews.
  reviewListContent: {
    gap: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  reviewItem: {
    gap: 4,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  reviewerName: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontFamily: globalFonts.bold,
  },
  reviewDate: {
    fontSize: 14,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
  },
  reviewText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#000000',
    fontFamily: globalFonts.regular,
    letterSpacing: -0.1,
    marginTop: 2,
  },
  reviewsState: {
    marginTop: 24,
    alignSelf: 'center',
  },
  reviewsStateText: {
    fontSize: 16,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  actionButton: {
    marginLeft: 8,
  },
  editableText: {
    paddingVertical: 2,
  },
  editActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 'auto',
  },
});

export default UserCard;