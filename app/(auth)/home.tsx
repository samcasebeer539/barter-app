import { View, Text, Button } from 'react-native'
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

const Page = () => {
    const user = auth.currentUser;
    return (
        <View>
            <Text>Welcome back {user?.email}!</Text>
            <Button title="Sign Out" onPress={() => signOut(auth)}/>
        </View>
    )
};

export default Page;