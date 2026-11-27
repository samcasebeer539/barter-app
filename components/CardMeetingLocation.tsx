import { colors, globalFonts } from '@/styles/globalStyles';
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, TextInput } from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { FontAwesome6 } from '@expo/vector-icons';
import { Locations, LocationEntry } from '@/types/index';
import { useKeyboardLiftField } from '@/hooks/useKeyboardLift';
import { useUserRegion } from '@/hooks/useUserRegion';
import { TEXT_LIMITS } from '@/config/textLimits';

const MAX_LOCATIONS = 3;

// Where a map starts with no saved locations and no device location.
const initialRegion = {
  latitude: 36.9945,
  longitude: -122.0658,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

// The area that shows every location, with some room around them.
function regionForLocations(locs: { latitude: number; longitude: number }[]) {
  const lats = locs.map(l => l.latitude);
  const lons = locs.map(l => l.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.02),
    longitudeDelta: Math.max((maxLon - minLon) * 1.6, 0.02),
  };
}

interface CardLocationProps {
  scale?: number;
  cardWidth?: number;
  mapActiveRef?: React.MutableRefObject<boolean>;
  isUser?: boolean;
  // ── User (primary) mode ───────────────────────────────────────────────────
  /** Locations pre-loaded from the backend for the logged-in user */
  initialLocations?: Locations[];
  /** Called with the full updated list whenever a location is added or removed */
  onConfirm?: (locations: Locations[]) => void;
  // ── Read-only (secondary) mode ────────────────────────────────────────────
  /** Other user's locations fetched from the backend; shown as selectable */
  externalLocations?: Locations[];
  /** Called when the viewing user selects or deselects a location */
  onSelectLocation?: (location: Locations | null) => void;
  // ── Trade "where" subflow ─────────────────────────────────────────────────
  /** When true (and isUser), render select-toggle UI on own locations instead of add/remove editing */
  isSelectMode?: boolean;
  /** Fires with the chosen location (or null on deselect) while isSelectMode is true */
  onProposeLocation?: (location: Locations | null) => void;
  // ── Standing proposal ─────────────────────────────────────────────────────
  /** A standing WHERE proposal to display (read-only, with a check) when not selecting */
  proposedLocation?: Locations | null;
}

const uid = () => Math.random().toString(36).slice(2, 8);

