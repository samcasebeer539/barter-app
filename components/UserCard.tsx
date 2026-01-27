import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons, FontAwesome6 } from '@expo/vector-icons';
import ProfilePicture from './ProfilePicture';

interface UserCardProps {
  scale?: number;
  cardWidth?: number;
}

const UserCard: React.FC<UserCardProps> = ({ scale = 1, cardWidth }) => {
  // Hardcoded user info - will eventually come from backend
  const user = {
    name: "Jay Wilson",
    location: "Santa Cruz, CA",
    bio: "pro smasher",
    tags: [
      { text: "Eco-Friendly", color: "purple" },
      { text: "Pro Smasher", color: "pink" },
    ],
    avatarText: "🧑‍💻",
    goodsCount: 5,
    servicesCount: 3,
  };

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
          <ProfilePicture size={80} avatarText={user.avatarText} />
          
          <View style={styles.statsContainer}>
            {/* Goods count */}
            <View style={styles.statRow}>
              <Text style={styles.statNumber}>{user.goodsCount}</Text>
              <FontAwesome6 name="cube" size={32} color="#FFA600"/>
            </View>
            {/* Services count */}
            <View style={styles.statRow}>
              <Text style={styles.statNumber}>{user.servicesCount}</Text>
              <FontAwesome6 name="stopwatch" size={32} color="#FF3B81" />
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
    backgroundColor: '#121212',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 10,
    paddingTop: 30,
    paddingHorizontal: 30,
    paddingBottom: 16,

    // Add white border without increasing size
    borderWidth: 3,
    borderColor: '#509cff',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsContainer: {
    gap: 4,
    justifyContent: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statNumber: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
    minWidth: 30,
    textAlign: 'right',
  },
  infoContainer: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
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
    fontSize: 14,
    color: '#999',
  },
  bioContainer: {
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
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
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default UserCard;
