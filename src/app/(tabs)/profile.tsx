import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Divider, Screen, SectionHeader, TextMuted } from '@/components/ui';
import { palette, radius, spacing, typography } from '@/constants/theme';
import { apiMode } from '@/lib/api';
import { useSession } from '@/lib/session';

const MENU = [
  { key: 'drafts', icon: 'folder-open-outline', label: 'Meus rascunhos', value: '2' },
  { key: 'favorites', icon: 'heart-outline', label: 'Favoritos', value: '0' },
  { key: 'subscription', icon: 'diamond-outline', label: 'Assinatura', value: 'Free' },
  { key: 'settings', icon: 'settings-outline', label: 'Configurações', value: '' },
  { key: 'help', icon: 'help-circle-outline', label: 'Ajuda e suporte', value: '' },
] as const;

export default function ProfileScreen() {
  const { user, isGuest, signIn, signOut, continueAsGuest } = useSession();
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
          <Pressable style={styles.iconButton} accessibilityLabel="Configurações">
            <Ionicons name="settings-outline" size={19} color={palette.text} />
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.userRow}>
            <Image
              source={{
                uri:
                  user?.avatarUrl ?? 'https://picsum.photos/seed/clipflow_anon/160/160',
              }}
              style={styles.avatar}
              contentFit="cover"
              transition={150}
            />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.name}>{user?.name ?? 'Sem sessão'}</Text>
              <TextMuted style={styles.uid} numberOfLines={1}>
                {user ? user.uid : 'nenhum device registrado'}
              </TextMuted>
              {user ? (
                <View style={styles.badges}>
                  <Badge
                    label={isGuest ? 'visitante' : 'membro'}
                    tone={isGuest ? 'neutral' : 'accent'}
                    icon={isGuest ? 'person-outline' : 'checkmark-circle'}
                  />
                  <Badge label={user.region} tone="neutral" icon="globe-outline" />
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.stats}>
            <Metric label="Rascunhos" value="2" />
            <View style={styles.statDivider} />
            <Metric label="Templates" value="7" />
            <View style={styles.statDivider} />
            <Metric label="Exportados" value="12" />
          </View>

          {!user ? (
            <View style={styles.actions}>
              <Button
                label="Entrar"
                icon="log-in-outline"
                loading={busy}
                onPress={() => run(signIn)}
              />
              <Button
                label="Continuar como visitante"
                variant="secondary"
                onPress={() => run(continueAsGuest)}
              />
            </View>
          ) : isGuest ? (
            <Button
              label="Vincular conta"
              icon="link-outline"
              loading={busy}
              onPress={() => run(signIn)}
            />
          ) : (
            <Button
              label="Sair"
              icon="log-out-outline"
              variant="secondary"
              loading={busy}
              onPress={() => run(signOut)}
            />
          )}
        </View>

        <SectionHeader title="Conta" />
        <View style={styles.menu}>
          {MENU.map((item, index) => (
            <View key={item.key}>
              <Pressable style={styles.menuRow} accessibilityRole="button">
                <Ionicons name={item.icon} size={19} color={palette.textDim} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                {item.value ? <TextMuted style={styles.menuValue}>{item.value}</TextMuted> : null}
                <Ionicons name="chevron-forward" size={15} color={palette.textMuted} />
              </Pressable>
              {index < MENU.length - 1 ? <Divider /> : null}
            </View>
          ))}
        </View>

        <SectionHeader title="Sobre este app" />
        <View style={styles.about}>
          <Row label="Versão" value={Constants.expoConfig?.version ?? '1.0.0'} />
          <Row label="Fonte de dados" value={apiMode === 'mock' ? 'mock local' : 'API remota'} />
          <Row label="Contrato" value="/lv/v1 · /lv/v2 · /passport" />
          <Row label="Sessão" value="device_login → bind_visitor_account" />
        </View>

        <TextMuted style={styles.disclaimer}>
          Projeto independente, construído a partir de análise estática de superfícies públicas.
          Não é afiliado ao CapCut/ByteDance. Nenhum asset proprietário foi extraído.
        </TextMuted>
      </ScrollView>
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <TextMuted style={styles.metricLabel}>{label}</TextMuted>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <TextMuted>{label}</TextMuted>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.hero,
    color: palette.text,
    fontSize: 28,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceAlt,
  },
  name: {
    color: palette.text,
    fontSize: 19,
    fontWeight: '700',
  },
  uid: {
    fontSize: 11,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricValue: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 26,
    backgroundColor: palette.borderStrong,
  },
  actions: {
    gap: spacing.sm,
  },
  menu: {
    marginHorizontal: spacing.lg,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  menuLabel: {
    flex: 1,
    color: palette.text,
    fontSize: 14,
    fontWeight: '500',
  },
  menuValue: {
    fontSize: 12,
  },
  about: {
    marginHorizontal: spacing.lg,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  rowValue: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  disclaimer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    fontSize: 11,
    lineHeight: 16,
  },
});
