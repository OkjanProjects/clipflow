import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { palette } from '@/constants/theme';

const icons = {
  index: { active: 'compass', inactive: 'compass-outline' },
  templates: { active: 'grid', inactive: 'grid-outline' },
  create: { active: 'add-circle', inactive: 'add-circle-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
} as const;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: palette.bg },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.select({ ios: 84, default: 64 }),
          paddingTop: 6,
          paddingBottom: Platform.select({ ios: 26, default: 8 }),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Descobrir',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={icons.index[focused ? 'active' : 'inactive']} size={size} color={(color ?? palette.textMuted) as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: 'Templates',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={icons.templates[focused ? 'active' : 'inactive']}
              size={size}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Criar',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={icons.create[focused ? 'active' : 'inactive']}
              size={size + 2}
              color={(focused ? palette.accent : (color ?? palette.textMuted)) as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={icons.profile[focused ? 'active' : 'inactive']}
              size={size}
              color={color as string}
            />
          ),
        }}
      />
    </Tabs>
  );
}