const CardLocation: React.FC<CardLocationProps> = ({
  scale = 1,
  cardWidth,
  mapActiveRef,
  isUser = true,
  initialLocations = [],
  onConfirm,
  externalLocations = [],
  onSelectLocation,
  isSelectMode = false,
  onProposeLocation,
  proposedLocation = null,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  // ── User (editable) state ─────────────────────────────────────────────────
  const [locations, setLocations] = useState<Locations[]>(initialLocations);

  // Sync when initialLocations arrives from the backend after mount
  useEffect(() => {
    if (initialLocations.length > 0) {
      setLocations(initialLocations);
    }
  }, [initialLocations]);
  const [pendingPin, setPendingPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isNaming, setIsNaming] = useState(false);
  const [nameInput, setNameInput] = useState('');
  // Keeps the field you're typing in above the keyboard.
  const kbField = useKeyboardLiftField();
  // These fields focus themselves as they appear, and iOS then shows a plain
  // "return" key. Switching the key to "done" once focused makes iOS redraw
  // the keyboard with the check mark, like the fields you tap into.
  const [doneKey, setDoneKey] = useState(false);
  const [descInput, setDescInput] = useState('');

  // ── Read-only state ───────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [footerHeight, setFooterHeight] = useState(80);

  // ── Own-card select state (trade "where" subflow) ─────────────────────────
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  // Clear any stale selection if select mode is turned off externally
  // (e.g. the trade subflow was cancelled or reset)
  useEffect(() => {
    if (!isSelectMode) setSelectedLocationId(null);
  }, [isSelectMode]);

  // ── Handlers: user mode ───────────────────────────────────────────────────
  const handleMapPress = (event: MapPressEvent) => {
    if (!isUser || isNaming || isSelectMode || (proposedLocation && !isSelectMode)) return;
    const { coordinate } = event.nativeEvent;
    setPendingPin(coordinate);
  };

  const handleAddLocationPress = () => {
    if (!pendingPin) return;
    setNameInput('');
    setDescInput('');
    setIsNaming(true);
  };

  const handleSave = () => {
    if (!pendingPin || !nameInput.trim()) return;
    const newEntry: Locations = {
      id: uid(),
      latitude: pendingPin.latitude,
      longitude: pendingPin.longitude,
      name: nameInput.trim(),
      description: descInput.trim(),
    };
    const updated = [...locations, newEntry];
    setLocations(updated);
    onConfirm?.(updated);  // ← persists full list to backend via screen
    setPendingPin(null);
    setNameInput('');
    setDescInput('');
    setIsNaming(false);
    setDoneKey(false);
  };

  const handleCancelNaming = () => {
    setIsNaming(false);
    setDoneKey(false);
    setNameInput('');
    setDescInput('');
  };

  const removeLocation = (id: string) => {
    const updated = locations.filter(l => l.id !== id);
    setLocations(updated);
    onConfirm?.(updated);  // ← persists full list to backend via screen
  };

  // ── Handlers: read-only mode ──────────────────────────────────────────────
  const handleSelectLocation = (loc: Locations) => {
    const next = selectedId === loc.id ? null : loc.id;
    setSelectedId(next);
    onSelectLocation?.(next ? loc : null);
  };

  // ── Handlers: own-card select mode (trade "where" subflow) ────────────────
  const handleProposeLocation = (loc: Locations) => {
    const next = selectedLocationId === loc.id ? null : loc.id;
    setSelectedLocationId(next);
    onProposeLocation?.(next ? loc : null);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const pinReady = !!pendingPin && !isNaming && !isSelectMode;
  const canAddMore = locations.length < MAX_LOCATIONS;
  // A standing proposal (when not picking a new one) shows just that spot.
  const showProposal = !!proposedLocation && !isSelectMode;

  const displayLocations = showProposal
    ? [proposedLocation!]
    : isUser ? locations : externalLocations.slice(0, MAX_LOCATIONS);

  // Where the map starts: the saved locations shown on it (or the proposed
  // spot) if there are any; otherwise your area if Location Services is on
  // and the phone allows it; otherwise the default. Saved locations can
  // arrive after the map appears, so the map moves to them once, unless
  // you've already moved it yourself (adding a location later doesn't move it).
  const mapRef = useRef<MapView>(null);
  const userMovedMap = useRef(false);
  const centeredOnLocations = useRef(false);
  const hasLocations = displayLocations.length > 0;
  const userRegion = useUserRegion(!hasLocations);
  const startRegion = hasLocations ? regionForLocations(displayLocations) : initialRegion;
  useEffect(() => {
    if (!hasLocations || centeredOnLocations.current) return;
    centeredOnLocations.current = true;
    if (!userMovedMap.current) mapRef.current?.animateToRegion(regionForLocations(displayLocations), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLocations]);
  useEffect(() => {
    // Not after deleting your last location: the map stays where it is.
    if (userRegion && !hasLocations && !userMovedMap.current && !centeredOnLocations.current) {
      mapRef.current?.animateToRegion(userRegion, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRegion]);

  return (
    <View
      style={[styles.container, { transform: [{ scale }] }]}
      onStartShouldSetResponder={() => true}
    >
      <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>

        <View
          style={[styles.mapWrapper, { marginBottom: footerHeight }]}
          onTouchStart={() => { if (mapActiveRef) mapActiveRef.current = true; }}
          onTouchEnd={() => { if (mapActiveRef) mapActiveRef.current = false; }}
          onTouchCancel={() => { if (mapActiveRef) mapActiveRef.current = false; }}
        >
          <MapView
            ref={mapRef}
            onPanDrag={() => { userMovedMap.current = true; }}
            style={StyleSheet.absoluteFill}
            initialRegion={startRegion}
            onPress={handleMapPress}
            scrollEnabled={true}
            zoomEnabled={true}
            rotateEnabled={true}
            pitchEnabled={true}
            userInterfaceStyle="dark"
          >
            {displayLocations.map(loc => (
              <Marker
                key={loc.id}
                coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                pinColor={
                  showProposal ||
                  (isSelectMode && loc.id === selectedLocationId) ||
                  (!isUser && loc.id === selectedId)
                    ? colors.actions.location
                    : colors.ui.cardsecondary
                }
                title={loc.name}
              />
            ))}
            {isUser && pendingPin && (
              <Marker
                coordinate={pendingPin}
                pinColor={colors.actions.location}
              />
            )}
          </MapView>
        </View>

        <View
          style={styles.footer}
          onLayout={e => setFooterHeight(e.nativeEvent.layout.height)}
        >
          <View style={styles.titleRow}>
            <Text style={styles.footerTitle}>
              {showProposal ? 'Meetup Location' : isUser ? 'Your Safe Exchange Locations' : 'Safe Exchange Locations'}
            </Text>
            <FontAwesome6 name="circle-dot" size={24} color={colors.ui.cardsecondary} />
          </View>

          {/* ── Standing proposal: just that spot, with a check ── */}
          {showProposal && (
            <View style={styles.locationRow}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{proposedLocation!.name}</Text>
                {proposedLocation!.description ? (
                  <Text style={styles.locationDesc}>{proposedLocation!.description}</Text>
                ) : null}
                <Text style={styles.coordText}>
                  {proposedLocation!.latitude.toFixed(4)}, {proposedLocation!.longitude.toFixed(4)}
                </Text>
              </View>
              <FontAwesome6 name="circle-check" size={24} color={colors.actions.location} />
            </View>
          )}

          {/* ── User mode: editable / selectable list ── */}
          {!showProposal && isUser && locations.map(loc => (
            <View key={loc.id} style={styles.locationRow}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{loc.name}</Text>
                {loc.description ? (
                  <Text style={styles.locationDesc}>{loc.description}</Text>
                ) : null}
                <Text style={styles.coordText}>
                  {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                </Text>
              </View>

              {isSelectMode ? (
                <TouchableOpacity onPress={() => handleProposeLocation(loc)} hitSlop={8}>
                  <FontAwesome6
                    name={selectedLocationId === loc.id ? 'circle-check' : 'circle'}
                    size={24}
                    color={
                      selectedLocationId === loc.id
                        ? colors.actions.location
                        : colors.ui.cardsecondary
                    }
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => removeLocation(loc.id)} hitSlop={8}>
                  <FontAwesome6 name="circle-xmark" size={24} color={colors.ui.cardsecondary} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Posting needs at least one saved location (see DeckProfile). */}
          {!showProposal && isUser && !isSelectMode && locations.length === 0 && (
            <Text style={styles.requiredText}>(1 location required to post)</Text>
          )}

          {!showProposal && isUser && canAddMore && !isNaming && !isSelectMode && (
            <TouchableOpacity
              style={styles.addLocationBtn}
              onPress={handleAddLocationPress}
              disabled={!pinReady}
              activeOpacity={pinReady ? 0.7 : 1}
            >
              <FontAwesome6
                name="circle-plus"
                size={24}
                color={pinReady ? colors.actions.location : colors.ui.carddisabled}
              />
              <Text style={[
                styles.addLocationText,
                { color: pinReady ? colors.actions.location : colors.ui.carddisabled }
              ]}>
                Location
              </Text>
            </TouchableOpacity>
          )}

          {!showProposal && isUser && isNaming && !isSelectMode && (
            <View style={styles.namingBlock}>
              <View style={styles.nameRow}>
                <TextInput
                  keyboardAppearance="dark"
                  style={styles.nameInput}
                  value={nameInput}
                  onFocus={() => { kbField.onFocus(); setDoneKey(true); }}
                  onChangeText={v => { setNameInput(v); kbField.requestLift(); }}
                  placeholder="Name"
                  maxLength={TEXT_LIMITS.locationName}
                  placeholderTextColor={colors.ui.cardsecondary}
                  autoFocus
                  returnKeyType={doneKey ? 'done' : 'default'}
                />
                <TouchableOpacity onPress={handleSave} hitSlop={8} disabled={!nameInput.trim()}>
                  <FontAwesome6
                    name="circle-check"
                    size={24}
                    color={!nameInput.trim() ? colors.ui.carddisabled : colors.actions.location}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancelNaming} hitSlop={8}>
                  <FontAwesome6 name="circle-xmark" size={24} color={colors.ui.cardsecondary} />
                </TouchableOpacity>
              </View>
              <TextInput
                keyboardAppearance="dark"
                style={styles.descInput}
                value={descInput}
                onFocus={kbField.onFocus}
                onChangeText={v => { setDescInput(v); kbField.requestLift(); }}
                placeholder="Description (optional)"
                maxLength={TEXT_LIMITS.locationDescription}
                placeholderTextColor={colors.ui.cardsecondary}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>
          )}

          {/* ── Read-only mode: selectable list (other user's locations) ── */}
          {!showProposal && !isUser && externalLocations.slice(0, MAX_LOCATIONS).map(loc => {
            const isSelected = loc.id === selectedId;
            return (
              <View key={loc.id} style={styles.locationRow}>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{loc.name}</Text>
                  {loc.description ? (
                    <Text style={styles.locationDesc}>{loc.description}</Text>
                  ) : null}
                  <Text style={styles.coordText}>
                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleSelectLocation(loc)} hitSlop={8}>
                  <FontAwesome6
                    name={isSelected ? 'circle-check' : 'circle'}
                    size={24}
                    color={isSelected ? colors.actions.location : colors.ui.cardsecondary}
                  />
                </TouchableOpacity>
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
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 2,
    overflow: 'hidden',
  },
  mapWrapper: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 2,
    flex: 1,
    overflow: 'hidden',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  footerTitle: {
    fontSize: 18,
    fontFamily: globalFonts.bold,
    color: '#000',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  locationInfo: {
    flex: 1,
    paddingRight: 8,
    gap: 4,
  },
  locationName: {
    fontSize: 18,
    fontFamily: globalFonts.bold,
    color: '#000',
  },
  coordText: {
    fontSize: 16,
    fontFamily: globalFonts.regular,
    color: colors.ui.cardsecondary,
    letterSpacing: -0.2,
  },
  locationDesc: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: globalFonts.regular,
    color: colors.ui.background,
  },
  addLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  requiredText: {
    fontSize: 16,
    fontFamily: globalFonts.regular,
    color: colors.ui.cardsecondary,
    letterSpacing: -0.2,
    paddingVertical: 4,
  },
  addLocationText: {
    fontSize: 18,
    fontFamily: globalFonts.bold,
  },
  namingBlock: {
    gap: 8,
    marginTop: 2,
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nameInput: {
    flex: 1,
    marginRight: 4,
    fontSize: 18,
    fontFamily: globalFonts.bold,
    color: '#000',
  },
  descInput: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: globalFonts.regular,
    color: '#000',
  },
});

export default CardLocation;