import {
  createContainer,
  asClass,
  asFunction,
  asValue,
  Lifetime,
} from "awilix";
import db from "./src/models/index.cjs";

// Import repositories
import UserRepository from "./src/repository/user.repository.js";
import VehicleRepository from "./src/repository/vehicle.repository.js";
import CustomerRepository from "./src/repository/customer.repository.js";
import VehicleProcessingRecordRepository from "./src/repository/vehicleProcessingRecord.repository.js";
import GuaranteeCaseRepository from "./src/repository/guaranteeCase.repository.js";
import ConversationRepository from "./src/repository/conversation.repository.js";
import MessageRepository from "./src/repository/message.repository.js";
import GuestRepository from "./src/repository/guest.repository.js";
import CaselineRepository from "./src/repository/caseline.repository.js";
import ComponentReservationRepository from "./src/repository/componentReservation.repository.js";
import ComponentRepository from "./src/repository/component.repository.js";
import WarehouseRepository from "./src/repository/warehouse.repository.js";
import StockTransferRequestRepository from "./src/repository/stockTransferRequest.repository.js";
import StockTransferRequestItemRepository from "./src/repository/stockTransferRequestItem.repository.js";
import WorkScheduleRepository from "./src/repository/workSchedule.repository.js";
import InventoryRepository from "./src/repository/inventory.repository.js";
import TaskAssignmentRepository from "./src/repository/taskAssignment.repository.js";
import OemVehicleModelRepository from "./src/repository/oemVehicleModel.repository.js";
import WarrantyComponentRepository from "./src/repository/warrantyComponent.repository.js";
import TypeComponentRepository from "./src/repository/typeComponent.repository.js";
import RecallRepository from "./src/repository/recall.repository.js";
import RoleRepository from "./src/repository/role.repository.js";
import ServiceCenterRepository from "./src/repository/serviceCenter.repository.js";

// Import services
import UserService from "./src/service/user.service.js";
import HashService from "./src/service/hash.service.js";
import AuthService from "./src/service/auth.service.js";
import TokenService from "./src/service/token.service.js";
import VehicleService from "./src/service/vehicle.service.js";
import CustomerService from "./src/service/customer.service.js";
import VehicleProcessingRecordService from "./src/service/vehicleProcessingRecord.service.js";
import ChatService from "./src/service/chat.service.js";
import NotificationService from "./src/service/notification.service.js";
import CaseLineService from "./src/service/caseLine.service.js";
import ComponentReservationService from "./src/service/componentReservation.service.js";
import WarehouseService from "./src/service/warehouse.service.js";
import StockTransferRequestService from "./src/service/stockTransferRequest.service.js";
import WorkScheduleService from "./src/service/workSchedule.service.js";
import MailService from "./src/service/mail.service.js";
import InventoryService from "./src/service/inventory.service.js";
import TaskAssignmentService from "./src/service/taskAssignment.service.js";
import OemVehicleModelService from "./src/service/oemVehicleModel.service.js";
import RecallService from "./src/service/recall.service.js";
import RoleService from "./src/service/role.service.js";
import ServiceCenterService from "./src/service/serviceCenter.service.js";

// Import controllers
import AuthController from "./src/api/controller/auth.controller.js";
import UserController from "./src/api/controller/user.controller.js";
import VehicleController from "./src/api/controller/vehicle.controller.js";
import CustomerController from "./src/api/controller/customer.controller.js";
import VehicleProcessingRecordController from "./src/api/controller/vehicleProcessingRecord.controller.js";
import ChatController from "./src/api/controller/chat.controller.js";
import CaseLineController from "./src/api/controller/caseLine.controller.js";
import ComponentReservationsController from "./src/api/controller/componentReservations.controller.js";
import ComponentController from "./src/api/controller/warrantyComponent.controller.js";
import WarehouseController from "./src/api/controller/warehouse.controller.js";
import StockTransferRequestController from "./src/api/controller/stockTransferRequest.controller.js";
import WorkScheduleController from "./src/api/controller/workSchedule.controller.js";
import MailController from "./src/api/controller/mail.controller.js";
import InventoryController from "./src/api/controller/inventory.controller.js";
import TaskAssignmentController from "./src/api/controller/taskAssignment.controller.js";
import OemVehicleModelController from "./src/api/controller/oemVehicleModel.controller.js";
import RecallController from "./src/api/controller/recall.controller.js";
import RoleController from "./src/api/controller/role.controller.js";

const container = createContainer();

