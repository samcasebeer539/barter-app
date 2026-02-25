import { useRouter } from 'expo-router';

export default function Index() {
    const router = useRouter()
    router.replace('/feed');
}