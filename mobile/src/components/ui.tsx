import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  TextInputProps,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
export const colors = {
  bg: '#090C10',
  card: '#14191F',
  line: '#2B3239',
  muted: '#919AA6',
  lime: '#C7FF43',
  white: '#F4F6F8',
};
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  loading = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        (disabled || loading) && { opacity: 0.45 },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.white : colors.bg} />
      ) : (
        <>
          <Text style={[s.buttonText, secondary && { color: colors.white }]}>{title}</Text>
          {icon && <Ionicons name={icon} size={20} color={secondary ? colors.white : colors.bg} />}
        </>
      )}
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ flex: 1, gap: 8 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#727E8B"
        selectionColor={colors.lime}
        {...props}
        style={[s.input, props.style]}
      />
    </View>
  );
}
export function Tag({ children }: { children: React.ReactNode }) {
  return <Text style={s.tag}>{children}</Text>;
}
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, gap: 22, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: {
    fontFamily: 'BarlowCondensed_800ExtraBold',
    fontSize: 48,
    lineHeight: 49,
    color: colors.white,
    textTransform: 'uppercase',
  },
  body: { fontSize: 15, lineHeight: 23, color: colors.muted },
  label: {
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
  },
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  button: {
    minHeight: 56,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  buttonText: { fontSize: 15, fontWeight: '800', color: colors.bg },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    color: colors.white,
    fontSize: 16,
    minHeight: 54,
  },
  tag: { color: colors.lime, fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  error: {
    backgroundColor: '#351E20',
    padding: 14,
    borderRadius: 12,
    color: '#FFC7C7',
    lineHeight: 21,
  },
  link: { color: colors.lime, fontWeight: '700', paddingVertical: 8 },
});
