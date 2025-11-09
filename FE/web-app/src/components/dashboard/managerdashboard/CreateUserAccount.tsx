"use client";
import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import apiClient from "@/lib/apiClient";
import { authService } from "@/services/authService";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

// ==== Interface types ====
interface Role {
  roleId: string;
  roleName: string;
}

interface ServiceCenter {
  id: string;
  name: string;
}

interface VehicleCompany {
  id: string;
  name: string;
}

interface UserInfo {
  userId: string;
  username: string;
  roleName:
    | "emv_admin"
    | "service_center_manager"
    | "service_center_staff"
    | "emv_staff"
    | "parts_coordinator_company";
  serviceCenterId?: string;
  companyId?: string;
}

interface FormData {
  username: string;
  password: string;
  email: string;
  phone: string;
  address: string;
  name: string;
  employeeCode: string;
  roleId: string;
  serviceCenterId: string;
  vehicleCompanyId: string;
}

export function CreateUserAccount() {
  const currentUser = authService.getUserInfo() as UserInfo | null;
  const token = authService.getToken();

  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
    email: "",
    phone: "",
    address: "",
    name: "",
    employeeCode: "",
    roleId: "",
    serviceCenterId: "",
    vehicleCompanyId: "",
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);
  const [vehicleCompanies, setVehicleCompanies] = useState<VehicleCompany[]>([]);
  const [loading, setLoading] = useState(false);

  // ==== Fetch roles ====
  useEffect(() => {
    const fetchRoles = async () => {
      if (!token) return;
      try {
        const res = await apiClient.get("/roles", { headers: { Authorization: `Bearer ${token}` } });
        setRoles(res.data.data || []);
      } catch (err: any) {
        console.error("❌ Lỗi tải roles:", err);
        toast.error("Không thể tải danh sách vai trò.");
      }
    };
    fetchRoles();
  }, [token]);

  // ==== Fetch ServiceCenters & VehicleCompanies (Admin only) ====
  useEffect(() => {
    const fetchData = async () => {
      if (!token || currentUser?.roleName !== "emv_admin") return;
      try {
        const [scRes, vcRes] = await Promise.all([
          apiClient.get("/serviceCenters", { headers: { Authorization: `Bearer ${token}` } }),
          apiClient.get("/vehicleCompanies", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setServiceCenters(scRes.data.data || []);
        setVehicleCompanies(vcRes.data.data || []);
      } catch (err: any) {
        console.error("❌ Lỗi tải dữ liệu admin:", err);
        toast.error("Không thể tải Service Center hoặc Vehicle Company.");
      }
    };
    fetchData();
  }, [currentUser?.roleName, token]);

  // ==== Handle input change ====
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Admin chọn serviceCenter/vehicleCompany: chỉ được chọn 1
    if (currentUser?.roleName === "emv_admin") {
      if (name === "serviceCenterId" && value) {
        setFormData((prev) => ({
          ...prev,
          serviceCenterId: value,
          vehicleCompanyId: "",
        }));
        return;
      }
      if (name === "vehicleCompanyId" && value) {
        setFormData((prev) => ({
          ...prev,
          vehicleCompanyId: value,
          serviceCenterId: "",
        }));
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ==== Handle submit ====
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);

    try {
      if (
        currentUser.roleName !== "emv_admin" &&
        currentUser.roleName !== "service_center_manager"
      ) {
        toast.error("Bạn không có quyền tạo tài khoản nhân viên mới.");
        setLoading(false);
        return;
      }

      const payload: any = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        name: formData.name,
        employeeCode: formData.employeeCode,
        roleId: formData.roleId,
      };

      if (currentUser.roleName === "service_center_manager") {
        payload.serviceCenterId = currentUser.serviceCenterId;
      }

      if (currentUser.roleName === "emv_admin") {
        const hasServiceCenter = !!formData.serviceCenterId;
        const hasVehicleCompany = !!formData.vehicleCompanyId;

        if (hasServiceCenter && hasVehicleCompany) {
          toast.error("Chỉ được chọn *một*: Trung tâm dịch vụ hoặc Công ty sản xuất.");
          setLoading(false);
          return;
        }
        if (!hasServiceCenter && !hasVehicleCompany) {
          toast.error("Vui lòng chọn Trung tâm dịch vụ hoặc Công ty sản xuất.");
          setLoading(false);
          return;
        }

        if (hasServiceCenter) payload.serviceCenterId = formData.serviceCenterId;
        if (hasVehicleCompany) payload.vehicleCompanyId = formData.vehicleCompanyId;
      }

      await apiClient.post("/auth/registerAccount", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("✅ Tạo tài khoản thành công!");
      setFormData({
        username: "",
        password: "",
        email: "",
        phone: "",
        address: "",
        name: "",
        employeeCode: "",
        roleId: "",
        serviceCenterId: "",
        vehicleCompanyId: "",
      });
    } catch (err: any) {
      console.error("❌ Lỗi tạo tài khoản:", err);
      toast.error(err?.response?.data?.message || "Không thể tạo tài khoản. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // ==== Render ====
  if (!currentUser) {
    return <div className="p-6 text-center text-gray-600">❌ Bạn chưa đăng nhập</div>;
  }

  if (currentUser.roleName !== "emv_admin" && currentUser.roleName !== "service_center_manager") {
    return <div className="p-6 text-center text-gray-600">❌ Bạn không có quyền tạo tài khoản</div>;
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl font-semibold mb-4 text-center">🧾 Tạo tài khoản nhân viên mới</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Tên đăng nhập"
            required
            className="border p-2 rounded-lg w-full"
          />
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Mật khẩu"
            required
            className="border p-2 rounded-lg w-full"
          />
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="border p-2 rounded-lg w-full"
          />
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Số điện thoại"
            className="border p-2 rounded-lg w-full"
          />
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Họ tên nhân viên"
            className="border p-2 rounded-lg w-full"
          />
          <input
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Địa chỉ"
            className="border p-2 rounded-lg w-full"
          />
          <input
            name="employeeCode"
            value={formData.employeeCode}
            onChange={handleChange}
            placeholder="Mã nhân viên"
            required
            className="border p-2 rounded-lg w-full"
          />
          <select
            name="roleId"
            value={formData.roleId}
            onChange={handleChange}
            required
            className="border p-2 rounded-lg w-full"
          >
            <option value="" disabled>Chọn vai trò</option>
            {roles.map((role) => (
              <option key={role.roleId} value={role.roleId}>{role.roleName}</option>
            ))}
          </select>

          {currentUser.roleName === "emv_admin" && (
            <>
              <p className="text-sm text-gray-600 italic col-span-2">
                🔹 Chỉ chọn *một*: Trung tâm dịch vụ hoặc Công ty sản xuất
              </p>
              <select
                name="serviceCenterId"
                value={formData.serviceCenterId}
                onChange={handleChange}
                className="border p-2 rounded-lg w-full"
              >
                <option value="">Chọn trung tâm dịch vụ</option>
                {serviceCenters.map((center) => (
                  <option key={center.id} value={center.id}>{center.name}</option>
                ))}
              </select>
              <select
                name="vehicleCompanyId"
                value={formData.vehicleCompanyId}
                onChange={handleChange}
                className="border p-2 rounded-lg w-full"
              >
                <option value="">Chọn công ty sản xuất</option>
                {vehicleCompanies.map((vc) => (
                  <option key={vc.id} value={vc.id}>{vc.name}</option>
                ))}
              </select>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </button>
      </form>
    </motion.div>
  );
}
