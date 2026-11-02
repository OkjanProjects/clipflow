import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { Badge, Button, Screen, SectionHeader, TextMuted } from '@/components/ui';
import { palette, radius, spacing, typography } from '@/constants/theme';
import { useSession } from '@/lib/session';

const DEFAULT_TEMPLATE = '7625211784307248404';

const ACTIONS = [
  { key: 'edit', icon: 'cut-outline', title: 'Editar vídeo', hint: 'Timeline com clipes' },
  { key: 'template', icon: 'albums-outline', title: 'Usar template', hint: '7 clipes prontos' },
  { key: 'auto', icon: 'sparkles-outline', title: 'AutoCut', hint: 'IA escolhe os cortes' },
  { key: 'captions', icon: 'text-outline', title: 'Legendas', hint: 'Transcrição automática' },
] as const;

export default function CreateScreen() {
  const router = useRouter();
  const { user, isGuest, signIn, continueAsGuest } = useSession();
  const [gateOpen, setGateOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const openEditor = () =>
    router.push({ pathname: '/editor/[id]', params: { id: DEFAULT_TEMPLATE } });

  const startAction = () => {
    if (!user) {
      void continueAsGuest().then(openEditor);
      return;
    }
    if (isGuest) {
      setGateOpen(true);
      return;
    }
    openEditor();
  };

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signIn();
      setGateOpen(false);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Criar</Text>
          <TextMuted>Comece de um template ou de um projeto vazio.</TextMuted>
        </View>

        <Pressable onPress={startAction} style={styles.heroPress}>
          <LinearGradient
            colors={['#00CAE0', '#0A7C8C', '#12323A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}>
            <View style={styles.heroTop}>
              <Badge label="novo" tone="dark" />
              <Ionicons name="add" size={22} color="#fff" />
            </View>
            <View>
              <Text style={styles.heroTitle}>Novo projeto</Text>
              <Text style={styles.heroSub}>Importe clipes e comece a editar</Text>
            </View>
          </LinearGradient>
        </Pressable>

        {isGuest ? (
          <View style={styles.guestBanner}>
            <Ionicons name="information-circle-outline" size={18} color={palette.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.guestTitle}>Você está como visitante</Text>
              <TextMuted style={styles.guestText}>
                Editar é livre. Exportar sem marca d’água exige uma conta.
              </TextMuted>
            </View>
            <Pressable onPress={() => setGateOpen(true)} hitSlop={8}>
              <Text style={styles.guestCta}>Entrar</Text>
            </Pressable>
          </View>
        ) : null}

        <SectionHeader title="Atalhos" />
        <View style={styles.actions}>
          {ACTIONS.map((action) => (
            <Pressable
              key={action.key}
              onPress={startAction}
              style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.8 }]}>
              <View style={styles.actionIcon}>
                <Ionicons name={action.icon} size={19} color={palette.accent} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <TextMuted style={styles.actionHint}>{action.hint}</TextMuted>
            </Pressable>
          ))}
        </View>

        <SectionHeader title="Rascunhos" action="Ver todos" onAction={startAction} />
        <View style={styles.drafts}>
          <DraftRow title="Meu primeiro corte" meta="7 clipes · 1:25" />
          <DraftRow title="Trend do momento" meta="3 clipes · 0:18" />
        </View>

        <TextMuted style={styles.footnote}>
          Modo de dados: <Text style={{ color: palette.accent }}>mock local</Text> — o contrato
          reproduz os endpoints `/lv/v1/*` do app original.
        </TextMuted>
      </ScrollView>

      <BottomSheet
        visible={gateOpen}
        onClose={() => setGateOpen(false)}
        title="Entrar para exportar">
        <TextMuted style={styles.sheetText}>
          O CapCut faz o mesmo: você edita como visitante (`device_login`) e só vincula uma conta
          (`bind_visitor_account`) quando precisa exportar ou sincronizar.
        </TextMuted>
        <Button label="Entrar agora" icon="log-in-outline" loading={signingIn} onPress={handleSignIn} />
        <Button
          label="Continuar como visitante"
          variant="secondary"
          onPress={() => {
            setGateOpen(false);
            openEditor();
          }}
        />
        <TextMuted style={styles.sheetHint}>
          Demonstração: nenhuma credencial é enviada para servidor algum.
        </TextMuted>
      </BottomSheet>
    </Screen>
  );
}

function DraftRow({ title, meta }: { title: string; meta: string }) {
  return (
    <View style={styles.draftRow}>
      <View style={styles.draftThumb}>
        <Ionicons name="play" size={14} color={palette.textDim} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.draftTitle}>{title}</Text>
        <TextMuted style={styles.draftMeta}>{meta}</TextMuted>
      </View>
      <Ionicons name="chevron-forward" size={16} color={palette.textMuted} />
    </View>
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
  heroPress: {
    marginHorizontal: spacing.lg,
  },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    height: 172,
    justifyContent: 'space-between',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    marginTop: 4,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  guestTitle: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700',
  },
  guestText: {
    fontSize: 11,
    marginTop: 2,
  },
  guestCta: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actionCard: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: 4,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
  },
  actionHint: {
    fontSize: 11,
  },
  drafts: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  draftThumb: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftTitle: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '600',
  },
  draftMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  footnote: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    fontSize: 11,
    lineHeight: 16,
  },
  sheetText: {
    lineHeight: 20,
  },
  sheetHint: {
    fontSize: 11,
    textAlign: 'center',
  },
});
