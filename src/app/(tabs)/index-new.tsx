import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { UpdatePopup } from '@/components/update-popup';
import { Badge, EmptyState, Screen, SectionHeader, TextMuted } from '@/components/ui';
import { palette, radius, spacing, shadow, typography } from '@/constants/theme';
import { COLLECTIONS } from '@/lib/mock-data';
import { useFeed } from '@/lib/use-feed';
import { TemplateCardPro } from './template-card-pro';

export default function DiscoverScreen() {
  const router = useRouter();
  const [collectionId, setCollectionId] = useState('10001');
  const [showUpdate, setShowUpdate] = useState(true);
  
  const { items, loading, refreshing, hasMore, error, loadMore, refresh, reload } = useFeed({
    collectionId,
  });

  const openSearch = useCallback(() => router.push('/(tabs)/templates'), [router]);

  const handleTemplatePress = useCallback((templateId: string) => {
    router.push(`/template/${templateId}`);
  }, [router]);

  return (
    <Screen>
      <UpdatePopup />
      
      <FlatList
        data={items}
        keyExtractor={(item) => item.templateId}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
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
            {/* Header Profissional */}
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.logoContainer}>
                  <View style={styles.logoMark}>
                    <Ionicons name="sparkles" size={20} color={palette.accentInk} />
                  </View>
                  <View>
                    <Text style={styles.brand}>ClipFlow</Text>
                    <Text style={styles.brandSub}>Editor Pro</Text>
                  </View>
                </View>
                <Pressable
                  onPress={openSearch}
                  style={styles.searchButton}
                  hitSlop={8}>
                  <Ionicons name="search" size={20} color={palette.text} />
                </Pressable>
              </View>

              {/* Hero Section */}
              <View style={styles.hero}>
                <Text style={styles.heroTitle}>Crie conteúdo</Text>
                <Text style={styles.heroTitleAccent}>profissional</Text>
                <TextMuted style={styles.heroSub}>
                  Templates prontos, edição em tempo real e export em 4K
                </TextMuted>
              </View>

              {/* Search Bar */}
              <Pressable 
                onPress={openSearch} 
                style={styles.searchBar}
                accessibilityRole="search"
              >
                <Ionicons name="search" size={18} color={palette.textMuted} />
                <Text style={styles.searchText}>
                  Buscar templates, efeitos, categorias...
                </Text>
                <View style={styles.searchHint}>
                  <Text style={styles.searchHintText}>⌘K</Text>
                </View>
              </Pressable>

              {/* Coleções como pills elegantes */}
              <View style={styles.collectionsWrapper}>
                <FlatList
                  data={COLLECTIONS}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.collectionId}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => setCollectionId(item.collectionId)}
                      style={[
                        styles.collectionPill,
                        collectionId === item.collectionId && styles.collectionPillActive,
                      ]}>
                      <Text
                        style={[
                          styles.collectionText,
                          collectionId === item.collectionId && styles.collectionTextActive,
                        ]}>
                        {item.text}
                      </Text>
                    </Pressable>
                  )}
                  contentContainerStyle={styles.collections}
                />
              </View>

              <SectionHeader 
                title="Recomendados para você"
                action="Ver tudo"
                onAction={openSearch}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.gridLoading}>
              <View style={styles.skeletonGrid}>
                {[...Array(4)].map((_, i) => (
                  <View key={i} style={styles.skeletonCard} />
                ))}
              </View>
            </View>
          ) : error ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Erro de conexão"
              description={error}
              action={
                <Pressable onPress={reload} style={styles.retryButton}>
                  <Ionicons name="reload" size={16} color={palette.accentInk} />
                  <Text style={styles.retryLabel}>Tentar novamente</Text>
                </Pressable>
              }
            />
          ) : (
            <EmptyState
              icon="albums-outline"
              title="Nenhum template encontrado"
              description="Tente buscar em outra coleção ou categoria"
            />
          )
        }
        ListFooterComponent={
          hasMore && items.length > 0 ? (
            <View style={styles.footer}>
              <View style={styles.loadingBar}>
                <View style={styles.loadingBarFill} />
              </View>
            </View>
          ) : items.length > 0 ? (
            <View style={styles.endContainer}>
              <TextMuted style={styles.endText}>
                Você chegou ao fim
              </TextMuted>
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <TemplateCardPro 
              template={item} 
              onPress={() => handleTemplatePress(item.templateId)}
            />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  column: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  cell: {
    flex: 1,
    marginBottom: spacing.md,
  },
  header: {
    paddingTop: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  brand: {
    ...typography.h3,
    color: palette.textPrimary,
    letterSpacing: -0.3,
  },
  brandSub: {
    ...typography.micro,
    color: palette.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  hero: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroTitle: {
    ...typography.display,
    color: palette.textPrimary,
    lineHeight: 44,
  },
  heroTitleAccent: {
    ...typography.display,
    color: palette.accent,
    lineHeight: 44,
  },
  heroSub: {
    ...typography.bodyLg,
    marginTop: spacing.md,
    maxWidth: 320,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
  },
  searchText: {
    flex: 1,
    color: palette.textMuted,
    ...typography.body,
  },
  searchHint: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  searchHintText: {
    ...typography.micro,
    color: palette.textMuted,
  },
  collectionsWrapper: {
    marginBottom: spacing.xl,
  },
  collections: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  collectionPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  collectionPillActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  collectionText: {
    ...typography.bodySm,
    color: palette.textSecondary,
    fontWeight: '600',
  },
  collectionTextActive: {
    color: palette.accentInk,
  },
  gridLoading: {
    paddingVertical: spacing.xxxl,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  skeletonCard: {
    width: '47%',
    aspectRatio: 9/16,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: palette.accent,
  },
  retryLabel: {
    color: palette.accentInk,
    ...typography.bodySm,
    fontWeight: '700',
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  loadingBar: {
    width: 120,
    height: 2,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 1,
    overflow: 'hidden',
  },
  loadingBarFill: {
    width: '60%',
    height: '100%',
    backgroundColor: palette.accent,
  },
  endContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  endText: {
    ...typography.caption,
  },
});
