import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';

import { palette, radius, spacing, typography, shadow } from '@/constants/theme';
import type { Template } from '@/lib/types';

type TemplateCardProProps = {
  template: Template;
  onPress: () => void;
  onLongPress?: () => void;
  children?: ReactNode;
};

export function TemplateCardPro({
  template,
  onPress,
  onLongPress,
  children,
}: TemplateCardProProps) {
  const [pressed, setPressed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  const pressAnim = useState(new Animated.Value(1))[0];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ scale: pressAnim }],
        },
      ]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => {
          setPressed(true);
          Animated.timing(pressAnim, {
            toValue: 0.96,
            duration: 100,
            useNativeDriver: true,
          }).start();
        }}
        onPressOut={() => {
          setPressed(false);
          Animated.spring(pressAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }}
        hitSlop={4}
        style={({ pressed: isPressed }) => [
          styles.pressable,
          isPressed && { opacity: 0.9 },
        ]}>
        
        {/* Thumbnail */}
        <View style={styles.thumbnailWrapper}>
          <Image
            source={{ uri: template.coverUrl }}
            style={[
              styles.thumbnail,
              !loaded && styles.thumbnailLoading,
            ]}
            onLoadEnd={() => setLoaded(true)}
            resizeMode="cover"
          />
          
          {/* Duration badge */}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {Math.floor(template.templateDuration / 1000)}s
            </Text>
          </View>
          
          {/* Pro badge */}
          {template.isPro && (
            <View style={styles.proBadge}>
              <Ionicons name="diamond" size={10} color={palette.pro} />
              <Text style={styles.proText}>Pro</Text>
            </View>
          )}
          
          {/* Gradient overlay */}
          <View style={styles.gradientOverlay} />
          
          {/* Use template button (hover state) */}
          <Animated.View
            style={[
              styles.useButton,
              {
                opacity: pressed ? 1 : 0,
              },
            ]}>
            <Text style={styles.useButtonText}>Usar template</Text>
            <Ionicons name="arrow-forward" size={14} color={palette.accentInk} />
          </Animated.View>
        </View>

        {/* Info section */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {template.title}
          </Text>
          
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Ionicons name="play" size={13} color={palette.textMuted} />
              <Text style={styles.statText}>{formatNumber(template.usageAmount)} usos</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={13} color={palette.like} />
              <Text style={styles.statText}>{formatNumber(template.likeAmount)}</Text>
            </View>
          </View>
          
          <View style={styles.author}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={16} color={palette.textMuted} />
            </View>
            <Text style={styles.authorName} numberOfLines={1}>
              @{template.author.name}
            </Text>
          </View>
        </View>
        
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    ...shadow.sm,
  },
  pressable: {
    overflow: 'hidden',
  },
  thumbnailWrapper: {
    position: 'relative',
    aspectRatio: 9 / 16,
    overflow: 'hidden',
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
  },
  thumbnailLoading: {
    backgroundColor: palette.surfaceAlt,
  },
  durationBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  durationText: {
    ...typography.micro,
    color: palette.textPrimary,
    fontWeight: '700',
  },
  proBadge: {
    position: 'absolute',
    left: spacing.sm,
    top: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: palette.proSoft,
  },
  proText: {
    ...typography.micro,
    color: palette.pro,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  useButton: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: palette.accent,
    ...shadow.md,
  },
  useButtonText: {
    ...typography.bodySm,
    color: palette.accentInk,
    fontWeight: '700',
  },
  info: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.body,
    color: palette.textPrimary,
    fontWeight: '600',
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...typography.caption,
    color: palette.textMuted,
    fontWeight: '500',
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    ...typography.caption,
    color: palette.textDim,
    fontWeight: '500',
  },
});