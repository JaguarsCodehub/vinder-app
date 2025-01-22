import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BookingConfirmation() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Card style={styles.card}>
                <Card.Content style={styles.content}>
                    <MaterialCommunityIcons
                        name="check-circle"
                        size={64}
                        color="#4CAF50"
                        style={styles.icon}
                    />
                    <Title style={styles.title}>Booking Confirmed!</Title>
                    <Paragraph style={styles.message}>
                        Your booking has been successfully confirmed. You will receive a confirmation email shortly.
                    </Paragraph>
                    
                    <View style={styles.buttonContainer}>
                        <Button
                            mode="contained"
                            onPress={() => router.replace('/(main)')}
                            style={styles.button}
                        >
                            Back to Home
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={() => router.push('/(main)/my-bookings')}
                            style={styles.button}
                        >
                            View My Bookings
                        </Button>
                    </View>
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
        justifyContent: 'center',
    },
    card: {
        elevation: 4,
    },
    content: {
        alignItems: 'center',
        padding: 16,
    },
    icon: {
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        textAlign: 'center',
        marginBottom: 24,
    },
    buttonContainer: {
        width: '100%',
    },
    button: {
        marginVertical: 8,
    },
});
