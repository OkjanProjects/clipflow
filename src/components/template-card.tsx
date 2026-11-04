import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Stat } from '@/components/ui';
import { palette, radius, spacing, typography } from '@/constants/theme';
import { formatCount, formatDuration } from '@/lib/format';
import type { Template } from '@/lib/types';

export function TemplateCard({
  template,
  variant = 'grid',
}: {
  template: Template;
  variant?: 'grid' | 'rail' | 'row';
}) {
  const router = useRouter();

  const open = () =>
    router.push({ pathname: '/template/[id]', params: { id: template.templateId } });

  if (variant === 'row') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir template ${template.title}`}
        onPress={open}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View style={styles.rowCoverWrap}>
          <Image
            source={{ uri: template.coverUrl }}
            style={styles.rowCover}
            contentFit="cover"
            transition={180}
            cachePolicy="memory-disk"
          />
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(template.templateDuration)}</Text>
          </View>
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {template.title}
          </Text>
          <Text style={styles.rowAuthor} numberOfLines={1}>
            @{template.author.name}
          </Text>
          <View style={styles.rowStats}>
            <Stat icon="play" value={formatCount(template.playAmount)} />
            <Stat icon="layers-outline" value={`${template.segmentAmount} clipes`} />
          </View>
        </View>
        {template.isPro ? <Badge label="Pro" tone="pro" icon="sparkles" /> : null}
      </Pressable>
    );
  }

  const isRail = variant === 'rail';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir template ${template.title}`}
      onPress={open}
      style={({ pressed }) => [
        styles.card,
        isRail ? styles.cardRail : styles.cardGrid,
        pressed && styles.pressed,
      ]}>
      <Image
        source={{ uri: template.coverUrl }}
        style={styles.cover}
        contentFit="cover"
        transition={180}
        cachePolicy="memory-disk"
        placeholder={{ uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==' }}
      />
      <View style={styles.coverTop}>
        {template.isPro ? <Badge label="Pro" tone="pro" icon="sparkles" /> : <View />}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(template.templateDuration)}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {template.title}
        </Text>
        <View style={styles.cardMeta}>
          <Ionicons name="play" size={11} color={palette.textDim} />
          <Text style={styles.cardMetaText}>{formatCount(template.playAmount)}</Text>
          <Ionicons name="layers-outline" size={11} color={palette.textDim} />
          <Text style={styles.cardMetaText}>{template.segmentAmount}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: palette.surface,
  },
  cardGrid: {
    flex: 1,
    aspectRatio: 0.66,
  },
  cardRail: {
    width: 148,
    height: 236,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.surfaceAlt,
  },
  coverTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.sm,
  },
  durationBadge: {
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  cardFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  cardTitle: {
    ...typography.small,
    color: '#fff',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    color: palette.textDim,
    fontSize: 10,
    fontWeight: '600',
    marginRight: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowCoverWrap: {
    width: 84,
    height: 112,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  rowCover: {
    flex: 1,
    backgroundColor: palette.surfaceAlt,
  },
  rowBody: {
    flex: 1,
    gap: 5,
  },
  rowTitle: {
    ...typography.subtitle,
    color: palette.text,
    fontSize: 15,
  },
  rowAuthor: {
    color: palette.textMuted,
    fontSize: 12,
  },
  rowStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 2,
  },
});
