import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ScrollView } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

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
        { id: 'cafe', label: 'Cafes', icon: '☕' },
        { id: 'entertainment', label: 'Garden', icon: '🌳' },
        { id: 'culture', label: 'Culture', icon: '🏢' },
        { id: 'services', label: 'Services', icon: '🥼' },
        { id: 'restaurant', label: 'Restaurants', icon: '🍽️' },
        { id: 'other', label: 'Others', icon: '🔹' }
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
                `http://192.168.1.7:5000/api/venues/nearby?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}`
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
            case 'shopping':
                return '🛍️';
            case 'entertainment':
                return '🌳';
            case 'sports':
                return '🏃';
            case 'cafe':
                return '☕';
            case 'nightlife':
                return '🌙';
            case 'culture':
                return '🏢';
            case 'services':
                return '🥼';
            default:
                return '🔹'; 
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
                                <View style={[styles.markerContainer, focusedMarkerId === venue._id && styles.focusedMarker]}>
                                    <Text style={[styles.markerText, { fontSize: 18 }]}>
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
                    <View style={styles.cardHeader}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.venueName}>{selectedVenue.name}</Text>
                            <Text style={styles.venueRating}>
                                {selectedVenue.rating} ★ • {selectedVenue.category} • {formatDistance(selectedVenue.distance)}
                            </Text>
                            <Text style={styles.venueStatus}>
                                Open 24 hours
                            </Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.closeButton}
                            onPress={() => setSelectedVenue(null)}
                        >
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="navigate" size={24} color={colors.primary} />
                            <Text style={styles.buttonText}>Directions</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="navigate-circle" size={24} color={colors.primary} />
                            <Text style={styles.buttonText}>Start</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="call" size={24} color={colors.primary} />
                            <Text style={styles.buttonText}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="share" size={24} color={colors.primary} />
                            <Text style={styles.buttonText}>Share</Text>
                        </TouchableOpacity>
                    </View>
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
        width: '100%',
        height: '100%',
    },
    markerContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    currentLocationMarker: {
        borderColor: '#2196F3',  // Blue border for current location
        borderWidth: 2,
    },
    focusedMarker: {
        backgroundColor: '#e3f2fd',  // Light blue background
        borderColor: '#1976d2',      // Blue border
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.35,
        shadowRadius: 5.84,
        elevation: 8,
    },
    markerText: {
        fontSize: 24,
    },
    venueCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -3,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
        ...Platform.select({
            ios: {
                backdropFilter: 'blur(10px)',
            },
            android: {
                // Android doesn't support backdropFilter
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
            },
        }),
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    headerLeft: {
        flex: 1,
    },
    venueName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#1a1a1a',
    },
    venueRating: {
        fontSize: 15,
        color: '#666',
        marginBottom: 4,
    },
    venueStatus: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
    },
    closeButton: {
        padding: 8,
        marginTop: -4,
        marginRight: -4,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        paddingBottom: 4,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },
    actionButton: {
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(25, 118, 210, 0.08)',
        minWidth: 72,
    },
    buttonText: {
        marginTop: 6,
        fontSize: 13,
        fontWeight: '500',
        color: '#1976d2',
    },
    themeToggle: {  
        position: 'absolute',
        top: 120,
        right: 10,
        backgroundColor: 'gray',
        borderRadius: 20,
        padding: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    filterContainer: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        zIndex: 1,
        backgroundColor: 'transparent',
    },
    filterContent: {
        paddingHorizontal: 10,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    filterButtonActive: {
        backgroundColor: '#1976d2',
    },
    filterIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    filterText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    filterTextActive: {
        color: 'white',
    },
});

export default VenueMapScreen;