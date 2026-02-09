import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the feed screen as the initial screen
  return <Redirect href="/feed" />;
}
