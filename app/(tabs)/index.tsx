import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import { useAuth } from '@/hooks/use-auth';
import { signInWithSpotify, signOut } from '@/lib/auth';

export default function WelcomeScreen() {
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
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 px-10 justify-center items-center">
          <View className="items-center mb-16">
            <Animated.Text
              entering={FadeInDown.delay(100).duration(400)}
              className="text-5xl font-black tracking-tight mb-3 text-white"
            >
              Remixer
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(200).duration(400)}
              className="text-base leading-6 text-neutral-400 text-center max-w-[280px]"
            >
              Mix your music. Remix your vibe.
            </Animated.Text>
          </View>

          {isAuthenticated ? (
            <Animated.View
              entering={FadeInUp.delay(300).duration(400)}
              className="items-center gap-5"
            >
              <Text className="text-lg font-semibold text-white">
                Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
              </Text>
              <Pressable
                className="py-3 px-8 rounded-full bg-surface-elevated border border-white/10 active:opacity-80"
                onPress={handleSignOut}
              >
                <Text className="text-neutral-300 text-[15px] font-medium">
                  Sign Out
                </Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeInUp.delay(300).duration(400)}
              className="items-center gap-6"
            >
              <Text className="text-[15px] text-neutral-500">
                Sign in with Spotify to get started
              </Text>
              <Pressable
                className={`py-4 px-12 rounded-full min-w-[280px] items-center justify-center bg-brand-primary active:scale-[0.98] ${
                  isSigningIn ? 'opacity-70' : ''
                }`}
                onPress={handleSpotifySignIn}
                disabled={isSigningIn}
              >
                {isSigningIn ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white text-[17px] font-semibold">
                    Sign in with Spotify
                  </Text>
                )}
              </Pressable>
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
