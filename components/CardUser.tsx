import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, Animated, TextInput } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { globalFonts, colors } from '../styles/globalStyles';

interface User {
  name: string;
  pronouns?: string;
  bio: string;
  profileImageUrl?: string;
  rating?: number;
  reviewCount?: number;
  email?: string;
  phone?: string;
}

interface UserCardProps {
  user: User;
  isUser?: boolean;       // true = own profile (edit + eye toggle), false = other user (block + report)
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
  const [emailVisible, setEmailVisible] = useState(false);
  const [phoneVisible, setPhoneVisible] = useState(false);
  const photoHeight = useRef(new Animated.Value(photoExpanded)).current;

  const [draft, setDraft] = useState({
    pronouns: user.pronouns ?? '',
    bio: user.bio,
    email: user.email ?? '',
    phone: user.phone ?? '',
  });

  useEffect(() => {
    setDraft({
      pronouns: user.pronouns ?? '',
      bio: user.bio,
      email: user.email ?? '',
      phone: user.phone ?? '',
    });
  }, [user]);

  const updateDraft = (field: keyof typeof draft, value: string) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave?.({ ...user, ...draft });
    onExitEdit?.();
  };

  const handleCancel = () => {
    setDraft({
      pronouns: user.pronouns ?? '',
      bio: user.bio,
      email: user.email ?? '',
      phone: user.phone ?? '',
    });
    onExitEdit?.();
  };

  useEffect(() => {
    const target = isEditable ? photoCollapsed : (isInfoExpanded ? photoCollapsed : photoExpanded);
    Animated.spring(photoHeight, {
      toValue: target,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [isInfoExpanded, isEditable]);

  const StarRating = ({ rating = 0 }: { rating?: number }) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return (
      <View style={styles.ratingRow}>
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) return <FontAwesome6 key={i} name="star" size={20} color={colors.actions.accept} solid />;
          if (i === fullStars && hasHalf) return <FontAwesome6 key={i} name="star-half-stroke" size={20} color="#F5B301" solid />;
          return <FontAwesome6 key={i} name="star" size={20} color={colors.ui.cardsecondary} />;
        })}
      </View>
    );
  };

  const contactString = [user.email, user.phone].filter(Boolean).join(' · ') || 'None';

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
            activeOpacity={isInfoExpanded ? 0.8 : 1}
            onPress={() => !isEditable && isInfoExpanded && setIsInfoExpanded(false)}
            style={styles.photoTouchable}
          >
            <Animated.View style={[styles.photoSection, { height: photoHeight }]}>
              <Image
                source={{ uri: user.profileImageUrl || 'https://picsum.photos/seed/camera3/600/600' }}
                style={styles.photo}
                resizeMode="cover"
              />
              {isEditable && (
                <View style={styles.photoEditOverlay} pointerEvents="none">
                  <FontAwesome6 name="camera" size={24} color="#fff" />
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>

          {/* Info section */}
          <TouchableOpacity
            activeOpacity={isEditable ? 1 : 0.9}
            onPress={() => !isEditable && setIsInfoExpanded(true)}
            style={styles.infoSection}
          >
            {/* Name row */}
            <View style={[styles.headerRow, { marginBottom: 8 }]}>
              <Text style={styles.name} numberOfLines={1}>
                {user.name}
                {!isEditable && user.pronouns
                  ? <Text style={styles.pronouns}> {user.pronouns}</Text>
                  : null}
              </Text>

              {isEditable ? (
                // Edit mode: check, x, profile icon
                <>
                  <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                    <FontAwesome6 name="circle-check" size={24} color={colors.actions.accept} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={handleCancel}>
                    <FontAwesome6 name="circle-xmark" size={24} color={colors.ui.cardsecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <FontAwesome6 name="circle-user" size={24} color={colors.ui.cardsecondary} />
                  </TouchableOpacity>
                </>
              ) : isUser ? (
                // Own profile view mode: sliders (enter edit) + profile icon
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
                // Other user: ban, report, profile icon
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

            {/* pronouns */}
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

            {/* Contacts */}
            {isEditable ? (
              <>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Email:</Text>
                  <TextInput
                    style={[styles.location, styles.editableText, { flex: 1 }]}
                    value={draft.email}
                    onChangeText={v => updateDraft('email', v)}
                    placeholder="your@email.com"
                    placeholderTextColor={colors.ui.cardsecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    secureTextEntry={!emailVisible}
                  />
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setEmailVisible(prev => !prev)}
                  >
                    <FontAwesome6
                      name={emailVisible ? 'eye' : 'eye-slash'}
                      size={22}
                      color={colors.ui.cardsecondary}
                    />
                  </TouchableOpacity>
                </View>
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
                    onPress={() => setPhoneVisible(prev => !prev)}
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
                    {isUser
                      ? `Contacts: ${contactString}`
                      : `Contacts: ${contactString}`}
                  </Text>
                </View>
              </View>
            )}

            {/* Bio */}
            {isEditable ? (
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

          {/* Bottom row — ratings only in view mode */}
          <View style={styles.ratingsRow}>
            {!isEditable && (
              <View style={styles.ratingContainer}>
                <StarRating rating={user.rating} />
                <Text style={styles.ratingText}>({user.reviewCount ?? 0}  Exchange Ratings)</Text>
              </View>
            )}
          </View>

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
    fontSize: 15,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
    letterSpacing: -0.1,
  },
  fieldLabel: {
    fontSize: 15,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
    letterSpacing: -0.1,
    marginRight: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    lineHeight: 20,
    fontSize: 15,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
  },
  bio: {
    fontSize: 15,
    lineHeight: 20,
    color: '#000000',
    fontFamily: globalFonts.regular,
    letterSpacing: -0.1,
    marginTop: 10,
  },
  ratingsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingTop: 8,
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