export const setupContainer = (socket) => {
  container.register({
    // Sockets
    io: asValue(socket.io),
    notificationNamespace: asValue(socket.notificationNamespace),
    chatNamespace: asValue(socket.chatNamespace),

    // Models
    db: asValue(db),

    // Repositories
    userRepository: asClass(UserRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    vehicleRepository: asClass(VehicleRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    customerRepository: asClass(CustomerRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    vehicleProcessingRecordRepository: asClass(
      VehicleProcessingRecordRepository,
      {
        lifetime: Lifetime.SINGLETON,
      }
    ),
    guaranteeCaseRepository: asClass(GuaranteeCaseRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    conversationRepository: asClass(ConversationRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    messageRepository: asClass(MessageRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    guestRepository: asClass(GuestRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    caselineRepository: asClass(CaselineRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    componentReservationRepository: asClass(ComponentReservationRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    componentRepository: asClass(ComponentRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    warehouseRepository: asClass(WarehouseRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    stockTransferRequestRepository: asClass(StockTransferRequestRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    stockTransferRequestItemRepository: asClass(
      StockTransferRequestItemRepository,
      {
        lifetime: Lifetime.SINGLETON,
      }
    ),
    workScheduleRepository: asClass(WorkScheduleRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    inventoryRepository: asClass(InventoryRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    taskAssignmentRepository: asClass(TaskAssignmentRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    oemVehicleModelRepository: asClass(OemVehicleModelRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    warrantyComponentRepository: asClass(WarrantyComponentRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    typeComponentRepository: asClass(TypeComponentRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    recallRepository: asClass(RecallRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    roleRepository: asClass(RoleRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    serviceCenterRepository: asClass(ServiceCenterRepository, {
      lifetime: Lifetime.SINGLETON,
    }),

    // Services
    userService: asClass(UserService, { lifetime: Lifetime.SINGLETON }),
    hashService: asClass(HashService, { lifetime: Lifetime.SINGLETON }),
    authService: asClass(AuthService, { lifetime: Lifetime.SINGLETON }),
    tokenService: asClass(TokenService, { lifetime: Lifetime.SINGLETON }),
    vehicleService: asClass(VehicleService, {
      lifetime: Lifetime.SINGLETON,
    }),
    customerService: asClass(CustomerService, {
      lifetime: Lifetime.SINGLETON,
    }),
    vehicleProcessingRecordService: asClass(VehicleProcessingRecordService, {
      lifetime: Lifetime.SINGLETON,
    }),
    chatService: asClass(ChatService, { lifetime: Lifetime.SINGLETON }),
    notificationService: asClass(NotificationService, {
      lifetime: Lifetime.SINGLETON,
    }),
    caseLineService: asClass(CaseLineService, {
      lifetime: Lifetime.SINGLETON,
    }),
    componentReservationService: asClass(ComponentReservationService, {
      lifetime: Lifetime.SINGLETON,
    }),
    warehouseService: asClass(WarehouseService, {
      lifetime: Lifetime.SINGLETON,
    }),
    stockTransferRequestService: asClass(StockTransferRequestService, {
      lifetime: Lifetime.SINGLETON,
    }),
    workScheduleService: asClass(WorkScheduleService, {
      lifetime: Lifetime.SINGLETON,
    }),
    mailService: asClass(MailService, { lifetime: Lifetime.SINGLETON }),
    inventoryService: asClass(InventoryService, {
      lifetime: Lifetime.SINGLETON,
    }),
    taskAssignmentService: asClass(TaskAssignmentService, {
      lifetime: Lifetime.SINGLETON,
    }),
    oemVehicleModelService: asClass(OemVehicleModelService, {
      lifetime: Lifetime.SINGLETON,
    }),
    recallService: asClass(RecallService, {
      lifetime: Lifetime.SINGLETON,
    }),
    roleService: asClass(RoleService, {
      lifetime: Lifetime.SINGLETON,
    }),
    serviceCenterService: asClass(ServiceCenterService, {
      lifetime: Lifetime.SINGLETON,
    }),

    // Controllers
    authController: asClass(AuthController, {
      lifetime: Lifetime.SINGLETON,
    }),
    userController: asClass(UserController, {
      lifetime: Lifetime.SINGLETON,
    }),
    vehicleController: asClass(VehicleController, {
      lifetime: Lifetime.SINGLETON,
    }),
    customerController: asClass(CustomerController, {
      lifetime: Lifetime.SINGLETON,
    }),
    vehicleProcessingRecordController: asClass(
      VehicleProcessingRecordController,
      {
        lifetime: Lifetime.SINGLETON,
      }
    ),
    chatController: asClass(ChatController, {
      lifetime: Lifetime.SINGLETON,
    }),
    caseLineController: asClass(CaseLineController, {
      lifetime: Lifetime.SINGLETON,
    }),
    componentReservationsController: asClass(ComponentReservationsController, {
      lifetime: Lifetime.SINGLETON,
    }),
    componentController: asClass(ComponentController, {
      lifetime: Lifetime.SINGLETON,
    }),
    warehouseController: asClass(WarehouseController, {
      lifetime: Lifetime.SINGLETON,
    }),
    stockTransferRequestController: asClass(StockTransferRequestController, {
      lifetime: Lifetime.SINGLETON,
    }),
    workScheduleController: asClass(WorkScheduleController, {
      lifetime: Lifetime.SINGLETON,
    }),
    mailController: asClass(MailController, {
      lifetime: Lifetime.SINGLETON,
    }),
    inventoryController: asClass(InventoryController, {
      lifetime: Lifetime.SINGLETON,
    }),
    taskAssignmentController: asClass(TaskAssignmentController, {
      lifetime: Lifetime.SINGLETON,
    }),
    oemVehicleModelController: asClass(OemVehicleModelController, {
      lifetime: Lifetime.SINGLETON,
    }),
    recallController: asClass(RecallController, {
      lifetime: Lifetime.SINGLETON,
    }),
    roleController: asClass(RoleController, {
      lifetime: Lifetime.SINGLETON,
    }),
  });
};

export default container;
