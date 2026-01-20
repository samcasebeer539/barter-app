import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the feed tab as the initial screen
  return <Redirect href="/(tabs)/feed" />;
}
