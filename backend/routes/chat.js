// Chat Routes
router.get('/conversations', chatController.getConversations);         // Get all conversations
router.get('/conversation/:matchId', chatController.getMessages);      // Get messages for a conversation
router.post('/conversation/:matchId', chatController.sendMessage);     // Send a message
router.delete('/message/:messageId', chatController.deleteMessage);    // Delete a message 