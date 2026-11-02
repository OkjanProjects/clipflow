import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { palette, radius } from '@/constants/theme';

/**
 * Player de preview.
 *
 * O cover fica sempre atrás do vídeo: se a rede falhar, o usuário ainda vê a
 * capa (mesmo padrão de fallback que o feed do CapCut usa com `coverUrl`).
 */
export function TemplateVideo({
  uri,
  poster,
  style,
  autoPlay = true,
  showMuteToggle = true,
}: {
  uri: string;
  poster: string;
  style?: StyleProp<ViewStyle>;
  autoPlay?: boolean;
  showMuteToggle?: boolean;
}) {
  const [muted, setMuted] = useState(true);

  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.muted = true;
    if (autoPlay) instance.play();
  });

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    player.muted = next;
  };

  return (
    <View style={[styles.wrap, style]}>
      <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        pointerEvents="none"
      />
      {showMuteToggle ? (
        <Pressable
          onPress={toggleMute}
          accessibilityRole="button"
          accessibilityLabel={muted ? 'Ativar som' : 'Silenciar'}
          hitSlop={8}
          style={styles.muteButton}>
          <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={16} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.lg,
  },
  muteButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
