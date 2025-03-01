import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Title, Paragraph, ActivityIndicator, Text } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

export default function PaymentPage() {
    const { bookingId } = useLocalSearchParams();
    const router = useRouter();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchBookingDetails();
    }, []);

    const fetchBookingDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                setError('Please login to view booking details');
                return;
            }

            const response = await axios.get(
                `${API_URL}/api/bookings/${bookingId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setBooking(response.data);
            console.log('Booking details:', response.data);
        } catch (err) {
            setError('Failed to fetch booking details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                setError('Please login to complete payment');
                return;
            }

            // Here you would integrate with your payment provider (e.g., Stripe)
            // For now, we'll just update the booking status
            await axios.patch(
                `${API_URL}/api/bookings/${bookingId}/status`,
                {
                    status: 'confirmed',
                    paymentStatus: 'completed'
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            // Navigate to confirmation page
            router.replace('/(main)/booking-confirmation');
        } catch (err) {
            setError('Payment failed');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.error}>{error}</Text>
                <Button mode="contained" onPress={() => router.back()}>
                    Go Back
                </Button>
            </View>
        );
    }

    if (!booking) return null;

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>Booking Summary</Title>
                    <View style={styles.detailsContainer}>
                        <View style={styles.row}>
                            <Paragraph style={styles.label}>Venue:</Paragraph>
                            <Paragraph>{booking.venue.name}</Paragraph>
                        </View>
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
                    </View>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Title>Payment Method</Title>
                    {/* Add payment method selection/input here */}
                    <Paragraph>Payment integration to be implemented</Paragraph>
                </Card.Content>
            </Card>

            <View style={styles.footer}>
                <Button
                    mode="outlined"
                    onPress={() => router.back()}
                    style={styles.button}
                >
                    Cancel
                </Button>
                <Button
                    mode="contained"
                    onPress={handlePayment}
                    style={styles.button}
                    loading={loading}
                >
                    Pay ${booking.price}
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    card: {
        margin: 16,
    },
    detailsContainer: {
        marginTop: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 4,
    },
    label: {
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        margin: 16,
    },
    button: {
        flex: 1,
        marginHorizontal: 4,
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginVertical: 16,
    },
});
