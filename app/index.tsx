import { Link } from "expo-router";
import { Text, View, StyleSheet, TouchableOpacity, } from "react-native";

export default function Index() {
  return (
    <View style={styles.container} >
      <Text style={styles.title}>Home</Text>
      <Link href="/notifications">This is the notification page </Link>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: 'red',
  },
})