"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { authService } from "@/services/authService";
import apiClient from "@/lib/apiClient";

// ==== Interface types ====
interface Role { roleId: string; roleName: string; }
interface ServiceCenter { id: string; name: string; }
interface VehicleCompany { id: string; name: string; }
interface UserInfo {
  userId: string;
  username: string;
  roleName: "emv_admin" | "service_center_manager" | "service_center_staff" | "emv_staff" | "parts_coordinator_company";
  serviceCenterId?: string;
  companyId?: string;
}
interface FormData {
  username: string; password: string; email: string; phone: string; address: string;
  name: string; employeeCode: string; roleId: string; serviceCenterId: string; vehicleCompanyId: string;
}

export function CreateUserAccount() {
  const currentUser = authService.getUserInfo() as UserInfo | null;
  const token = authService.getToken();

  const [formData, setFormData] = useState<FormData>({
    username:"", password:"", email:"", phone:"", address:"", name:"",
    employeeCode:"", roleId:"", serviceCenterId:"", vehicleCompanyId:""
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);
  const [vehicleCompanies, setVehicleCompanies] = useState<VehicleCompany[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingSC, setLoadingSC] = useState(true);
  const [loadingVC, setLoadingVC] = useState(true);
  const [loading, setLoading] = useState(false);

  // ==== Hardcoded roles for service_center_manager ====
  const managerRoles: Role[] = [
    { roleId: "uuid_staff_from_db", roleName: "Service Center Staff" },
    { roleId: "uuid_tech_from_db", roleName: "Technician" },
  ];

  // ==== Fetch roles (only for admin) ====
  useEffect(() => {
    if (!token || currentUser?.roleName !== "emv_admin") return;
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        const res = await apiClient.get("/roles", { headers: { Authorization: `Bearer ${token}` } });
        const mappedRoles: Role[] = res.data.data.map((r: any) => ({ roleId: r.id, roleName: r.name }));
        setRoles(mappedRoles);
      } catch (err) {
        console.error("❌ Failed to load roles:", err);
        toast.error("Unable to load roles.");
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, [currentUser?.roleName, token]);

  // ==== Fetch ServiceCenters & VehicleCompanies (admin only) ====
  useEffect(() => {
    if (!token || currentUser?.roleName !== "emv_admin") return;
    const fetchData = async () => {
      try {
        setLoadingSC(true); setLoadingVC(true);
        const [scRes, vcRes] = await Promise.all([
          apiClient.get("/serviceCenters", { headers: { Authorization: `Bearer ${token}` } }),
          apiClient.get("/vehicleCompanies", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setServiceCenters(scRes.data.data || []);
        setVehicleCompanies(vcRes.data.data || []);
      } catch (err) {
        console.error("❌ Failed to load SC/VC:", err);
        toast.error("Unable to load admin data.");
      } finally {
        setLoadingSC(false); setLoadingVC(false);
      }
    };
    fetchData();
  }, [currentUser?.roleName, token]);

  // ==== Handle input change ====
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (currentUser?.roleName === "emv_admin") {
      if (name === "serviceCenterId" && value) { setFormData(p => ({ ...p, serviceCenterId: value, vehicleCompanyId: "" })); return; }
      if (name === "vehicleCompanyId" && value) { setFormData(p => ({ ...p, vehicleCompanyId: value, serviceCenterId: "" })); return; }
    }
    setFormData(p => ({ ...p, [name]: value }));
  };

  // ==== Handle submit ====
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);

    try {
      if (!["emv_admin","service_center_manager"].includes(currentUser.roleName)) {
        toast.error("You do not have permission.");
        setLoading(false);
        return;
      }

      // ==== Build payload ====
      let payload: any = {
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
        // Important: do NOT send vehicleCompanyId
        delete payload.vehicleCompanyId;
      }

      if (currentUser.roleName === "emv_admin") {
        const hasSC = !!formData.serviceCenterId, hasVC = !!formData.vehicleCompanyId;
        if (hasSC && hasVC) { toast.error("Select only one: Service Center or Vehicle Company."); setLoading(false); return; }
        if (!hasSC && !hasVC) { toast.error("Please select Service Center or Vehicle Company."); setLoading(false); return; }
        if (hasSC) payload.serviceCenterId = formData.serviceCenterId;
        if (hasVC) payload.vehicleCompanyId = formData.vehicleCompanyId;
      }

      console.log("Payload to send:", payload); // Debug

      await apiClient.post("/auth/registerAccount", payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("✅ Account created successfully!");
      setFormData({ username:"", password:"", email:"", phone:"", address:"", name:"", employeeCode:"", roleId:"", serviceCenterId:"", vehicleCompanyId:"" });
    } catch (err: any) {
      console.error("❌ Failed to create account:", err);
      toast.error(err?.response?.data?.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return <div className="p-6 text-center text-gray-600">❌ You are not logged in</div>;
  if (!["emv_admin","service_center_manager"].includes(currentUser.roleName))
    return <div className="p-6 text-center text-gray-600">❌ You do not have permission to create an account</div>;

  const roleOptions = currentUser.roleName === "emv_admin" ? roles : managerRoles;

  return (
    <motion.div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg"
      initial={{opacity:0.3,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>
      <h2 className="text-2xl font-semibold mb-4 text-center">🧾 Create New Employee Account</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6 items-center">
          <input name="username" value={formData.username} onChange={handleChange} placeholder="Username" required className="border border-gray-300 p-2 rounded-lg w-full h-12 bg-white text-black placeholder-gray-500"/>
          <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" required className="border border-gray-300 p-2 rounded-lg w-full h-12 bg-white text-black placeholder-gray-500"/>
          <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="border border-gray-300 p-2 rounded-lg w-full h-12 bg-white text-black placeholder-gray-500"/>
          <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="border border-gray-300 p-2 rounded-lg w-full h-12 bg-white text-black placeholder-gray-500"/>
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="border border-gray-300 p-2 rounded-lg w-full h-12 bg-white text-black placeholder-gray-500"/>
          <input name="address" value={formData.address} onChange={handleChange} placeholder="Address" className="border border-gray-300 p-2 rounded-lg w-full h-12 bg-white text-black placeholder-gray-500"/>
          <input name="employeeCode" value={formData.employeeCode} onChange={handleChange} placeholder="Employee Code" required className="border border-gray-300 p-2 rounded-lg w-full h-12 bg-white text-black placeholder-gray-500"/>

          {/* Role select */}
          <select name="roleId" value={formData.roleId} onChange={handleChange} required className="bg-white text-black border border-gray-300 p-3 rounded-full w-full h-12 focus:outline-none">
            <option value="" disabled>{currentUser.roleName==="emv_admin" ? (loadingRoles?"Loading roles...":"Select role") : "Select role"}</option>
            {roleOptions.map(r => <option key={r.roleId} value={r.roleId}>{r.roleName}</option>)}
          </select>

          {/* Admin only */}
          {currentUser.roleName==="emv_admin" && (
            <>
              <p className="text-sm text-gray-600 italic col-span-2">🔹 Select only one: Service Center or Vehicle Company</p>
              <select name="serviceCenterId" value={formData.serviceCenterId} onChange={handleChange} className="bg-white text-black border border-gray-300 p-3 rounded-full w-full h-12 focus:outline-none">
                <option value="">{loadingSC?"Loading SC...":"Select Service Center"}</option>
                {serviceCenters.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
              </select>
              <select name="vehicleCompanyId" value={formData.vehicleCompanyId} onChange={handleChange} className="bg-white text-black border border-gray-300 p-3 rounded-full w-full h-12 focus:outline-none">
                <option value="">{loadingVC?"Loading VC...":"Select Vehicle Company"}</option>
                {vehicleCompanies.map(vc => <option key={vc.id} value={vc.id}>{vc.name}</option>)}
              </select>
            </>
          )}
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-full hover:bg-blue-700 transition-shadow shadow-sm disabled:opacity-60">
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </motion.div>
  );
}
