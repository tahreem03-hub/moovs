// In your NotificationService class
/*async createNotification(notificationData) {
  // Save to database
  const notification = await this.saveToDatabase(notificationData);
  
  // Emit real-time if socket.io is available
  if (this.io) {
    const room = `${notificationData.recipientRole}-${notificationData.recipient}`;
    this.io.to(room).emit('notification', notification);
    console.log(`📡 Emitted notification to room: ${room}`);
  }
  
  return notification;
}*/