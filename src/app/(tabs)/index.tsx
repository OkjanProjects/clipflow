import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TemplateCard } from '@/components/template-card';
import { Badge, Chip, EmptyState, Screen, SectionHeader, TextMuted } from '@/components/ui';
import { palette, radius, spacing, typography } from '@/constants/theme';
import { COLLECTIONS } from '@/lib/mock-data';
import { useFeed } from '@/lib/use-feed';

export default function DiscoverScreen() {
  const router = useRouter();
  const [collectionId, setCollectionId] = useState('10001');
  const { items, loading, refreshing, hasMore, error, loadMore, refresh, reload } = useFeed({
    collectionId,
  });

  const openSearch = useCallback(() => router.push('/(tabs)/templates'), [router]);

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.templateId}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={palette.accent}
            colors={[palette.accent]}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <View style={styles.brandRow}>
                <View style={styles.logoMark}>
                  <Ionicons name="cut" size={16} color={palette.accentInk} />
                </View>
                <Text style={styles.brand}>ClipFlow</Text>
                <Badge label="beta" tone="accent" />
              </View>
              <Pressable
                onPress={openSearch}
                accessibilityRole="button"
                accessibilityLabel="Buscar templates"
                style={styles.iconButton}>
                <Ionicons name="search" size={20} color={palette.text} />
              </Pressable>
            </View>

            <Text style={styles.hero}>Crie no ritmo{'\n'}do feed.</Text>
            <TextMuted style={styles.heroSub}>
              Templates prontos, preview instantâneo e edição em segundos.
            </TextMuted>

            <Pressable onPress={openSearch} style={styles.searchBar} accessibilityRole="search">
              <Ionicons name="search" size={16} color={palette.textMuted} />
              <Text style={styles.searchText}>Buscar template, efeito ou criador</Text>
            </Pressable>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}>
              {COLLECTIONS.map((collection) => (
                <Chip
                  key={collection.collectionId}
                  label={collection.text}
                  active={collection.collectionId === collectionId}
                  onPress={() => setCollectionId(collection.collectionId)}
                />
              ))}
            </ScrollView>

            <SectionHeader title="Em alta agora" action="Ver tudo" onAction={openSearch} />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.gridLoading}>
              <ActivityIndicator color={palette.accent} />
              <TextMuted>Carregando feed…</TextMuted>
            </View>
          ) : error ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Feed indisponível"
              description={error}
              action={
                <Pressable onPress={reload} style={styles.retry}>
                  <Text style={styles.retryLabel}>Tentar de novo</Text>
                </Pressable>
              }
            />
          ) : (
            <EmptyState
              icon="albums-outline"
              title="Nada por aqui"
              description="Esta coleção ainda não tem templates para o seu país."
            />
          )
        }
        ListFooterComponent={
          hasMore && items.length > 0 ? (
            <View style={styles.footer}>
              <ActivityIndicator color={palette.textMuted} size="small" />
            </View>
          ) : items.length > 0 ? (
            <TextMuted style={styles.end}>Você chegou ao fim do feed</TextMuted>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <TemplateCard template={item} />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  column: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  cell: {
    flex: 1,
    marginBottom: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoMark: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    color: palette.text,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    ...typography.hero,
    color: palette.text,
    paddingHorizontal: spacing.lg,
  },
  heroSub: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    lineHeight: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  searchText: {
    color: palette.textMuted,
    fontSize: 14,
  },
  chips: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  gridLoading: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  retry: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: palette.accent,
  },
  retryLabel: {
    color: palette.accentInk,
    fontWeight: '700',
  },
  footer: {
    paddingVertical: spacing.lg,
  },
  end: {
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
