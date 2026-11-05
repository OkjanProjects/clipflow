import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';
import { palette, radius, spacing, typography } from '@/constants/theme';

type UpdateInfo = {
  version: string;
  title: string;
  changes: string[];
  date: string;
};

const UPDATE_INFO: UpdateInfo = {
  version: '2.0.0',
  title: 'ClipFlow Editor Pro',
  changes: [
    '🎬 Editor de vídeo profissional com timeline interativa',
    '✂️ Corte preciso com trim handles e snapping',
    '📝 Edição de texto com animação e estilos',
    '🎵 Mixer de áudio com controle de volume',
    '✨ Efeitos visuais e transições profissionais',
    '📱 Interface totalmente responsiva Mobile/Web',
    '🌙 Tema dark otimizado com glassmorphism',
    '⚡ Performance otimizada com React Native Reanimated',
    '💾 Auto-save e recuperação de projeto',
    '📤 Export em alta qualidade 4K',
  ],
  date: 'Nov 2024',
};

export function UpdatePopup() {
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (dismissed) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => setDismissed(true)}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          {/* Header com gradiente */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.iconWrapper}>
                <Ionicons name="sparkles" size={24} color={palette.accent} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>{UPDATE_INFO.title}</Text>
                <Text style={styles.version}>v{UPDATE_INFO.version}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => setDismissed(true)}
              style={styles.closeButton}
              hitSlop={12}>
              <Ionicons name="close" size={22} color={palette.textMuted} />
            </Pressable>
          </View>

          {/* Conteúdo */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}>
            <Text style={styles.subtitle}>O que há de novo</Text>
            
            {UPDATE_INFO.changes.map((change, index) => (
              <View key={index} style={styles.changeItem}>
                <View style={styles.changeDot} />
                <Text style={styles.changeText}>{change}</Text>
              </View>
            ))}

            <View style={styles.dateContainer}>
              <Text style={styles.date}>Atualizado em {UPDATE_INFO.date}</Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              onPress={() => setDismissed(true)}
              style={styles.ctaButton}>
              <Text style={styles.ctaText}>Explorar Editor</Text>
              <Ionicons name="arrow-forward" size={16} color={palette.accentInk} />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: palette.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: palette.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.5,
      shadowRadius: 40,
      elevation: 20,
    },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    backgroundColor: palette.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    gap: 2,
  },
  title: {
    ...typography.h2,
    color: palette.textPrimary,
  },
  version: {
    ...typography.caption,
    color: palette.accent,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    maxHeight: 400,
  },
  contentContainer: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  subtitle: {
    ...typography.h3,
    color: palette.textPrimary,
    marginBottom: spacing.sm,
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  changeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.accent,
    marginTop: 7,
  },
  changeText: {
    ...typography.body,
    color: palette.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  dateContainer: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    marginTop: spacing.sm,
  },
  date: {
    ...typography.caption,
    color: palette.textMuted,
  },
  footer: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.surfaceAlt,
  },
  ctaButton: {
    backgroundColor: palette.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
  },
  ctaText: {
    ...typography.body,
    color: palette.accentInk,
    fontWeight: '700',
  },
});
