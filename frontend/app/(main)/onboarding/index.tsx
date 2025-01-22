import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.7:5000';

type PreferenceOption = {
  id: string;
  label: string;
  value: string;
};

const steps = [
  {
    title: 'What kind of places do you love to explore?',
    options: [
      { id: '1', label: '🌆 City Life', value: 'city' },
      { id: '2', label: '🏖️ Beach Vibes', value: 'beach' },
      { id: '3', label: '⛰️ Mountain Adventures', value: 'mountains' },
      { id: '4', label: '🌳 Countryside Escapes', value: 'countryside' },
    ],
    key: 'locationPreference',
  },
  {
    title: 'What\'s your food style?',
    options: [
      { id: '1', label: '🍜 Local Cuisine', value: 'local' },
      { id: '2', label: '🌍 International Flavors', value: 'international' },
      { id: '3', label: '🥗 Vegetarian', value: 'vegetarian' },
      { id: '4', label: '🦐 Seafood', value: 'seafood' },
    ],
    key: 'foodPreference',
  },
  {
    title: 'What\'s your travel budget?',
    options: [
      { id: '1', label: '💰 Budget-Friendly', value: 'budget' },
      { id: '2', label: '💰💰 Moderate', value: 'moderate' },
      { id: '3', label: '💰💰💰 Luxury', value: 'luxury' },
      { id: '4', label: '🌟 All Ranges', value: 'all' },
    ],
    key: 'budgetRange',
  },
];

type Preferences = {
  locationPreference: string;
  foodPreference: string;
  budgetRange: string;
};

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<Preferences>({
    locationPreference: '',
    foodPreference: '',
    budgetRange: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkExistingPreferences();
  }, []);

  const checkExistingPreferences = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/preferences/preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log('Checking preferences result:', result);
      
      if (response.ok && result.data) {
        router.replace('/screens/VenueMapScreen');
      }
    } catch (error) {
      console.error('Error checking preferences:', error);
      setError('Failed to check preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (option: PreferenceOption) => {
    setError(''); // Clear any previous errors
    const currentKey = steps[currentStep].key;
    
    const newPreferences = {
      ...preferences,
      [currentKey as keyof Preferences]: option.value,
    };
    setPreferences(newPreferences);

    // If we're not on the last step, move to next step
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Check if all preferences are filled before submitting
      const allPreferencesFilled = ['locationPreference', 'foodPreference', 'budgetRange']
        .every(key => newPreferences[key as keyof Preferences] !== '');
      
      if (allPreferencesFilled) {
        submitPreferences();
      } else {
        setError('Please fill out all preferences before submitting');
      }
    }
  };

  const submitPreferences = async () => {
    // Validate all preferences are filled
    const allPreferencesFilled = ['locationPreference', 'foodPreference', 'budgetRange']
      .every(key => preferences[key as keyof Preferences] !== '');
    
    if (!allPreferencesFilled) {
      setError('Please fill out all preferences before submitting');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }

      console.log('Submitting preferences:', preferences);
      
      const response = await fetch(`${API_URL}/api/preferences/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      const result = await response.json();
      console.log('API Response:', result);

      if (response.ok) {
        router.replace('/screens/VenueMapScreen');
      } else {
        setError(result.error || 'Failed to save preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Checking preferences...</Text>
      </View>
    );
  }

  const currentStepData = steps[currentStep];

  return (
    <View style={styles.container}>
      <Text style={styles.stepIndicator}>Step {currentStep + 1} of {steps.length}</Text>
      <Text style={styles.title}>{currentStepData.title}</Text>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.optionsContainer}>
        {currentStepData.options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.option,
              preferences[currentStepData.key as keyof Preferences] === option.value && styles.selectedOption
            ]}
            onPress={() => handleSelect(option)}
            disabled={submitting}
          >
            <Text style={[
              styles.optionText,
              preferences[currentStepData.key as keyof Preferences] === option.value && styles.selectedOptionText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {submitting && (
        <View style={styles.submittingContainer}>
          <ActivityIndicator size="small" color="#2196f3" />
          <Text style={styles.submittingText}>Saving your preferences...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  stepIndicator: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  optionsContainer: {
    gap: 16,
  },
  option: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  optionText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
  },
  selectedOptionText: {
    color: '#2196f3',
    fontWeight: 'bold',
  },
  error: {
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  submittingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 10,
  },
  submittingText: {
    color: '#666',
    fontSize: 16,
  },
});