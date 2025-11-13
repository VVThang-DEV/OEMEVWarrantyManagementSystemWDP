class NotificationController {
  constructor({ notificationService }) {
    this.notificationService = notificationService;
  }

  getNotifications = async (req, res, next) => {
    try {
      const { user } = req;
      const { page = 1, limit = 10 } = req.query;
      const notifications = await this.notificationService.getNotificationsForUser({
        user,
        page: parseInt(page),
        limit: parseInt(limit),
      });
      res.status(200).json({
        status: "success",
        ...notifications,
      });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req, res, next) => {
    try {
      const { id } = req.params;
      const success = await this.notificationService.markNotificationAsRead(id);
      if (success) {
        res.status(200).json({
          status: "success",
          message: "Notification marked as read.",
        });
      } else {
        res.status(404).json({
          status: "fail",
          message: "Notification not found or already read.",
        });
      }
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req, res, next) => {
    try {
      const { user } = req;
      const affectedRows = await this.notificationService.markAllNotificationsAsReadForUser({ user });
      res.status(200).json({
        status: "success",
        message: `${affectedRows} notifications marked as read.`,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default NotificationController;
