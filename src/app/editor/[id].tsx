import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/bottom-sheet';
import { TemplateVideo } from '@/components/video-hero';
import { Badge, Button, EmptyState, Screen, TextMuted } from '@/components/ui';
import { palette, radius, spacing, typography } from '@/constants/theme';
import { getTemplate, queryExportTask, submitExportTask } from '@/lib/api';
import { formatDuration } from '@/lib/format';
import type { ExportTask, Template } from '@/lib/types';

const TOOLS = [
  { key: 'trim', icon: 'cut-outline', label: 'Cortar' },
  { key: 'text', icon: 'text-outline', label: 'Texto' },
  { key: 'audio', icon: 'musical-notes-outline', label: 'Áudio' },
  { key: 'effects', icon: 'color-wand-outline', label: 'Efeitos' },
  { key: 'captions', icon: 'chatbox-ellipses-outline', label: 'Legendas' },
  { key: 'adjust', icon: 'options-outline', label: 'Ajustar' },
] as const;

export default function EditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [template, setTemplate] = useState<Template | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<ExportTask | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string>('trim');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const found = await getTemplate(String(id));
        if (alive) setTemplate(found);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Falha ao abrir o projeto');
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const segments = useMemo(() => {
    if (!template) return [];
    const count = Math.max(1, Math.min(template.segmentAmount, 20));
    return Array.from({ length: count }, (_, index) => ({
      key: `${template.templateId}-${index}`,
      // Larguras irregulares para parecer uma timeline real.
      width: 34 + ((index * 37) % 46),
    }));
  }, [template]);

  const startExport = async () => {
    if (!template) return;
    setExportOpen(true);
    const created = await submitExportTask(template);
    setTask(created);

    if (pollRef.current) clearInterval(pollRef.current);
    let interval = 550;
    pollRef.current = setInterval(async () => {
      try {
        const next = await queryExportTask(created.taskId);
        setTask(next);
        if (next.state === 'success' || next.state === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
        } else {
          interval = Math.min(2000, interval + 150);
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = setInterval(async () => {}, interval);
          }
        }
      } catch {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 550);
  };

  if (error) {
    return (
      <Screen>
        <Header onClose={() => router.back()} />
        <EmptyState
          icon="alert-circle-outline"
          title="Projeto indisponível"
          description={error}
          action={<Button label="Voltar" variant="secondary" onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  if (!template) {
    return (
      <Screen>
        <Header onClose={() => router.back()} />
        <View style={styles.loading}>
          <ActivityIndicator color={palette.accent} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header onClose={() => router.back()} onExport={startExport} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.previewWrap}>
          <TemplateVideo
            uri={template.videoUrl}
            poster={template.coverUrl}
            style={styles.preview}
          />
          <View style={styles.previewMeta}>
            <Badge label={template.videoRatio} tone="dark" icon="phone-portrait-outline" />
            <Badge label={`${template.segmentAmount} clipes`} tone="dark" icon="layers-outline" />
          </View>
        </View>

        <View style={styles.transport}>
          <Ionicons name="play-skip-back" size={18} color={palette.textDim} />
          <View style={styles.playButton}>
            <Ionicons name="play" size={20} color={palette.accentInk} />
          </View>
          <Ionicons name="play-skip-forward" size={18} color={palette.textDim} />
          <Text style={styles.time}>00:00 / {formatDuration(template.templateDuration)}</Text>
        </View>

        <View style={styles.timelineHeader}>
          <Text style={styles.timelineTitle}>Timeline</Text>
          <TextMuted style={styles.timelineHint}>1 faixa · {segments.length} segmentos</TextMuted>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeline}>
          {segments.map((segment, index) => (
            <View
              key={segment.key}
              style={[
                styles.segment,
                { width: segment.width },
                index === 0 && styles.segmentActive,
              ]}>
              <Text style={styles.segmentIndex}>{index + 1}</Text>
            </View>
          ))}
          <View style={styles.playhead} />
        </ScrollView>

        <View style={styles.tools}>
          {TOOLS.map((tool) => {
            const active = tool.key === activeTool;
            return (
              <Pressable
                key={tool.key}
                onPress={() => setActiveTool(tool.key)}
                style={[styles.tool, active && styles.toolActive]}>
                <Ionicons
                  name={tool.icon}
                  size={20}
                  color={active ? palette.accent : palette.textDim}
                />
                <Text style={[styles.toolLabel, active && { color: palette.accent }]}>
                  {tool.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={17} color={palette.textMuted} />
          <TextMuted style={styles.infoText}>
            Editor de demonstração. O export usa o mesmo contrato assíncrono do app original:
            <Text style={{ color: palette.accent }}> common_task/new</Text> → polling em
            <Text style={{ color: palette.accent }}> common_task/query</Text>.
          </TextMuted>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button label="Exportar" icon="download-outline" onPress={startExport} style={{ flex: 1 }} />
      </View>

      <BottomSheet visible={exportOpen} onClose={() => setExportOpen(false)} title="Exportando">
        <TextMuted style={styles.sheetText}>
          {task?.state === 'success'
            ? 'Render concluído. Em um app real, o arquivo viria do CDN de vídeo.'
            : task?.state === 'processing'
              ? 'Processando clipes, efeitos e áudio…'
              : 'Na fila de render…'}
        </TextMuted>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${task?.progress ?? 0}%` }]} />
        </View>

        <View style={styles.progressRow}>
          <TextMuted style={styles.progressLabel}>
            {task ? `${Math.round(task.progress)}%` : '0%'}
          </TextMuted>
          <TextMuted style={styles.progressLabel}>
            {task?.state === 'success' ? 'concluído' : task?.state ?? 'enviando'}
          </TextMuted>
        </View>

        <TextMuted style={styles.taskId}>task_id: {task?.taskId ?? '—'}</TextMuted>

        {task?.state === 'success' ? (
          <Button label="Concluir" onPress={() => setExportOpen(false)} />
        ) : (
          <Button label="Cancelar" variant="secondary" onPress={() => setExportOpen(false)} />
        )}
      </BottomSheet>
    </Screen>
  );
}

function Header({ onClose, onExport }: { onClose: () => void; onExport?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <Pressable onPress={onClose} style={styles.roundButton} hitSlop={8}>
        <Ionicons name="close" size={20} color={palette.text} />
      </Pressable>
      <View style={styles.headerTitle}>
        <Text style={styles.headerLabel}>Editar</Text>
        <TextMuted style={styles.headerSub}>projeto local</TextMuted>
      </View>
      {onExport ? (
        <Pressable onPress={onExport} style={styles.exportButton}>
          <Text style={styles.exportLabel}>Exportar</Text>
        </Pressable>
      ) : (
        <View style={{ width: 38 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  roundButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    alignItems: 'center',
  },
  headerLabel: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 10,
  },
  exportButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: palette.accent,
  },
  exportLabel: {
    color: palette.accentInk,
    fontSize: 13,
    fontWeight: '800',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 120,
  },
  previewWrap: {
    alignSelf: 'center',
    width: '46%',
    aspectRatio: 9 / 16,
    marginTop: spacing.sm,
  },
  preview: {
    flex: 1,
  },
  previewMeta: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    gap: 5,
  },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  playButton: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    color: palette.textMuted,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    marginLeft: spacing.sm,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  timelineTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
  },
  timelineHint: {
    fontSize: 11,
  },
  timeline: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 3,
    alignItems: 'center',
  },
  segment: {
    height: 54,
    borderRadius: radius.sm,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    borderColor: palette.accent,
    backgroundColor: palette.accentSoft,
  },
  segmentIndex: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  playhead: {
    width: 2,
    height: 66,
    borderRadius: 1,
    backgroundColor: palette.accent,
    marginLeft: -1,
  },
  tools: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  tool: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  toolActive: {
    borderColor: palette.accent,
    backgroundColor: palette.accentSoft,
  },
  toolLabel: {
    color: palette.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: palette.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
  sheetText: {
    lineHeight: 20,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.surfaceAlt,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: palette.accent,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11,
  },
  taskId: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
});
