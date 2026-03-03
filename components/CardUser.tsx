import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, Animated } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { globalFonts, colors } from '../styles/globalStyles';

interface Tag {
  text: string;
  color: string;
}

interface User {
  name: string;
  pronouns?: string;
  location: string;
  bio: string;
  tags?: Tag[];
  avatarText?: string;

  profileImageUrl?: string;
  rating?: number;
  reviewCount?: number;
  email?: string;
  phone?: string;
}

interface UserCardProps {
  user: User;
  scale?: number;
  cardWidth?: number;
  onMenuPress?: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, scale = 1, cardWidth, onMenuPress }) => {
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  const photoExpanded = finalCardWidth - 96;
  const photoCollapsed = 80;

  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [locationVisible, setLocationVisible] = useState(false);
  const [contactsVisible, setContactsVisible] = useState(false);
  const photoHeight = useRef(new Animated.Value(photoExpanded)).current;

  useEffect(() => {
    Animated.spring(photoHeight, {
      toValue: isInfoExpanded ? photoCollapsed : photoExpanded,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [isInfoExpanded]);

  const StarRating = ({ rating = 0 }: { rating?: number }) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return (
      <View style={styles.ratingRow}>
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) return <FontAwesome6 key={i} name="star" size={20} color="#F5B301" solid />;
          if (i === fullStars && hasHalf) return <FontAwesome6 key={i} name="star-half-stroke" size={20} color="#F5B301" solid />;
          return <FontAwesome6 key={i} name="star" size={20} color={colors.ui.cardsecondary} />;
        })}
      </View>
    );
  };

  const contactString = [user.email, user.phone].filter(Boolean).join(' · ') || 'None';

  return (
    <View style={[styles.container, { transform: [{ scale }] }]} pointerEvents="box-none">
      <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>

        {/* Gesture passthrough overlay */}
        <View
          style={[StyleSheet.absoluteFill, styles.gestureOverlay]}
          onStartShouldSetResponder={() => false}
          onMoveShouldSetResponder={() => false}
        />

        {/* Photo */}
        <TouchableOpacity
          activeOpacity={isInfoExpanded ? 0.8 : 1}
          onPress={() => isInfoExpanded && setIsInfoExpanded(false)}
          style={styles.photoTouchable}
        >
          <Animated.View style={[styles.photoSection, { height: photoHeight }]}>
            <Image
              source={{ uri: user.profileImageUrl || 'https://picsum.photos/seed/camera3/600/600' }}
              style={styles.photo}
              resizeMode="cover"
            />
          </Animated.View>
        </TouchableOpacity>

        {/* Info section */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setIsInfoExpanded(true)}
          style={styles.infoSection}
        >
          {/* Name + actions */}
          <View style={[styles.headerRow, { marginBottom: 8 }]}>
            <Text style={styles.name} numberOfLines={1}>
              {user.name}
              {user.pronouns && (
                <Text style={styles.pronouns}> {user.pronouns}</Text>
              )}
            </Text>
            <TouchableOpacity style={styles.actionButton}>
              <FontAwesome6 name="ban" size={22} color={colors.ui.cardsecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <FontAwesome6 name="circle-exclamation" size={22} color={colors.ui.cardsecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <FontAwesome6 name="circle-user" size={22} color={colors.ui.cardsecondary} />
            </TouchableOpacity>
          </View>

      

          {/* Location */}
          <View style={styles.headerRow}>
            <View style={styles.locationRow}>
              <Text style={styles.location}>
                Location: {locationVisible ? user.location : 'Hidden'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={e => {
                e.stopPropagation();
                setLocationVisible(prev => !prev);
              }}
            >
              <FontAwesome6
                name={locationVisible ? 'eye' : 'eye-slash'}
                size={20}
                color={locationVisible ? colors.ui.cardsecondary : colors.ui.cardsecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Contacts */}
          <View style={styles.headerRow}>
            <View style={styles.locationRow}>
              <Text style={styles.location}>
                Contacts: {contactsVisible ? contactString : 'Hidden'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={e => {
                e.stopPropagation();
                setContactsVisible(prev => !prev);
              }}
            >
              <FontAwesome6
                name={contactsVisible ? 'eye' : 'eye-slash'}
                size={20}
                color={colors.ui.cardsecondary}
              />
            </TouchableOpacity>
          </View>
          {/* Bio */}
          
          <Text style={styles.bio} numberOfLines={isInfoExpanded ? undefined : 2}>
            {user.bio}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.ratingsRow}>
          <View style={styles.ratingContainer}>
            <StarRating rating={user.rating} />
            <Text style={styles.ratingText}>
              ({user.reviewCount ?? 0}  ratings)
            </Text>
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
    borderRadius: 6,
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
  actionButton: {
    marginLeft: 4,
  },
});

export default UserCard;