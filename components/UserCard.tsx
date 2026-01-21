import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, StyleSheet, Animated } from 'react-native';
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
}

interface UserCardProps {
  user: UserInfo;
  scale?: number;
  cardWidth?: number;
}

const UserCard: React.FC<UserCardProps> = ({ user, scale = 1, cardWidth }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Animation values
  const contentHeight = useRef(new Animated.Value(100)).current;
  const collapsedHeight = 100;
  const expandedHeight = 250;

  // Animate content height
  React.useEffect(() => {
    Animated.spring(contentHeight, {
      toValue: isExpanded ? expandedHeight : collapsedHeight,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [isExpanded]);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

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
    <Animated.View
      style={[styles.container, { transform: [{ scale }] }]}
    >
      <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>
        {/* Header - Profile Picture and Name */}
        <View style={styles.header}>
          <ProfilePicture size={60} avatarText={user.avatarText} />
          <View style={styles.userInfo}>
            <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={14} color="#666" />
              <Text style={styles.location}>{user.location}</Text>
            </View>
          </View>
        </View>

        {/* Content Section - Bio and Tags */}
        <TouchableOpacity activeOpacity={0.9} onPress={toggleExpanded} style={styles.contentTouchable}>
          <Animated.View style={[styles.contentSection, { height: contentHeight }]}>
            <ScrollView
              style={styles.contentScroll}
              showsVerticalScrollIndicator={isExpanded}
              scrollEnabled={isExpanded}
              nestedScrollEnabled={true}
            >
              <Text style={styles.bio} numberOfLines={isExpanded ? undefined : 3}>
                {user.bio}
              </Text>
              
              {isExpanded && (
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
              )}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>

        {/* Tap to Expand/Collapse Hint */}
        <View style={styles.hintContainer}>
          <MaterialIcons 
            name={isExpanded ? 'expand-less' : 'expand-more'} 
            size={20} 
            color="#999" 
          />
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
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 10,
    position: 'relative',
  },
  header: {
    padding: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 13,
    color: '#666',
  },
  contentTouchable: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
  },
  contentSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  contentScroll: {
    flex: 1,
  },
  bio: {
    fontSize: 14,
    lineHeight: 21,
    color: '#525252',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  hintContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});

export default UserCard;
