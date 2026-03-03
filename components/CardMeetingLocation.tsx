import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';

const initialLocation = {
  latitude: 37.7749,
  longitude: -122.4194,
};

interface CardLocationProps {
  scale?: number;
  cardWidth?: number;
  mapActiveRef?: React.MutableRefObject<boolean>;
}

const CardLocation: React.FC<CardLocationProps> = ({
  scale = 1,
  cardWidth,
  mapActiveRef,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  const [pin, setPin] = useState(initialLocation);

  const handleMapPress = (event: MapPressEvent) => {
    const { coordinate } = event.nativeEvent;
    setPin(coordinate);
  };

  return (
    <View style={[styles.container, { transform: [{ scale }] }]}>
      <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>
        <View
          style={styles.mapWrapper}
          onTouchStart={() => {
            if (mapActiveRef) mapActiveRef.current = true;
          }}
          onTouchEnd={() => {
            if (mapActiveRef) mapActiveRef.current = false;
          }}
          onTouchCancel={() => {
            if (mapActiveRef) mapActiveRef.current = false;
          }}
        >
          <MapView
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: initialLocation.latitude,
              longitude: initialLocation.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            onPress={handleMapPress}
            scrollEnabled={true}
            zoomEnabled={true}
            rotateEnabled={true}
            pitchEnabled={true}
            userInterfaceStyle="dark"
          >
            <Marker coordinate={pin} />
          </MapView>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pin: {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}</Text>
          <TouchableOpacity style={styles.footerButton} onPress={() => Alert.alert('Button works!')}>
            <Text style={styles.footerButtonText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    overflow: 'hidden',
  },
  mapWrapper: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 100,
    borderRadius: 2,
    flex: 1,
    overflow: 'hidden',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#666',
  },
  footerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CardLocation;