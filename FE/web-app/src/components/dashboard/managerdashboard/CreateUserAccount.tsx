"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { toast } from "react-hot-toast";
import { authService } from "@/services/authService";
import apiClient from "@/lib/apiClient";

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
    | "service_center_technician"
    | "parts_coordinator_company"
    | "parts_coordinator_service_center";
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
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ===== Fetch Roles & Data =====
  useEffect(() => {
    if (!token || !currentUser) return;

    const fetchRoles = async () => {
      try {
        const res = await apiClient.get("/roles", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedRoles: Role[] = res.data.data.map((r: any) => ({
          roleId: r.roleId || r.id,
          roleName: r.roleName || r.name,
        }));

        if (currentUser.roleName === "service_center_manager") {
          const allowed = [
            "service_center_staff",
            "service_center_technician",
            "parts_coordinator_service_center",
          ];
          setRoles(fetchedRoles.filter((r) => allowed.includes(r.roleName)));
        } else if (currentUser.roleName === "emv_admin") {
          setRoles(fetchedRoles);
        }
      } catch {
        toast.error("⚠️ Unable to load roles.");
      }
    };

    const fetchData = async () => {
      if (currentUser.roleName !== "emv_admin") return;
      try {
        const [scRes, vcRes] = await Promise.all([
          apiClient.get("/serviceCenters", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiClient.get("/vehicleCompanies", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setServiceCenters(scRes.data.data || []);
        setVehicleCompanies(vcRes.data.data || []);
      } catch {
        toast.error("⚠️ Unable to load admin data.");
      }
    };

    fetchRoles();
    fetchData();
  }, [token, currentUser?.roleName]);

  // ===== Handle Change =====
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (currentUser?.roleName === "emv_admin") {
      if (name === "serviceCenterId" && value) {
        setFormData((p) => ({
          ...p,
          serviceCenterId: value,
          vehicleCompanyId: "",
        }));
        return;
      }
      if (name === "vehicleCompanyId" && value) {
        setFormData((p) => ({
          ...p,
          vehicleCompanyId: value,
          serviceCenterId: "",
        }));
        return;
      }
    }
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // ===== Handle Submit =====
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);

    try {
      const payload: any = {
        username: formData.username,
        password: formData.password,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        name: formData.name || undefined,
        employeeCode: formData.employeeCode,
        roleId: formData.roleId,
      };

      if (currentUser.roleName === "service_center_manager") {
        payload.serviceCenterId = currentUser.serviceCenterId;
      }

      if (currentUser.roleName === "emv_admin") {
        const hasSC = !!formData.serviceCenterId;
        const hasVC = !!formData.vehicleCompanyId;
        if (hasSC && hasVC) {
          toast.error("⚠️ Select only one: Service Center or Vehicle Company.");
          setLoading(false);
          return;
        }
        if (!hasSC && !hasVC) {
          toast.error("⚠️ Please select Service Center or Vehicle Company.");
          setLoading(false);
          return;
        }
        if (hasSC) payload.serviceCenterId = formData.serviceCenterId;
        if (hasVC) payload.vehicleCompanyId = formData.vehicleCompanyId;
      }

      await apiClient.post("/auth/registerAccount", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Thành công
      toast.success("✅ Account created successfully!", { duration: 4000 });

      // Reset form
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
      console.error("❌ API Error:", err?.response?.data);

      const status = err?.response?.status;
      const errorMsg = err?.response?.data?.message?.toLowerCase?.() || "";
      const details = err?.response?.data?.errors;

      // ✅ Hiển thị chi tiết lỗi từ backend
      if (Array.isArray(details) && details.length > 0) {
        toast.error(`⚠️ ${details.join(", ")}`);
      } else if (errorMsg.includes("username")) {
        toast.error("❌ Username already exists. Please choose another username.");
      } else if (errorMsg.includes("employeecode")) {
        toast.error("❌ Employee Code already exists. Please use another code.");
      } else if (errorMsg.includes("validation")) {
        toast.error("⚠️ Validation error: Please check all required fields.");
      } else if (status === 409) {
        toast.error(`⚠️ Conflict: ${err.response.data?.message || "Duplicate data."}`);
      } else if (status === 500) {
        toast.error(`❌ Server error: ${err.response?.data?.message || "Something went wrong on the server."}`);
      } else {
        toast.error("❌ Unable to create account. Please check your input.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ===== UI Render =====
  if (!currentUser)
    return (
      <div className="p-6 text-center text-gray-600">
        ❌ You are not logged in
      </div>
    );

  if (!["emv_admin", "service_center_manager"].includes(currentUser.roleName))
    return (
      <div className="p-6 text-center text-gray-600">
        ❌ You do not have permission to create an account
      </div>
    );

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50">
      {/* Header Title Section */}
      <div className="px-10 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-gray-900">
          Create User Account
        </h1>
        <p className="text-gray-500">
          Manage employee accounts and assign roles for service centers or
          companies.
        </p>
      </div>

      {/* Main Content */}
      <div className="flex justify-center w-full px-10 pt-8 pb-40">
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 w-full max-w-6xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Information */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900">
                👤 User Information
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Username", name: "username", required: true, type: "text" },
                  { label: "Password", name: "password", required: true, type: "password" },
                  { label: "Email", name: "email", type: "email" },
                  { label: "Phone", name: "phone", type: "text" },
                  { label: "Full Name", name: "name", type: "text" },
                  { label: "Address", name: "address", type: "text" },
                ].map((field) => (
                  <div key={field.name} className="max-w-[90%]">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      name={field.name}
                      type={field.type}
                      value={formData[field.name]}
                      onChange={handleChange}
                      required={field.required}
                      className="border border-gray-300 p-1.5 sm:p-2 rounded-lg w-full bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                ))}

                <div className="col-span-2 max-w-[95%]">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Employee Code<span className="text-red-500">*</span>
                  </label>
                  <input
                    name="employeeCode"
                    type="text"
                    value={formData.employeeCode}
                    onChange={handleChange}
                    required
                    className="border border-gray-300 p-1.5 sm:p-2 rounded-lg w-full bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>
            </section>

            {/* Role Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900">
                🏢 Role & Assignment
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Role Dropdown with Animated Arrow */}
                <div className="relative">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      name="roleId"
                      value={formData.roleId}
                      onChange={handleChange}
                      required
                      onFocus={() => setDropdownOpen(true)}
                      onBlur={() => setDropdownOpen(false)}
                      className="border border-gray-300 p-1.5 sm:p-2 rounded-lg w-full bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none"
                    >
                      <option value="">Select role</option>
                      {roles.map((r) => (
                        <option key={r.roleId} value={r.roleId}>
                          {r.roleName}
                        </option>
                      ))}
                    </select>

                    {/* Animated arrow */}
                    <svg
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-transform duration-300 text-gray-500 w-4 h-4 ${
                        dropdownOpen ? "rotate-180" : "rotate-0"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </section>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
