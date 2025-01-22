import React, { useState } from 'react';
import { View, StyleSheet, Modal, Text } from 'react-native';
import { Card, Button, Title, Paragraph } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BookingForm from './BookingForm';

interface VenueCardProps {
    venue: {
        _id: string;
        name: string;
        description: string;
        images: string[];
        priceRange: string;
        rating: number;
        category: string;
    };
    onNavigate?: () => void;
    onShare?: () => void;
    onFavorite?: () => void;
}

export default function VenueCard({ venue, onNavigate, onShare, onFavorite }: VenueCardProps) {
    const [showBookingForm, setShowBookingForm] = useState(false);

    const renderRating = () => {
        return Array(5).fill(0).map((_, index) => (
            <MaterialCommunityIcons
                key={index}
                name={index < venue.rating ? 'star' : 'star-outline'}
                size={16}
                color={index < venue.rating ? '#FFC107' : '#757575'}
            />
        ));
    };

    const getCategoryIcon = () => {
        switch (venue.category) {
            case 'restaurant':
                return 'silverware-fork-knife';
            case 'park':
                return 'tree';
            case 'arcade':
                return 'gamepad-variant';
            case 'movie_theater':
                return 'movie';
            case 'cafe':
                return 'coffee';
            case 'shopping':
                return 'shopping';
            case 'entertainment':
                return 'ticket';
            default:
                return 'map-marker';
        }
    };

    return (
        <>
            <Card style={styles.card}>
                {venue.images && venue.images.length > 0 && (
                    <Card.Cover source={{ uri: venue.images[0] }} />
                )}
                <Card.Content>
                    <View style={styles.header}>
                        <Title style={styles.title}>{venue.name}</Title>
                        <MaterialCommunityIcons
                            name={getCategoryIcon()}
                            size={24}
                            color="#2196F3"
                        />
                    </View>
                    <View style={styles.ratingContainer}>
                        <View style={styles.stars}>{renderRating()}</View>
                        <View style={styles.categoryPriceContainer}>
                            <Paragraph style={styles.category}>{venue.category}</Paragraph>
                            <Text style={styles.dot}>•</Text>
                            <Paragraph style={styles.priceRange}>{venue.priceRange}</Paragraph>
                        </View>
                    </View>
                    <Paragraph style={styles.description} numberOfLines={2}>{venue.description}</Paragraph>
                </Card.Content>

                <Card.Actions style={styles.actions}>
                    <Button
                        icon="map-marker"
                        mode="outlined"
                        onPress={onNavigate}
                        style={styles.actionButton}
                        labelStyle={styles.actionButtonLabel}
                        color="#2196F3"
                    >
                        Navigate
                    </Button>
                    <Button
                        icon="calendar"
                        mode="contained"
                        onPress={() => setShowBookingForm(true)}
                        style={[styles.actionButton, styles.bookButton]}
                        labelStyle={[styles.actionButtonLabel, styles.bookButtonLabel]}
                    >
                        Book
                    </Button>
                    <Button
                        icon="share"
                        mode="outlined"
                        onPress={onShare}
                        style={styles.actionButton}
                        labelStyle={styles.actionButtonLabel}
                        color="#2196F3"
                    >
                        Share
                    </Button>
                </Card.Actions>
            </Card>

            <Modal
                visible={showBookingForm}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowBookingForm(false)}
            >
                <View style={styles.modalContainer}>
                    <BookingForm
                        venue={venue}
                        onClose={() => setShowBookingForm(false)}
                    />
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        margin: 8,
        elevation: 4,
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    ratingContainer: {
        marginBottom: 12,
    },
    stars: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    categoryPriceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    category: {
        color: '#2196F3',
        textTransform: 'capitalize',
    },
    dot: {
        color: '#666',
        marginHorizontal: 6,
    },
    priceRange: {
        color: '#666',
    },
    description: {
        color: '#555',
        lineHeight: 20,
    },
    actions: {
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    actionButton: {
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 4,
    },
    actionButtonLabel: {
        fontSize: 12,
        marginHorizontal: 4,
    },
    bookButton: {
        backgroundColor: '#2196F3',
    },
    bookButtonLabel: {
        color: '#fff',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
    },
});
