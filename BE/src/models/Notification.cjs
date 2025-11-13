module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      notificationId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: "notification_id",
      },
      roomName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "room_name",
      },
      eventName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "event_name",
      },
      data: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: "data",
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: "is_read",
      },
    },
    {
      tableName: "notification",
      timestamps: true,
    }
  );

  return Notification;
};
