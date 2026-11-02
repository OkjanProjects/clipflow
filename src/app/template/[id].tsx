import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/bottom-sheet';
import { TemplateCard } from '@/components/template-card';
import { TemplateVideo } from '@/components/video-hero';
import { Badge, Button, Chip, EmptyState, Screen, TextMuted } from '@/components/ui';
import { palette, radius, spacing, typography } from '@/constants/theme';
import { getRecommendations, getTemplate } from '@/lib/api';
import { formatCount, formatDuration, formatRelativeTime } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { Template } from '@/lib/types';

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { user, isGuest, signIn, continueAsGuest } = useSession();

  const [template, setTemplate] = useState<Template | null>(null);
  const [recommendations, setRecommendations] = useState<Template[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setError(null);

    (async () => {
      try {
        const found = await getTemplate(String(id));
        if (!alive) return;
        setTemplate(found);
        const recs = await getRecommendations(found.templateId, 8);
        if (alive) setRecommendations(recs);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Falha ao carregar template');
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const openEditor = () => {
    if (!template) return;
    router.push({ pathname: '/editor/[id]', params: { id: template.templateId } });
  };

  const useTemplate = async () => {
    if (!user) {
      setBusy(true);
      try {
        await continueAsGuest();
        openEditor();
      } finally {
        setBusy(false);
      }
      return;
    }
    if (isGuest) {
      setGateOpen(true);
      return;
    }
    openEditor();
  };

  const share = async () => {
    if (!template) return;
    await Share.share({
      message: `clipflow://template/${template.templateId}`,
      title: template.title,
    }).catch(() => undefined);
  };

  const heroHeight = Math.min(height * 0.62, 560);

  if (error) {
    return (
      <Screen>
        <TopBar onBack={() => router.back()} onShare={share} />
        <EmptyState
          icon="alert-circle-outline"
          title="Template não encontrado"
          description={error}
          action={<Button label="Voltar" variant="secondary" onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  if (!template) {
    return (
      <Screen>
        <TopBar onBack={() => router.back()} onShare={share} />
        <View style={styles.loading}>
          <ActivityIndicator color={palette.accent} />
          <TextMuted>Carregando preview…</TextMuted>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        <View style={{ height: heroHeight }}>
          <TemplateVideo
            uri={template.videoUrl}
            poster={template.coverUrl}
            style={styles.hero}
            showMuteToggle
          />
          <LinearGradient
            colors={['rgba(11,11,15,0.75)', 'transparent', 'rgba(11,11,15,0.95)']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
            <Pressable onPress={() => router.back()} style={styles.roundButton} hitSlop={8}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </Pressable>
            <View style={styles.topRight}>
              <Pressable onPress={share} style={styles.roundButton} hitSlop={8}>
                <Ionicons name="share-outline" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>

          <View style={styles.heroBottom}>
            <View style={styles.badges}>
              <Badge label={template.videoRatio} tone="dark" icon="phone-portrait-outline" />
              <Badge
                label={`${template.segmentAmount} clipes`}
                tone="dark"
                icon="layers-outline"
              />
              {template.isPro ? <Badge label="Pro" tone="pro" icon="sparkles" /> : null}
            </View>
            <Text style={styles.heroTitle}>{template.title}</Text>
            <Text style={styles.heroAuthor}>@{template.author.name}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.statsRow}>
            <Metric value={formatCount(template.playAmount)} label="plays" />
            <Metric value={formatCount(template.usageAmount)} label="usos" />
            <Metric value={formatCount(template.likeAmount)} label="likes" />
            <Metric value={formatCount(template.commentAmount)} label="comentários" />
            <Metric value={formatDuration(template.templateDuration)} label="duração" />
          </View>

          <View style={styles.chips}>
            {template.collections.map((collection) => (
              <Chip key={collection.collectionId} label={collection.text} />
            ))}
          </View>

          <Text style={styles.desc}>{template.desc}</Text>
          <TextMuted style={styles.meta}>
            {template.videoWidth}×{template.videoHeight} · publicado há{' '}
            {formatRelativeTime(template.createTime)} · id {template.templateId}
          </TextMuted>

          <View style={styles.authorCard}>
            <View style={styles.authorAvatar}>
              <Ionicons name="person" size={18} color={palette.textDim} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.authorName}>@{template.author.name}</Text>
              <TextMuted style={styles.authorDesc} numberOfLines={1}>
                {template.author.description}
              </TextMuted>
            </View>
            <View style={styles.follow}>
              <Text style={styles.followLabel}>Seguir</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Recomendados</Text>
        </View>

        <FlatList
          data={recommendations}
          horizontal
          keyExtractor={(item) => item.templateId}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
          renderItem={({ item }) => <TemplateCard template={item} variant="rail" />}
        />
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.ctaTitle}>Pronto para editar</Text>
          <TextMuted style={styles.ctaSub}>
            {template.segmentAmount} clipes · {formatDuration(template.templateDuration)}
          </TextMuted>
        </View>
        <Button label="Usar template" icon="cut-outline" loading={busy} onPress={useTemplate} />
      </View>

      <BottomSheet visible={gateOpen} onClose={() => setGateOpen(false)} title="Vincular conta?">
        <TextMuted style={styles.sheetText}>
          Você pode editar e pré-visualizar como visitante. Para exportar em alta qualidade e
          sincronizar projetos, vincule uma conta.
        </TextMuted>
        <Button
          label="Entrar agora"
          icon="log-in-outline"
          loading={busy}
          onPress={async () => {
            setBusy(true);
            try {
              await signIn();
              setGateOpen(false);
              openEditor();
            } finally {
              setBusy(false);
            }
          }}
        />
        <Button
          label="Editar como visitante"
          variant="secondary"
          onPress={() => {
            setGateOpen(false);
            openEditor();
          }}
        />
      </BottomSheet>
    </Screen>
  );
}

function TopBar({ onBack, onShare }: { onBack: () => void; onShare: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
      <Pressable onPress={onBack} style={styles.roundButton} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color="#fff" />
      </Pressable>
      <Pressable onPress={onShare} style={styles.roundButton} hitSlop={8}>
        <Ionicons name="share-outline" size={18} color="#fff" />
      </Pressable>
    </View>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 0,
  },
  hero: {
    flex: 1,
    borderRadius: 0,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  topRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roundButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottom: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    gap: 6,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  heroAuthor: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
  },
  body: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricValue: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '800',
  },
  metricLabel: {
    color: palette.textMuted,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  desc: {
    ...typography.body,
    color: palette.textDim,
    lineHeight: 21,
  },
  meta: {
    fontSize: 11,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700',
  },
  authorDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  follow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: palette.accentSoft,
  },
  followLabel: {
    color: palette.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.lg,
  },
  rail: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: palette.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
  ctaTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
  },
  ctaSub: {
    fontSize: 11,
    marginTop: 1,
  },
  sheetText: {
    lineHeight: 20,
  },
});
