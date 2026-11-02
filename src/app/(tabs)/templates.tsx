import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { TemplateCard } from '@/components/template-card';
import { Chip, EmptyState, Screen, SectionHeader, TextMuted } from '@/components/ui';
import { palette, radius, spacing, typography } from '@/constants/theme';
import { CATEGORIES, COLLECTIONS } from '@/lib/mock-data';
import { useFeed } from '@/lib/use-feed';

export default function TemplatesScreen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(null);

  const activeQuery = query.trim() || category || '';
  const { items, loading, refreshing, hasMore, error, loadMore, refresh, reload } = useFeed({
    collectionId: collectionId ?? undefined,
    query: activeQuery || undefined,
  });

  const hasFilter = Boolean(activeQuery || collectionId);

  const collectionCards = useMemo(
    () =>
      COLLECTIONS.map((collection) => ({
        ...collection,
        count: 6 + Number(collection.collectionId.slice(-2)),
      })),
    []
  );

  const clearAll = () => {
    setQuery('');
    setCategory(null);
    setCollectionId(null);
  };

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.templateId}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        refreshing={refreshing}
        onRefresh={refresh}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>Templates</Text>
              <TextMuted>Catálogo com o mesmo schema do app original.</TextMuted>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color={palette.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar por título, autor ou categoria"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
                returnKeyType="search"
                autoCorrect={false}
                accessibilityLabel="Buscar templates"
              />
              {query.length > 0 ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={17} color={palette.textMuted} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.chipRow}>
              <Chip
                label="Todos"
                active={!category && !collectionId}
                onPress={() => {
                  setCategory(null);
                  setCollectionId(null);
                }}
              />
              {CATEGORIES.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  active={category === item}
                  onPress={() => {
                    setCategory(category === item ? null : item);
                    setCollectionId(null);
                  }}
                />
              ))}
            </View>

            {!hasFilter ? (
              <>
                <SectionHeader title="Coleções" />
                <View style={styles.collectionGrid}>
                  {collectionCards.map((collection) => (
                    <Pressable
                      key={collection.collectionId}
                      onPress={() => setCollectionId(collection.collectionId)}
                      style={({ pressed }) => [
                        styles.collectionCard,
                        pressed && { opacity: 0.8 },
                      ]}>
                      <View style={styles.collectionIcon}>
                        <Ionicons
                          name={
                            collection.collectionId === '70003'
                              ? 'people-outline'
                              : collection.collectionId === '10002'
                                ? 'color-wand-outline'
                                : collection.collectionId === '10012'
                                  ? 'heart-outline'
                                  : 'sparkles-outline'
                          }
                          size={18}
                          color={palette.accent}
                        />
                      </View>
                      <Text style={styles.collectionTitle}>{collection.text}</Text>
                      <TextMuted style={styles.collectionMeta}>
                        {collection.count} templates
                      </TextMuted>
                    </Pressable>
                  ))}
                </View>
                <SectionHeader title="Para você" />
              </>
            ) : (
              <View style={styles.filterRow}>
                <TextMuted>
                  {loading ? 'Buscando…' : `${items.length} resultado(s)`}
                  {collectionId ? ` · coleção ${collectionId}` : ''}
                </TextMuted>
                <Pressable onPress={clearAll} hitSlop={8}>
                  <Text style={styles.clear}>Limpar</Text>
                </Pressable>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={palette.accent} />
            </View>
          ) : error ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Busca indisponível"
              description={error}
              action={
                <Pressable onPress={reload} style={styles.retry}>
                  <Text style={styles.retryLabel}>Tentar de novo</Text>
                </Pressable>
              }
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title="Nenhum template"
              description={`Nada encontrado para "${activeQuery || collectionId}". Tente outra palavra.`}
            />
          )
        }
        ListFooterComponent={
          hasMore && items.length > 0 ? (
            <View style={styles.loading}>
              <ActivityIndicator color={palette.textMuted} size="small" />
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View style={styles.rowWrap}>
            <TemplateCard template={item} variant="row" />
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: 6,
  },
  title: {
    ...typography.hero,
    color: palette.text,
    fontSize: 28,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  input: {
    flex: 1,
    color: palette.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  collectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  collectionCard: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: 6,
  },
  collectionIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  collectionTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
  },
  collectionMeta: {
    fontSize: 11,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  clear: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  rowWrap: {
    paddingHorizontal: spacing.lg,
  },
  separator: {
    height: spacing.sm,
  },
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
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
});
