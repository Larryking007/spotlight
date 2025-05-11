import { Text, TouchableOpacity, View } from 'react-native'
import { useAuth } from '@clerk/clerk-expo'
import React from 'react'
import { styles } from '@/constants/auth.styles';

const index = () => {

  const { signOut } = useAuth();
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => signOut()}>
        <Text style={{
          color: 'white',
        }}>Signout</Text>
      </TouchableOpacity>
    </View>
  )
}

export default index
