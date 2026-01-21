import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ProfilePicture from './ProfilePicture';

interface UserInfo {
  name: string;
  location: string;
  bio: string;
  tags: Array<{
    text: string;
    color: string;
  }>;
  avatarText: string;
  goodsCount?: number;
  servicesCount?: number;
}

interface UserCardProps {
  user: UserInfo;
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
        <View style={styles.topRow}>
          <ProfilePicture size={60} avatarText={user.avatarText} />
          
          <View style={styles.statsContainer}>
            {/* Goods count */}
            <View style={styles.statRow}>
              <Text style={styles.statNumber}>{user.goodsCount ?? 0}</Text>
              <MaterialIcons name="shopping-bag" size={16} color="#fff" />
            </View>
            {/* Services count */}
            <View style={styles.statRow}>
              <Text style={styles.statNumber}>{user.servicesCount ?? 0}</Text>
              <MaterialIcons name="build" size={16} color="#fff" />
            </View>
          </View>
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
          <Text style={styles.bio} numberOfLines={3}>
            {user.bio}
          </Text>
        </View>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {user.tags.map((tag, index) => {
            const colors = getTagColors(tag.color);
            return (
              <View
                key={index}
                style={[styles.tag, { borderColor: colors.border }]}
              >
                <Text style={[styles.tagText, { color: colors.text }]}>
                  {tag.text}
                </Text>
              </View>
            );
          })}
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
    backgroundColor: '#1f1f1f', // Slightly lighter grey than #141414 background
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 10,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statsContainer: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  infoContainer: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 11,
    color: '#999',
  },
  bioContainer: {
    marginBottom: 12,
  },
  bio: {
    fontSize: 11,
    lineHeight: 16,
    color: '#ccc',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
});

export default UserCard;
