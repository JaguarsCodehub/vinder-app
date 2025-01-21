import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4CAF50',  // Green color from the image
    primaryContainer: '#C8E6C9',
    secondary: '#8BC34A',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#333333',
    accent: '#FF5722',
  },
  roundness: 12,
};

export const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  button: {
    marginVertical: 8,
    borderRadius: 12,
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
};
