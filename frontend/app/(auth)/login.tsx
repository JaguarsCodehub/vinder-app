import { useState, useEffect } from 'react';
import { StyleSheet, View, Animated, Keyboard, Platform, Image } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { Link, router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      Keyboard.dismiss();

      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      if (response.data && response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        const userPrefs = await AsyncStorage.getItem('userPreferences');
        
        if (userPrefs) {
          router.replace('/screens/VenueMapScreen');
        } else {
          router.replace('/(main)/onboarding');
        }
      } else {
        setError('Invalid response from server');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>  
      <Image
        source={require('@/assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}

      <TextInput
        style={styles.input}
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        disabled={loading}
        mode="outlined"
        outlineColor="#4CAF50"
        activeOutlineColor="#1a891e"
        theme={{ colors: { primary: '#4CAF50' } }}
        left={<TextInput.Icon icon={() => <Ionicons icon="mail" size={20} color="#4CAF50" />} />}
        onFocus={() => {
          Animated.timing(fadeAnim, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }}
        onBlur={() => {
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }}
      />

      <TextInput
        style={styles.input}
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        disabled={loading}
        mode="outlined"
        outlineColor="#4CAF50"
        activeOutlineColor="#1a891e"
        theme={{ colors: { primary: '#4CAF50' } }}
        left={<TextInput.Icon icon={() => <Ionicons icon="lock-closed" size={20} color="#4CAF50" />} />}
        onFocus={() => {
          Animated.timing(fadeAnim, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }}
        onBlur={() => {
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }}
      />

      <Button
        mode="contained"
        onPress={handleLogin}
        style={styles.button}
        contentStyle={styles.buttonContent}
        loading={loading}
        disabled={loading || !email || !password}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Text>
      </Button>

      <View style={styles.linkContainer}>
        <Text style={styles.linkText}>Don't have an account? </Text>
        <Link href="/register" style={styles.link}>Create one</Link>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
    borderRadius: 17,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#1a891e',
    borderBottomWidth: 6,
    shadowColor: 'rgb(158, 129, 254)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 16,
    color: "#94ff98",
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  error: {
    color: '#c62828',
    textAlign: 'center',
    fontSize: 14,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
  link: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
