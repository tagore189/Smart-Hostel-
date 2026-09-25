import mongoose from 'mongoose';
import { Notification, NotificationType } from '../models/Notification';
import { emitToUser } from './socket';

export interface CreateNotificationParams {
  recipientId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, any>;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const notification = await Notification.create({
      recipient: params.recipientId,
      title: params.title,
      message: params.message,
      type: params.type,
      data: params.data,
      isRead: false,
    });

    emitToUser(params.recipientId.toString(), 'notification:new', {
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error);
    return null;
  }
};
