import { Ionicons } from '@expo/vector-icons'
import { Image, Text, View } from 'react-native'
import { styles } from "../../constants/auth.styles"
import { COLORS } from 'constants/theme'


export default function login() {
  return (
    <View style={styles.container}>

      {/* Brand Section */}
      <View style={styles.brandSection}>
        <View style={styles.logoContainer}>
          <Ionicons name='leaf' size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.appName}>spotlight</Text>
        <Text style={styles.tagline}>don't miss anything</Text>
      </View>

      {/* ILLUSTRATION */}
      <View style={styles.illustrationContainer}>
        <Image source={require('../../assets/images/auth-bg-1.png')}
          style={styles.illustration}
          resizeMode='cover' />
      </View>
    </View>
  )
}

