import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Ops' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Rota não encontrada</Text>
        <Text style={styles.text}>
          Deep links válidos: <Text style={styles.code}>clipflow://template/&lt;id&gt;</Text> e{' '}
          <Text style={styles.code}>clipflow://editor/&lt;id&gt;</Text>
        </Text>
        <Link href="/" style={styles.link}>
          Voltar para o feed
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: palette.bg,
  },
  title: {
    ...typography.title,
    color: palette.text,
  },
  text: {
    color: palette.textDim,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  code: {
    color: palette.accent,
    fontFamily: 'monospace',
  },
  link: {
    marginTop: spacing.md,
    color: palette.accent,
    fontWeight: '700',
    fontSize: 15,
  },
});
