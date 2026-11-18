import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';

import { Body, Button, Field, Screen, Title } from '@/components/ui';
import { useColors } from '@/hooks/use-colors';
import { saveJSON, WELCOMED_KEY } from '@/lib/storage';
import { useApp } from '@/state/app-state';

export default function AuthScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<'signup' | 'signin'>(params.mode === 'signin' ? 'signin' : 'signup');
  const { signUp, signIn } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === 'signup';
  const canSubmit = email.includes('@') && password.length >= (isSignup ? 8 : 1) && (!isSignup || name.trim().length > 0);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (isSignup) await signUp(name, email, password);
      else await signIn(email, password);
      await saveJSON(WELCOMED_KEY, true);
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
      // A new account that needs email confirmation isn't an error.
      if (/check your email/i.test(message)) {
        setNotice(`Almost there! We sent a confirmation link to ${email.trim()}. Tap it, then come back and sign in.`);
        setMode('signin');
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen edges={[]}>
        <Title>{isSignup ? 'Become a Builder' : 'Welcome back'}</Title>
        <Body muted>
          {isSignup
            ? 'Free forever. Follow businesses, help neighbors and see your impact grow.'
            : 'Sign in to keep building your community.'}
        </Body>
        {isSignup ? (
          <Field label="Your name" placeholder="Tanya" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
        ) : null}
        <Field
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <Field
          label="Password"
          placeholder={isSignup ? 'At least 8 characters' : ''}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          textContentType={isSignup ? 'newPassword' : 'password'}
          onSubmitEditing={submit}
          error={error}
        />
        {notice ? (
          <View style={{ backgroundColor: colors.accentSoft, borderRadius: 12, padding: 12 }}>
            <Text style={{ color: colors.text, fontSize: 15, lineHeight: 21 }}>📬 {notice}</Text>
          </View>
        ) : null}
        <Button label={isSignup ? 'Create my account' : 'Sign in'} onPress={submit} loading={busy} disabled={!canSubmit} />
        <Pressable onPress={() => { setMode(isSignup ? 'signin' : 'signup'); setError(null); }} style={{ alignSelf: 'center', padding: 8 }}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>
            {isSignup ? 'Already have an account? Sign in' : 'New here? Create an account'}
          </Text>
        </Pressable>
        {isSignup ? (
          <Body muted style={{ fontSize: 12, textAlign: 'center' }}>
            By joining you agree to treat every neighbor with respect. We never sell your information.
          </Body>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}
