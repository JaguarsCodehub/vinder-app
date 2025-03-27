import { useEffect, useState } from 'react';
import { StyleSheet, View, Image, Animated } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { Link, router } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://192.168.1.7:5000';

const logo = require('@/assets/logo.png'); // Update the path to your logo image

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRegister = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        name,
        email,
        password,
      });

      if (response.data) {
        // Registration successful, redirect to login
        router.replace('/login');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} />
      <Text style={styles.title}>Create Account</Text>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        label="Name"
        value={name}
        onChangeText={setName}
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
        onPress={handleRegister}
        style={{
          marginTop: 10,
          backgroundColor: '#4CAF50',
          borderRadius: 10,
          padding: 10,
        }}
        labelStyle={{ color: '#fff', fontSize: 18 }}
      >
        Register
      </Button>

      <View style={styles.linkContainer}>
        <Text>Already have an account? </Text>
        <Link href="/login">Login here</Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20,
    alignSelf: 'center',
  },
});
