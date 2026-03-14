import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { signInWithSpotify, signOut } from '@/lib/auth';

export default function HomeScreen() {
  const { isAuthenticated, loading, user } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSpotifySignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithSpotify();
    } catch (error) {
      console.error('Spotify sign in error:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </ThemedView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.authContainer}>
        {isAuthenticated ? (
          <>
            <ThemedText type="subtitle">
              Signed in as {user?.email ?? 'User'}
            </ThemedText>
            <Pressable style={styles.signOutButton} onPress={handleSignOut}>
              <ThemedText style={styles.signOutButtonText}>Sign Out</ThemedText>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={[styles.spotifyButton, isSigningIn && styles.spotifyButtonDisabled]}
            onPress={handleSpotifySignIn}
            disabled={isSigningIn}
          >
            {isSigningIn ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.spotifyButtonText}>
                Sign in with Spotify
              </ThemedText>
            )}
          </Pressable>
        )}
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authContainer: {
    gap: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  spotifyButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 50,
    minWidth: 220,
    alignItems: 'center',
  },
  spotifyButtonDisabled: {
    opacity: 0.7,
  },
  spotifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 50,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
