//should have optional decline button for profile use, removes it and all user's cards from profile deck


import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity } from 'react-native';
import {FontAwesome6 } from '@expo/vector-icons';

import { globalFonts, colors } from '../styles/globalStyles';
import { useRouter } from 'expo-router';

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
  goodsCount?: number;
  servicesCount?: number;
  profileImageUrl?: string;
  rating?: number;          // 0–5
  reviewCount?: number;
}

interface UserCardProps {
  user: User;
  scale?: number;
  cardWidth?: number;
  onMenuPress?: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, scale = 1, cardWidth, onMenuPress }) => {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);




  const StarRating = ({ rating = 0 }: { rating?: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

    return (
      <View style={styles.ratingRow}>
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return (
              <FontAwesome6 key={i} name="star" size={14} color="#F5B301" solid />
            );
          }
          if (i === fullStars && hasHalf) {
            return (
              <FontAwesome6 key={i} name="star-half-stroke" size={14} color="#F5B301" solid />
            );
          }
          return (
            <FontAwesome6 key={i} name="star" size={14} color="#DDD" />
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { transform: [{ scale }] }]}>
      <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>
        

        <View style={styles.headerColumn}>
          <Image
            source={{ uri: user.profileImageUrl || 'https://picsum.photos/seed/camera3/600/600' }}
            style={styles.profileImage}
          />

          <View style={styles.headerInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {user.name}
              {user.pronouns && (
                <Text style={styles.pronouns}> {user.pronouns}</Text>
              )}
            </Text>

            <View style={styles.locationRow}>
              <FontAwesome6 name="location-dot" size={14} color={colors.ui.cardsecondary}/>
              <Text style={styles.location}>{user.location}</Text>
            </View>

            <View style={styles.ratingContainer}>
              <StarRating rating={user.rating} />
              <Text style={styles.ratingText}>
                {user.rating?.toFixed(1)} ({user.reviewCount ?? 0})
              </Text>
            </View>
          </View>
        </View>

      
        {/* Bio */}
        <View style={styles.bioContainer}>
          <Text style={styles.bio} numberOfLines={5}>
            {user.bio}
          </Text>
        </View>

        <View style={styles.actionsRow}>
   

          <TouchableOpacity style={styles.actionButton}>
            <FontAwesome6 name="ban" size={20} color={colors.ui.cardsecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <FontAwesome6 name="circle-exclamation" size={20} color={colors.ui.cardsecondary} />
          </TouchableOpacity>
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
    // overflow: 'hidden',
    shadowColor: colors.ui.secondary,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 10,
    position: 'relative',
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingBottom: 16,
    
    borderWidth: 0,
    // borderColor: colors.ui.background, 
    borderColor: '#c94545',
    
    justifyContent: 'flex-start',
    alignItems: 'center'
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  infoContainer: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: globalFonts.bold,
  },
  pronouns: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.ui.cardsecondary,
    marginBottom: 4,
    fontFamily: globalFonts.regular,

  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 16,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
  },
  bioContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bio: {
    fontSize: 16,
    lineHeight: 16,
    color: '#000000',
    fontFamily: globalFonts.regular,
    textAlign: 'left',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  
  profileImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },

  blockButton: {
   
    position: 'absolute',
    bottom: 8,
    left: 40,
    zIndex: 10,
    padding: 4,
  },
  reportButton: {
   
    position: 'absolute',
    bottom: 8,
    left: 8,
    zIndex: 10,
    padding: 4,
  },

  headerColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    gap: 16,
    marginBottom: 16,
  },

  headerInfo: {
    width: '100%',
  
  },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },

  ratingRow: {
    flexDirection: 'row',
    gap: 2,
  },

  ratingText: {
    fontSize: 14,
    color: colors.ui.cardsecondary,
    fontFamily: globalFonts.regular,
  },



  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },

  actionButton: {
    padding: 8,
  },
});

export default UserCard;