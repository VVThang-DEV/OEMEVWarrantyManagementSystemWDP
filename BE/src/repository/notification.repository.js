import db from "../models/index.cjs";

const { Notification } = db;

class NotificationRepository {
  create = async ({ roomName, eventName, data, isRead = false }, transaction = null) => {
    const newNotification = await Notification.create(
      {
        roomName,
        eventName,
        data,
        isRead,
      },
      { transaction }
    );
    return newNotification.toJSON();
  };

  findAllByRoomNames = async ({ roomNames, limit, offset }) => {
    const { count, rows } = await Notification.findAndCountAll({
      where: {
        roomName: roomNames,
      },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    return { count, rows: rows.map((row) => row.toJSON()) };
  };

  markAsRead = async (notificationId) => {
    const [affectedRows] = await Notification.update(
      { isRead: true },
      {
        where: { notificationId, isRead: false },
      }
    );
    return affectedRows;
  };

  markAllAsReadForRooms = async (roomNames) => {
    const [affectedRows] = await Notification.update(
      { isRead: true },
      {
        where: {
          roomName: roomNames,
          isRead: false,
        },
      }
    );
    return affectedRows;
  };
}

export default NotificationRepository;
