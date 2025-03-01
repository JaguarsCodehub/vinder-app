import { StyleSheet, View, Image, Text } from 'react-native';
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
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Welcome to Venue Map
      </Text>
      <Text style={{ fontSize: 16, marginBottom: 20 }}>
        Discover venues near you and share your experiences with others
      </Text>
      <View style={styles.buttonContainer}>
        <Link href="/(auth)/login" asChild>
          <Button 
            mode="contained" 
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            <Text style={{ fontSize: 16, color: "#94ff98", fontWeight: 'bold' }}>Login to your Vinder App</Text>
          </Button>
        </Link>
        <Link href="/(auth)/register" asChild>
          <Button 
            mode="outlined"
            style={styles.secondaryButton}
            contentStyle={styles.buttonContent}
          >
            <Text style={{ fontSize: 16, color: "gray", fontWeight: 'bold' }}>Register here for new users</Text>
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
    marginTop: 20,
  },
  button: {
    fontSize: 17,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 17,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#1a891e',
    borderBottomWidth: 6, // Simulate the bottom border thickness
    shadowColor: 'rgb(158, 129, 254)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  secondaryButton: {
    fontSize: 17,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 17,
    backgroundColor: 'lightgray',
    borderWidth: 2,
    borderColor: '#8c8c8c',
    borderBottomWidth: 6, // Simulate the bottom border thickness
    shadowColor: 'rgb(158, 129, 254)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonContent: {
    // paddingVertical: 8,
  },
});
