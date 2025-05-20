import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Loader from '@/components/Loader';
import { styles } from '@/styles/notification.style';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { Link } from 'expo-router';
import { Image } from 'expo-image';
import { formatDistanceToNow } from 'date-fns';
import Notification from '@/components/Notifications';

export default function Notifications() {
  const notifications = useQuery(api.notification.getNotifications);

  if (notifications === undefined) return <Loader />;
  if (notifications.length === 0) return <NotificationsFound />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>


      {/* <FlatList
        data={notifications}
        renderItem={({ item }) => <Notification notification={item} />}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      /> */}

    </View >
  )
}


function NotificationsFound() {
  return (
    <View style={[styles.container, styles.centered]}>
      <Ionicons name="notifications-outline" size={48} color={COLORS.primary} />
      <Text>No notifications yet</Text>
    </View>
  );
}