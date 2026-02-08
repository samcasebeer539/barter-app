//should have optional decline button for profile use, removes it and all user's cards from profile deck


import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { MaterialIcons, FontAwesome6 } from '@expo/vector-icons';
import ProfilePicture from './ProfilePicture';
import { defaultTextStyle, globalFonts, colors } from '../styles/globalStyles';

interface Tag {
  text: string;
  color: string;
}

interface User {
  name: string;
  location: string;
  bio: string;
  tags?: Tag[];
  avatarText?: string;
  goodsCount?: number;
  servicesCount?: number;
  profileImageUrl?: string;
}

interface UserCardProps {
  user: User;
  scale?: number;
  cardWidth?: number;
}

const UserCard: React.FC<UserCardProps> = ({ user, scale = 1, cardWidth }) => {
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  // Tag color mapping
  const getTagColors = (color: string) => {
    const colorMap: { [key: string]: { border: string; text: string } } = {
      pink: { border: '#FF3B81', text: '#FF3B81' },
      green: { border: '#34C759', text: '#34C759' },
      purple: { border: '#9747FF', text: '#9747FF' },
    };
    return colorMap[color] || { border: '#999', text: '#999' };
  };

  return (
    <View style={[styles.container, { transform: [{ scale }] }]}>
      <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>
        {/* Top Row: Profile Picture (left) and Stats (right) */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: user.profileImageUrl || 'https://picsum.photos/seed/camera3/600/600' }}
            style={styles.profileImage}
          />
        </View>

        {/* Name and Location - Left Aligned */}
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={12} color="#999" />
            <Text style={styles.location}>{user.location}</Text>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioContainer}>
          <Text style={styles.bio} numberOfLines={5}>
            {user.bio}
          </Text>
        </View>

       
      </View>
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
    paddingHorizontal: 30,
    paddingBottom: 16,
    
    borderWidth: 0,
    // borderColor: colors.ui.background, 
    borderColor: '#c94545',
    
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  infoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: globalFonts.bold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: '#000000',
    fontFamily: globalFonts.regular,
  },
  bioContainer: {
    marginBottom: 12,
    alignItems: 'center',
  },
  bio: {
    fontSize: 16,
    lineHeight: 16,
    color: '#000000',
    fontFamily: globalFonts.regular,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  tagText: {
    fontSize: 14,
    
    color: '#000000',
    fontFamily: globalFonts.regular,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 80,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
});

export default UserCard;