import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { glassmorphism, colors, spacing, fontSize, fontFamily, borderRadius } from '../theme';

interface GlassModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const GlassModal: React.FC<GlassModalProps> = ({ visible, onClose, title, children }) => {
  const { height } = useWindowDimensions();
  const maxContentHeight = height * 0.75;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={styles.avoidingView}
          keyboardVerticalOffset={Platform.OS === 'android' ? -100 : 0}
        >
          <Pressable style={[glassmorphism.modal, styles.container]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.titleBar}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: maxContentHeight }}
            >
              {children}
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  avoidingView: {
    width: '100%',
    alignItems: 'center',
  },
  container: {
    width: '100%',
  },
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.title,
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: fontSize.subtitle,
    color: colors.text.secondary,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
});

export default GlassModal;
