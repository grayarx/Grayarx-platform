import React from "react";
import AdminAutomationPanel from "@/components/AdminAutomationPanel";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect } from "wouter";

export function AdminAutomationPage() {
  const { user } = useAuth();

  // Check if user is admin
  if (!user || (user.role !== "admin" && user.role !== "founder")) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <AdminAutomationPanel />
    </div>
  );
}

export default AdminAutomationPage;
