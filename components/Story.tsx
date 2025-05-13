import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { styles } from '@/styles/feed.styles';

type Story = {
  id: string;
  username: string;
  avatar: string;
  hasStory: boolean;
};

export default function Story({ Story }: { Story: Story }) {
  return (
    <TouchableOpacity style={styles.storyWrapper}>
      <View style={[styles.storyRing, !Story.hasStory && styles.noStory]}>
        <Image
          source={{ uri: Story.avatar }}
          style={styles.storyAvatar}
        />
      </View>
      <Text style={styles.storyUsername}>{Story.username}</Text>
    </TouchableOpacity>

  )
}