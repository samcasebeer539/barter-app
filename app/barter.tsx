import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import CardWheel from '../components/CardWheel';
import ProfilePicture from '@/components/ProfilePicture';

export default function BarterScreen() {
  const router = useRouter();
  const [resetKey, setResetKey] = useState(0);

  // Reset CardWheel whenever this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setResetKey(prev => prev + 1);
    }, [])
  );

  const handleBackPress = () => {
    router.push('/trades');
  };

  const sampleCards = [
    {
      title: 'Accept',
      photo: require('@/assets/barter-cards/accept.png'),
    },
    {
      title: 'Decline',
      photo: require('@/assets/barter-cards/decline.png'),
    },
    {
      title: 'Counter',
      photo: require('@/assets/barter-cards/counter.png'),
    },
    {
      title: 'Query',
      photo: require('@/assets/barter-cards/query.png'),
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={handleBackPress}
        activeOpacity={0.7}
      >
        <MaterialIcons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Header with profile photo and name */}
      <View style={styles.header}>
        <ProfilePicture size={50} avatarText="👤" />
        <Text style={styles.name}>Jay Wilson</Text>
      </View>

      {/* Main content area with card wireframes */}
      <View style={styles.mainContent}>
        <View style={styles.cardsContainer}>
          {/* Left card - larger and higher */}
          <View style={styles.leftCard}>
            <View style={styles.wireframe} />
          </View>
          
          {/* Right card - smaller and lower */}
          <View style={styles.rightCard}>
            <View style={styles.wireframe} />
          </View>
        </View>
      </View>

      {/* Card Wheel at bottom */}
      <View style={styles.cardWheelContainer}>
        <CardWheel cards={sampleCards} resetKey={resetKey} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    marginBottom: 400,
  },
  leftCard: {
    width: 200,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightCard: {
    width: 140,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  wireframe: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  cardWheelContainer: {
    position: 'absolute',
    bottom: -870,
    left: 0,
    right: 0,
    paddingBottom: 0,
  },
});
