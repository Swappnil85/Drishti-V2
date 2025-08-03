/**
 * Form Template Component
 * Reusable form layout with submit/cancel actions
 */

import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { FormTemplateProps } from '../../types/components';
import { Text, Button, Flex, Container } from '../ui';

const FormTemplate: React.FC<FormTemplateProps> = ({
  children,
  title,
  subtitle,
  onSubmit,
  submitText = 'Submit',
  submitDisabled = false,
  submitLoading = false,
  showCancelButton = false,
  onCancel,
  cancelText = 'Cancel',
  scrollable = true,
  validateOnChange = false,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const theme = useTheme();

  const containerStyles = [
    styles.container,
    style,
  ];

  // Render form header
  const renderHeader = () => {
    if (!title && !subtitle) return null;

    return (
      <View style={styles.header}>
        {title && (
          <Text
            variant="h4"
            weight="bold"
            color="text.primary"
            style={styles.title}
          >
            {title}
          </Text>
        )}
        
        {subtitle && (
          <Text
            variant="body2"
            color="text.secondary"
            style={styles.subtitle}
          >
            {subtitle}
          </Text>
        )}
      </View>
    );
  };

  // Render form actions
  const renderActions = () => {
    if (!onSubmit && !onCancel) return null;

    return (
      <View style={styles.actions}>
        <Flex direction="row" gap="sm" justify="flex-end">
          {showCancelButton && onCancel && (
            <Button
              variant="outline"
              size="md"
              onPress={onCancel}
              disabled={submitLoading}
              testID={`${testID}-cancel`}
              style={styles.cancelButton}
            >
              {cancelText}
            </Button>
          )}
          
          {onSubmit && (
            <Button
              variant="primary"
              size="md"
              onPress={onSubmit}
              disabled={submitDisabled}
              loading={submitLoading}
              testID={`${testID}-submit`}
              style={styles.submitButton}
            >
              {submitText}
            </Button>
          )}
        </Flex>
      </View>
    );
  };

  // Render form content
  const renderContent = () => (
    <Container style={styles.content}>
      {renderHeader()}
      
      <View style={styles.fields}>
        {children}
      </View>
      
      {renderActions()}
    </Container>
  );

  // Render with keyboard avoiding view and optional scroll
  return (
    <KeyboardAvoidingView
      style={containerStyles}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderContent()}
        </ScrollView>
      ) : (
        renderContent()
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 22,
  },
  fields: {
    flex: 1,
  },
  actions: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default FormTemplate;
