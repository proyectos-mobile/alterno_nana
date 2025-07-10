import { BlurView } from 'expo-blur';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

let alertController = null;

export const CustomAlert = {
  alert: (title, message, buttons = [], type = 'info') => {
    if (alertController) {
      alertController.showAlert(title, message, buttons, type);
    }
  },
};

export default function CustomAlertProvider({ children }) {
  const { colors } = useTheme();
  const [alertData, setAlertData] = useState(null);
  const styles = createStyles(colors);

  useEffect(() => {
    alertController = {
      showAlert: (title, message, buttons, type) => {
        setAlertData({ title, message, buttons, type });
      },
    };

    return () => {
      alertController = null;
    };
  }, []);

  const hideAlert = () => {
    setAlertData(null);
  };

  const getIcon = (type) => {
    const iconProps = { size: 24 };

    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} color="#10B981" />;
      case 'error':
        return <XCircle {...iconProps} color="#EF4444" />;
      case 'warning':
        return <AlertCircle {...iconProps} color="#F59E0B" />;
      default:
        return <Info {...iconProps} color={colors.primary} />;
    }
  };

  const getIconBackgroundColor = (type) => {
    switch (type) {
      case 'success':
        return '#10B98120';
      case 'error':
        return '#EF444420';
      case 'warning':
        return '#F59E0B20';
      default:
        return `${colors.primary}20`;
    }
  };

  if (!alertData) {
    return children;
  }

  const { title, message, buttons, type } = alertData;
  const processedButtons =
    buttons.length === 0
      ? [{ text: 'OK', onPress: hideAlert }]
      : buttons.map((btn) => ({
          ...btn,
          onPress: () => {
            hideAlert();
            if (btn.onPress) btn.onPress();
          },
        }));

  return (
    <>
      {children}
      <Modal
        visible={!!alertData}
        transparent={true}
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={hideAlert}>
            <BlurView
              intensity={80}
              tint={colors.background === '#ffffff' ? 'light' : 'dark'}
              style={styles.blurView}
            />
          </Pressable>
          <View style={styles.alertContainer}>
            <View style={styles.header}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: getIconBackgroundColor(type) },
                ]}
              >
                {getIcon(type)}
              </View>
              <Text style={styles.title}>{title}</Text>
            </View>

            {message && <Text style={styles.message}>{message}</Text>}

            <View style={styles.buttonContainer}>
              {processedButtons.map((button, index) => (
                <TouchableOpacity
                  key={`${button.text}-${index}`}
                  style={[
                    styles.button,
                    button.style === 'destructive' && styles.destructiveButton,
                    button.style === 'cancel' && styles.cancelButton,
                    processedButtons.length === 1 && styles.singleButton,
                    index === 0 &&
                      processedButtons.length > 1 &&
                      styles.firstButton,
                    index === processedButtons.length - 1 &&
                      processedButtons.length > 1 &&
                      styles.lastButton,
                  ]}
                  onPress={button.onPress}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === 'destructive' &&
                        styles.destructiveButtonText,
                      button.style === 'cancel' && styles.cancelButtonText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    blurView: {
      flex: 1,
    },
    alertContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      minWidth: 280,
      maxWidth: '90%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    header: {
      alignItems: 'center',
      marginBottom: 16,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
    },
    singleButton: {
      backgroundColor: colors.primary,
    },
    firstButton: {
      backgroundColor: colors.border,
    },
    lastButton: {
      backgroundColor: colors.primary,
    },
    cancelButton: {
      backgroundColor: colors.border,
    },
    destructiveButton: {
      backgroundColor: '#EF4444',
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
    },
    destructiveButtonText: {
      color: '#ffffff',
    },
  });
