import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Text, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const API_URL = 'http://192.168.1.5:5000';

interface Booking {
    _id: string;
    venue: {
        _id: string;
        name: string;
        category: string;
        priceRange: string;
    };
    date: string;
    timeSlot: {
        start: string;
        end: string;
    };
    price: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    paymentStatus: 'pending' | 'completed' | 'failed';
}

export default function MyBookingsScreen() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const fetchBookings = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                setError('Please login to view your bookings');
                return;
            }

            const response = await axios.get(`${API_URL}/api/bookings/my-bookings`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setBookings(response.data);
        } catch (err) {
            setError('Failed to fetch bookings');
            console.error('Error fetching bookings:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchBookings();
    }, []);

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'restaurant':
                return 'silverware-fork-knife';
            case 'cafe':
                return 'coffee';
            case 'entertainment':
                return 'ticket';
            case 'shopping':
                return 'shopping';
            case 'sports':
                return 'run';
            case 'park':
                return 'tree';
            case 'movie_theater':
                return 'movie';
            case 'arcade':
                return 'gamepad-variant';
            case 'services':
                return 'tools';
            case 'education':
                return 'school';
            case 'healthcare':
                return 'hospital';
            case 'fitness':
                return 'weight-lifter';
            case 'beauty':
                return 'spa';
            case 'hotel':
                return 'bed';
            default:
                return 'map-marker';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return '#4CAF50';
            case 'pending':
                return '#FFC107';
            case 'cancelled':
                return '#F44336';
            default:
                return '#757575';
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.error}>{error}</Text>
                <Button mode="contained" onPress={() => router.replace('/(auth)/login')}>
                    Login
                </Button>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {bookings.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="calendar-blank" size={64} color="#757575" />
                    <Text style={styles.emptyText}>No bookings found</Text>
                    <Button
                        mode="contained"
                        onPress={() => router.push('/(main)')}
                        style={styles.exploreButton}
                    >
                        Explore Venues
                    </Button>
                </View>
            ) : (
                bookings.map((booking) => (
                    <Card key={booking._id} style={styles.card}>
                        <Card.Content>
                            <View style={styles.header}>
                                <View style={styles.titleContainer}>
                                    <MaterialCommunityIcons
                                        name={getCategoryIcon(booking.venue.category)}
                                        size={24}
                                        color="#2196F3"
                                        style={styles.icon}
                                    />
                                    <Title>{booking.venue.name}</Title>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                                    <Text style={styles.statusText}>{booking.status}</Text>
                                </View>
                            </View>
                            <View style={styles.detailsContainer}>
                                <View style={styles.row}>
                                    <Paragraph style={styles.label}>Date:</Paragraph>
                                    <Paragraph>
                                        {new Date(booking.date).toLocaleDateString()}
                                    </Paragraph>
                                </View>
                                <View style={styles.row}>
                                    <Paragraph style={styles.label}>Time:</Paragraph>
                                    <Paragraph>
                                        {`${booking.timeSlot.start} - ${booking.timeSlot.end}`}
                                    </Paragraph>
                                </View>
                                <View style={styles.row}>
                                    <Paragraph style={styles.label}>Price:</Paragraph>
                                    <Paragraph>₹{booking.price}</Paragraph>
                                </View>
                                {/* <View style={styles.row}>
                                    <Paragraph style={styles.label}>Payment:</Paragraph>
                                    <Paragraph style={{
                                        color: booking.paymentStatus === 'completed' ? '#4CAF50' :
                                            booking.paymentStatus === 'failed' ? '#F44336' : '#FFC107'
                                    }}>
                                        {booking.paymentStatus}
                                    </Paragraph>
                                </View> */}
                            </View>
                        </Card.Content>
                        {booking.status === 'pending' && (
                            <Card.Actions>
                                <Button
                                    mode="contained"
                                    onPress={() => router.push({
                                        pathname: '/(main)/payment',
                                        params: { bookingId: booking._id }
                                    })}
                                >
                                    Complete Payment
                                </Button>
                            </Card.Actions>
                        )}
                    </Card>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    error: {
        color: '#F44336',
        marginBottom: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        fontSize: 18,
        color: '#757575',
        marginTop: 16,
        marginBottom: 24,
    },
    exploreButton: {
        marginTop: 16,
    },
    card: {
        marginBottom: 16,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    icon: {
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    detailsContainer: {
        backgroundColor: '#f8f8f8',
        padding: 12,
        borderRadius: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        fontWeight: 'bold',
        color: '#666',
    },
});
