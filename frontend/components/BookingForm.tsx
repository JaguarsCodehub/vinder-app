import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Text, Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.7:5000';

interface TimeSlot {
    start: string;
    end: string;
}

interface BookingFormProps {
    venue: {
        _id: string;
        name: string;
        priceRange: string;
    };
    onClose: () => void;
}

export default function BookingForm({ venue, onClose }: BookingFormProps) {
    const router = useRouter();
    const [date, setDate] = useState(new Date());
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');

    // Calculate base price based on venue price range
    const getBasePrice = () => {
        switch (venue.priceRange) {
            case '$': return 50;
            case '$$': return 100;
            case '$$$': return 150;
            case '$$$$': return 200;
            default: return 100;
        }
    };

    useEffect(() => {
        fetchTimeSlots();
    }, [date]);

    const fetchTimeSlots = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                setError('Please login to book a venue');
                return;
            }

            // Format date as YYYY-MM-DD
            const formattedDate = date.toISOString().split('T')[0];

            const response = await axios.get(
                `${API_URL}/api/bookings/venues/${venue._id}/time-slots?date=${formattedDate}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setTimeSlots(response.data);
        } catch (err: any) {
            setError('Failed to fetch time slots');
            console.error('Time slots error:', err.response?.data || err);
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async () => {
        if (!selectedSlot) return;

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                setError('Please login to book a venue');
                return;
            }

            // Format date as YYYY-MM-DD
            const formattedDate = date.toISOString().split('T')[0];
            const bookingData = {
                venueId: venue._id,
                date: formattedDate,
                timeSlot: selectedSlot,
                price: getBasePrice()
            };
            console.log('Sending booking request:', bookingData);

            const response = await axios.post(
                `${API_URL}/api/bookings`,
                bookingData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Close the booking form modal
            onClose();

            // Navigate to payment page
            router.push({
                pathname: '/(main)/payment',
                params: { bookingId: response.data._id }
            });
        } catch (err: any) {
            setError('Failed to create booking');
            console.error('Booking error:', err.response?.data || err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card style={styles.container}>
            <Card.Content>
                <Title>Book {venue.name}</Title>
                <View style={styles.dateContainer}>
                    <Text>Select Date:</Text>
                    {Platform.OS === 'android' ? (
                        <>
                            <Button
                                mode="outlined"
                                onPress={() => setShowDatePicker(true)}
                                style={styles.dateButton}
                            >
                                {date.toLocaleDateString()}
                            </Button>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) setDate(selectedDate);
                                    }}
                                    minimumDate={new Date()}
                                />
                            )}
                        </>
                    ) : (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            onChange={(event, selectedDate) => {
                                if (selectedDate) setDate(selectedDate);
                            }}
                            minimumDate={new Date()}
                        />
                    )}
                </View>

                {loading ? (
                    <ActivityIndicator />
                ) : (
                    <View style={styles.timeSlotsContainer}>
                        <Text>Available Time Slots:</Text>
                        <View style={styles.slots}>
                            {timeSlots.map((slot, index) => (
                                <Button
                                    key={index}
                                    mode={selectedSlot === slot ? 'contained' : 'outlined'}
                                    onPress={() => setSelectedSlot(slot)}
                                    style={styles.slotButton}
                                >
                                    {`${slot.start} - ${slot.end}`}
                                </Button>
                            ))}
                        </View>
                    </View>
                )}

                {error && <Text style={styles.error}>{error}</Text>}

                <View style={styles.footer}>
                    <Button mode="outlined" onPress={onClose} style={styles.button}>
                        Cancel
                    </Button>
                    <Button
                        mode="contained"
                        onPress={handleBooking}
                        disabled={!selectedSlot || loading}
                        style={styles.button}
                    >
                        Book Now (${getBasePrice()})
                    </Button>
                </View>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        margin: 16,
    },
    dateContainer: {
        marginVertical: 16,
    },
    dateButton: {
        marginTop: 8,
    },
    timeSlotsContainer: {
        marginVertical: 16,
    },
    slots: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    slotButton: {
        margin: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    button: {
        flex: 1,
        marginHorizontal: 4,
    },
    error: {
        color: 'red',
        marginVertical: 8,
    },
});
