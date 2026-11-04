import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTemplate, queryExportTask, submitExportTask } from '@/lib/api';
import { getTemplate } from '@/lib/types';

export default function EditorScreen() {{
  const { id } = useLocalSearchParams<{ id: string }>();
  const { insets } = useSafeAreaInsets();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<any>(null);

  // Carregar template
  useEffect(() => {{
    const load = async () => {{
      try {{
        const tmpl = await getTemplate(String(id));
        setContent(tmpl.content || '');
      }} catch (e) {{
        setError(e instanceof Error ? e.message : 'Erro ao carregar');
      }}
    }}};

    load();
  }, [id]);

  const save = async () => {{
    try {{
      await submitExportTask({{ 
        templateId: document.getElementById('template-id')?.textContent || '',
        content: content,
        taskId: document.getElementById('task-id')?.textContent || ''
      }});

      alert('Salvo com sucesso!');
    }} catch (e) {{
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    }}
  };