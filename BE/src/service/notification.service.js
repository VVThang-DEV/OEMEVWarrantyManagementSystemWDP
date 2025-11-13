import dayjs from "dayjs";

class NotificationService {
  #notificationNamespace;
  #notificationRepository;

  constructor({ notificationNamespace, notificationRepository }) {
    this.#notificationNamespace = notificationNamespace;
    this.#notificationRepository = notificationRepository;
  }

  sendToRoom = async (roomName, eventName, data) => {
    if (!roomName || typeof roomName !== "string") {
      return false;
    }
    if (!eventName || typeof eventName !== "string") {
      return false;
    }
    if (!data || typeof data !== "object") {
      return false;
    }

    const notification = await this.#notificationRepository.create({
      roomName,
      eventName,
      data,
    });

    this.#notificationNamespace.to(roomName).emit(eventName, {
      ...data,
      notificationId: notification.notificationId,
      sentAt: dayjs().toISOString(),
      room: roomName,
    });

    return true;
  };

  sendToRooms = async (roomNames, eventName, data) => {
    if (
      !Array.isArray(roomNames) ||
      roomNames.length === 0 ||
      !eventName ||
      typeof eventName !== "string" ||
      !data ||
      typeof data !== "object"
    ) {
      return false;
    }

    await Promise.all(
      roomNames.map(async (roomName) => {
        await this.sendToRoom(roomName, eventName, data);
      })
    );

    return true;
  };

  getNotificationsForUser = async ({ user, page, limit }) => {
    const offset = (page - 1) * limit;
    const roomNames = this.#getUserRooms(user);

    const notifications = await this.#notificationRepository.findAllByRoomNames(
      {
        roomNames,
        userId: user?.userId,
        limit,
        offset,
      }
    );

    return notifications;
  };

  markNotificationAsRead = async ({ notificationId, user }) => {
    const roomNames = this.#getUserRooms(user);
    const affectedRows = await this.#notificationRepository.markAsRead({
      notificationId,
      userId: user?.userId,
      roomNames,
    });
    return affectedRows > 0;
  };

  markAllNotificationsAsReadForUser = async ({ user }) => {
    const roomNames = this.#getUserRooms(user);
    const affectedRows =
      await this.#notificationRepository.markAllAsReadForRooms({
        userId: user?.userId,
        roomNames,
      });
    return affectedRows;
  };

  #getUserRooms = (user) => {
    const { userId, role, serviceCenterId, companyId } = user;
    const rooms = [];

    if (!role || !role.roleName) {
      return rooms;
    }

    if (userId) {
      rooms.push(`user_${userId}`);
    }

    switch (role.roleName) {
      case "emv_staff":
        rooms.push(`emv_staff_${companyId}`);
        break;
      case "parts_coordinator_company":
        rooms.push(`parts_coordinator_company_${companyId}`);
        break;
      case "service_center_manager":
        rooms.push(`service_center_manager_${serviceCenterId}`);
        break;
      case "parts_coordinator_service_center":
        rooms.push(`parts_coordinator_service_center_${serviceCenterId}`);
        break;
      case "service_center_staff":
        rooms.push(`service_center_staff_${serviceCenterId}`);
        break;
      case "technician":
        rooms.push(`technician_service_center_${serviceCenterId}`);
        break;
      default:
        break;
    }

    return rooms.filter(Boolean);
  };
}

export default NotificationService;
