import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ScrollView } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import VenueCard from '../../components/VenueCard';

interface Venue {
    _id: string;
    name: string;
    description: string;
    location: {
        type: string;
        coordinates: number[];
    };
    category: string;
    rating?: string;
    priceRange?: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
    };
    distance?: number;
}

const VenueMapScreen: React.FC = () => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
    const [focusedMarkerId, setFocusedMarkerId] = useState(null);
    const [mapTheme, setMapTheme] = useState('standard'); // Default theme
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const { colors } = useTheme();

    const categories = [
        { id: 'all', label: 'All', icon: '🔍' },
        { id: 'restaurant', label: 'Restaurants', icon: '🍽️' },
        { id: 'cafe', label: 'Cafes', icon: '☕' },
        { id: 'entertainment', label: 'Entertainment', icon: '🎭' },
        { id: 'shopping', label: 'Shopping', icon: '🛍️' },
        { id: 'sports', label: 'Sports', icon: '🏃' },
        { id: 'park', label: 'Parks', icon: '🌳' },
        { id: 'movie_theater', label: 'Movies', icon: '🎬' },
        { id: 'arcade', label: 'Arcade', icon: '🎮' },
        { id: 'services', label: 'Services', icon: '🛠️' },
        { id: 'education', label: 'Education', icon: '📚' },
        { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
        { id: 'fitness', label: 'Fitness', icon: '💪' },
        { id: 'beauty', label: 'Beauty', icon: '💅' },
        { id: 'hotel', label: 'Hotels', icon: '🏨' },
        { id: 'other', label: 'Others', icon: '📍' }
    ];

    const filteredVenues = selectedCategory === 'all' || !selectedCategory
        ? venues
        : venues.filter(venue => venue.category === selectedCategory);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
            fetchVenues(location);
        })();
    }, []);

    const fetchVenues = async (location: Location.LocationObject) => {
        try {
            const response = await fetch(
                `http://192.168.1.5:5000/api/venues/nearby?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}`
            );
            const data = await response.json();
            console.log('Found', data.length, 'venues');
            setVenues(data);
        } catch (error) {
            console.error('Error fetching venues:', error);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'restaurant':
                return '🍽️';
            case 'cafe':
                return '☕';
            case 'entertainment':
                return '🎭';
            case 'shopping':
                return '🛍️';
            case 'sports':
                return '🏃';
            case 'park':
                return '🌳';
            case 'movie_theater':
                return '🎬';
            case 'arcade':
                return '🎮';
            case 'services':
                return '🛠️';
            case 'education':
                return '📚';
            case 'healthcare':
                return '🏥';
            case 'fitness':
                return '💪';
            case 'beauty':
                return '💅';
            case 'hotel':
                return '🏨';
            default:
                return '📍';
        }
    };

    const formatDistance = (meters?: number) => {
        if (!meters) return '';
        if (meters < 1000) return `${Math.round(meters)}m`;
        return `${(meters / 1000).toFixed(1)}km`;
    };

    const toggleMapTheme = () => {
        setMapTheme(prevTheme => (prevTheme === 'dark' ? 'standard' : 'dark'));
    };

    if (errorMsg) {
        return (
            <View style={styles.container}>
                <Text>{errorMsg}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {location && (
                <View style={{ flex: 1 }}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.filterContainer}
                        contentContainerStyle={styles.filterContent}
                    >
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                style={[
                                    styles.filterButton,
                                    selectedCategory === category.id && styles.filterButtonActive
                                ]}
                                onPress={() => setSelectedCategory(category.id)}
                            >
                                <Text style={styles.filterIcon}>{category.icon}</Text>
                                <Text style={[
                                    styles.filterText,
                                    selectedCategory === category.id && styles.filterTextActive
                                ]}>
                                    {category.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        customMapStyle={mapTheme === 'dark' ? darkMapStyle : standardMapStyle} // Apply the selected theme
                        initialRegion={{
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                            latitudeDelta: 0.3,
                            longitudeDelta: 0.3,
                        }}
                    >
                        {/* Current Location Marker */}
                        <Marker
                            coordinate={{
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude,
                            }}
                        >
                            <View style={[styles.markerContainer, styles.currentLocationMarker]}>
                                <Text style={styles.markerText}>🏠</Text>
                            </View>
                        </Marker>

                        {/* Venue Markers */}
                        {filteredVenues.map((venue) => (
                            <Marker
                                key={venue._id}
                                coordinate={{
                                    latitude: venue.location.coordinates[1],
                                    longitude: venue.location.coordinates[0],
                                }}
                                onPress={() => {
                                    setSelectedVenue(venue);
                                    setFocusedMarkerId(venue._id);
                                }}
                            >
                                <View style={[styles.markerContainer, focusedMarkerId === venue._id && styles.selectedMarker]}>
                                    <Text style={[styles.markerText, { fontSize: 16 }]}>
                                        {getCategoryIcon(venue.category)}
                                    </Text>
                                </View>
                            </Marker>
                        ))}
                    </MapView>
                    <TouchableOpacity 
                        style={styles.themeToggle}
                        onPress={toggleMapTheme}
                    >
                        <Ionicons 
                            name={mapTheme === 'dark' ? 'sunny' : 'moon'} 
                            size={20} 
                            color={mapTheme === 'dark' ? '#fff3b5' : '#77b2ff'} 
                        />
                    </TouchableOpacity>
                </View>
            )}

            {selectedVenue && (
                <View style={styles.venueCard}>
                    <VenueCard
                        venue={{
                            ...selectedVenue,
                            images: [], // Add venue images when available
                            rating: parseFloat(selectedVenue.rating || '0'),
                            priceRange: selectedVenue.priceRange || 'Not specified',
                            category: selectedVenue.category || 'Not specified',
                        }}
                        onNavigate={() => {
                            // Add navigation logic
                            console.log('Navigate to:', selectedVenue.name);
                        }}
                        onShare={() => {
                            // Add share logic
                            console.log('Share venue:', selectedVenue.name);
                        }}
                        onFavorite={() => {
                            // Add favorite logic
                            console.log('Favorite venue:', selectedVenue.name);
                        }}
                    />
                    <TouchableOpacity 
                        style={styles.closeButton}
                        onPress={() => setSelectedVenue(null)}
                    >
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const darkMapStyle = [
    {
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#242f3e"
            }
        ]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#746855"
            }
        ]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "color": "#242f3e"
            }
        ]
    },
    {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#d59563"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#d59563"
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#263c3f"
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#6b9a76"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#38414e"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#212a37"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#9ca5b3"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#746855"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#1f2835"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#f3d19c"
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#2f3948"
            }
        ]
    },
    {
        "featureType": "transit.station",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#d59563"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#17263c"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#515c6d"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "color": "#17263c"
            }
        ]
    }
];

const standardMapStyle: [] = [];

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    venueCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        padding: 8,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 4,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    markerContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 3,
        borderWidth: 1.5,
        borderColor: '#4CAF50',
    },
    selectedMarker: {
        borderColor: '#2196F3',
        backgroundColor: '#E3F2FD',
    },
    currentLocationMarker: {
        borderColor: '#F44336',
    },
    markerText: {
        fontSize: 16,
    },
    filterContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 0,
        right: 0,
        zIndex: 1,
    },
    filterContent: {
        paddingHorizontal: 16,
    },
    filterButton: {
        backgroundColor: 'white',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    filterButtonActive: {
        backgroundColor: '#4CAF50',
    },
    filterIcon: {
        marginRight: 4,
        fontSize: 16,
    },
    filterText: {
        color: '#333',
        fontSize: 14,
    },
    filterTextActive: {
        color: 'white',
    },
    themeToggle: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 120 : 100,
        right: 16,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
});

export default VenueMapScreen;