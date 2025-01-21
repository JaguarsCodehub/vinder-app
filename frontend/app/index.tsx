import { StyleSheet, View, Image } from 'react-native';
import { Link } from 'expo-router';
import { Button } from 'react-native-paper';

export default function Home() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.buttonContainer}>
        <Link href="/(auth)/login" asChild>
          <Button 
            mode="contained" 
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Login
          </Button>
        </Link>
        <Link href="/(auth)/register" asChild>
          <Button 
            mode="outlined"
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Register
          </Button>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 50,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    width: '100%',
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
