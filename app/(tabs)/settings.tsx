import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useRouter } from 'expo-router';
import { colors, globalFonts } from '@/styles/globalStyles';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function SettingsScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [locationEnabled, setLocationEnabled] = React.useState(true);

  const handleBackPress = () => {
    router.push('/profiledeck');
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Sign out error: ", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topBarContainer}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleBackPress}
        >
          
          <Text style={styles.headerTitle}>
            SETTINGS
          </Text>
          <FontAwesome6 name="chevron-left" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <FontAwesome6 name="user" size={20} color="#fff" />
              <Text style={styles.settingText}>Edit Profile</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={20} color={colors.ui.secondarydisabled} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <FontAwesome6 name="lock" size={20} color="#fff" />
              <Text style={styles.settingText}>Privacy</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={20} color={colors.ui.secondarydisabled} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <FontAwesome6 name="shield-halved" size={20} color="#fff" />
              <Text style={styles.settingText}>Security</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={20} color={colors.ui.secondarydisabled} />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <FontAwesome6 name="bell" size={20} color="#fff" />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#3e3e3e', true: '#30C759' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <FontAwesome6 name="location-dot" size={20} color="#fff" />
              <Text style={styles.settingText}>Location Services</Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: '#3e3e3e', true: '#30C759' }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <FontAwesome6 name="globe" size={20} color="#fff" />
              <Text style={styles.settingText}>Language</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>English</Text>
              <FontAwesome6 name="chevron-right" size={20} color={colors.ui.secondarydisabled} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <FontAwesome6 name="circle-question" size={20} color="#fff" />
              <Text style={styles.settingText}>Help Center</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={20} color={colors.ui.secondarydisabled} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <FontAwesome6 name="circle-info" size={20} color="#fff" />
              <Text style={styles.settingText}>About</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={20} color={colors.ui.secondarydisabled} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <FontAwesome6 name="scale-balanced" size={20} color="#fff" />
              <Text style={styles.settingText}>Terms & Conditions</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={20} color={colors.ui.secondarydisabled} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <FontAwesome6
            name="right-from-bracket"
            size={20}
            color={colors.actions.decline}
          />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ui.background,
  },
  topBarContainer: {
    backgroundColor: colors.ui.background,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    zIndex: 10,
    paddingBottom: 4,
    paddingTop: 48,
    gap: 4,
  },
  settingsButton: {
    flex: 1,
    height: 44,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
  },

  headerTitle: {
    fontSize: 20,
    fontFamily: globalFonts.bold,
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    marginTop: 100,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.ui.secondarydisabled,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: globalFonts.bold,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingText: {
    fontSize: 18,
    color: '#fff',
    fontFamily: globalFonts.regular,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 18,
    fontFamily: globalFonts.regular,
    color: colors.ui.secondarydisabled,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 44,
    marginHorizontal: 28,
    marginTop: 16,
    
    
    borderRadius: 2,
    borderWidth: 3,
    borderColor: colors.actions.decline,
  },
  logoutText: {
    fontSize: 18,
    fontFamily: globalFonts.bold,
    color: colors.actions.decline,
  },
  bottomSpacer: {
    height: 80,
  },
});