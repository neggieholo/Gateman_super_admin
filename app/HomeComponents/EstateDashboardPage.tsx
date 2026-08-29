/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo } from "react";
import { AdminUser, EstateDetailedContext } from "../services/types";
import { useRouter } from "next/navigation";
import {
  deleteEstateAccount,
  getEstateDetailsContext,
  updateEstateStatus,
} from "../services/apis_estates";
import { useGatePassMetrics } from "../hooks/useGatePassMetrics";
import AdminUserDetailsPage from "./EstateAdminDetailsPage";
import GatePassesOverviewPage from "./GatePassesOverviewPage";
import CommunityPostsOverviewPage from "./CommunityPostsOverviewPage";
import ReportsOverviewPage from "./ReportsOverviewPage";
import ServicesOverviewPage from "./ServicesOverviewPage";
import ServiceRequestsOverviewPage from "./ServiceRequestsOverviewPage";
import EstateLocationsOverviewPage from "./EstateLocationsOverviewPage";
import LocationBookingsOverviewPage from "./LocationBookingsOverviewPage";
import SecurityActionWarningModal from "./SecurityActionWarningModal";
import { useUser } from "../UserContext";
import { showAccessDeniedToast } from "./ManageUsersPage";
import toast from "react-hot-toast";
import ResidentsOverviewPage from "./EstateResidents";
import SecurityPersonnelPage from "./EstateSecurity";
import { AdminListModal } from "./AdminListModal";
import { MessageSquare } from "lucide-react";
import { NotifyEstateModal } from "./NotifyEstateModal";
import PaymentLogsOverviewPage from "./PaymentLogsOverviewPage";

interface EstateDashboardPageProps {
  estateId: string;
  onBack?: () => void;
}

export default function EstateDashboardPage({
  estateId,
  onBack,
}: EstateDashboardPageProps) {
  const { user } = useUser();
  const router = useRouter();
  const [selectedEstate, setSelectedEstate] =
    useState<EstateDetailedContext | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"metrics" | "charts">("metrics");
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [isSuspending, setIsSuspending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [invitationsSelected, setInvitationsSelected] =
    useState<boolean>(false);
  const [postsSelected, setPostsSelected] = useState<boolean>(false);
  const [reportsSelected, setReportsSelected] = useState<boolean>(false);
  const [servicesSelected, setServicesSelected] = useState<boolean>(false);
  const [requestsSelected, setRequestsSelected] = useState<boolean>(false);
  const [venuesSelected, setVenuesSelected] = useState<boolean>(false);
  const [eventsSelected, setEventsSelected] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [residentsSelected, setResidentsSelected] = useState<boolean>(false);
  const [securitySelected, setSecuritySelected] = useState<boolean>(false);
  const [paymentsSelected, setPaymentsSelected] = useState<boolean>(false);
  const [messageModalOpen, setMessageModalOpen] = useState<boolean>(false);
  const [paymentFilter, setPaymentFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");
  const [adminListModalOpen, setIsAdminListModalOpen] =
    useState<boolean>(false);
  const savedScrollPositions = useRef<{ [key: string]: number }>({
    metrics: 0,
    charts: 0,
  });
  const canViewResidents =
    user?.permissions.includes("all-access") ||
    user?.permissions.includes("estates_management") ||
    user?.permissions.includes("view_estate_residents");

  const canViewSecurity =
    user?.permissions.includes("all-access") ||
    user?.permissions.includes("estates_management") ||
    user?.permissions.includes("view_estate_security");

  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [warningConfig, setWarningConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    variant: "warning" | "danger";
    onConfirm: () => Promise<void> | void;
  }>({
    title: "",
    message: "",
    confirmText: "",
    variant: "warning",
    onConfirm: () => {},
  });

  const handleToggleEstateStatus = async (
    estateId: string,
    targetStatus: "ACTIVE" | "SUSPENDED",
  ) => {
    const canToggleStatus =
      user?.permissions.includes("estates_management") ||
      user?.permissions.includes("modify_estate_status") ||
      user?.permissions.includes("all-access");

    if (!canToggleStatus) {
      showAccessDeniedToast();
      return;
    }
    try {
      setIsSuspending(true);

      const res = await updateEstateStatus(estateId, targetStatus);

      if (res.success) {
        handleEstateStatusUpdate(targetStatus);
      } else {
        toast.error(
          res.message ||
            "Failed to commit status update target configuration model.",
        );
      }
    } catch (err) {
      console.error("Component UI suspension pipeline exception thrown:", err);
      toast.error(
        "An unexpected infrastructure context tracking validation mismatch occurred.",
      );
    } finally {
      setIsSuspending(false);
    }
  };

  const triggerEstateStatusWarning = (
    estateId: string,
    estate_name: string,
    targetStatus: "ACTIVE" | "SUSPENDED",
  ) => {
    setWarningConfig({
      title: "Purge Admin Account Vector",
      message: `CRITICAL SUSPEND CHALLENGE: Are you completely certain you want to ${targetStatus === "SUSPENDED" ? "suspend" : "reactivate"} "${estate_name}'s" account?`,
      confirmText:
        targetStatus === "SUSPENDED" ? "Suspend Account" : "Activate Account",
      variant: "warning",
      onConfirm: async () => {
        await handleToggleEstateStatus(estateId, targetStatus);
      },
    });
    setIsWarningOpen(true);
  };

  const triggerEstateDeleteWarning = (
    estateId: string,
    estate_name: string,
  ) => {
    setWarningConfig({
      title: "Delete Estate Account",
      message: `CRITICAL DATA DELETION FORCE CHALLENGE: Are you completely certain you want to permanently purge "${estate_name}" from the GateMan core database? This action is absolute and cannot be undone.`,
      confirmText: "Delete Account",
      variant: "danger",
      onConfirm: async () => {
        await handleDeleteEstateAccount(estateId);
      },
    });
    setIsWarningOpen(true);
  };

  useEffect(() => {
    async function fetchEstateDetails() {
      try {
        setLoading(true);
        setError(null);
        const res = await getEstateDetailsContext(estateId);

        if (res.success && res.estate) {
          setSelectedEstate(res.estate);
        } else {
          throw new Error(
            "Failed to pull complete estate control desk metadata payload.",
          );
        }
      } catch (err: any) {
        setError(
          err.message || "An unexpected system reference error occurred",
        );
      } finally {
        setLoading(false);
      }
    }

    if (estateId) {
      fetchEstateDetails();
    }
  }, [estateId]);

  // const handleViewModeChange = (nextMode: "metrics" | "charts") => {
  //   if (scrollContainerRef.current) {
  //     // 1. Save the current view's scroll position
  //     savedScrollPositions.current[viewMode] =
  //       scrollContainerRef.current.scrollTop;
  //   }
  //   // 2. Flip the view mode state
  //   setViewMode(nextMode);
  // };

  useEffect(() => {
    if (scrollContainerRef.current) {
      // Pull the saved position for the incoming view (defaults to 0 if new)
      scrollContainerRef.current.scrollTop =
        savedScrollPositions.current[viewMode] || 0;
    }
  }, [viewMode]);

  // Optional: If you want status toggles on the detail page to update the parent list instantly
  const handleAdminStatusUpdate = (
    adminId: string,
    nextStatus: "ACTIVE" | "SUSPENDED",
  ) => {
    if (selectedAdmin && selectedAdmin.id === adminId) {
      setSelectedAdmin({ ...selectedAdmin, status: nextStatus });
    }

    setSelectedEstate((prevEstate) => {
      if (!prevEstate) return null;

      return {
        ...prevEstate,
        admins: prevEstate.admins
          ? { ...prevEstate.admins, status: nextStatus }
          : prevEstate.admins,
      };
    });
  };

  const handleEstateStatusUpdate = (nextStatus: "ACTIVE" | "SUSPENDED") => {
    setSelectedEstate((prevEstate) => {
      if (!prevEstate) return null;

      return {
        ...prevEstate,
        status: nextStatus,
      };
    });
  };

  const handleDeleteEstateAccount = async (id: string) => {
    const canDeleteEstate =
      user?.permissions.includes("estates_management") ||
      user?.permissions.includes("delete_estate") ||
      user?.permissions.includes("all-access");

    if (!canDeleteEstate) {
      showAccessDeniedToast();
      return;
    }
    try {
      setIsDeleting(true);

      const res = await deleteEstateAccount(id);

      if (res.success) {
        // handleEstateStatusUpdate(targetStatus);
      } else {
        toast.error(res.message || "Failed to purge estate account.");
      }
    } catch (err) {
      console.error("Component UI suspension pipeline exception thrown:", err);
      toast.error(
        "An unexpected infrastructure context tracking validation mismatch occurred.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const passMetrics = useGatePassMetrics(selectedEstate?.gatepasses);

  // 📊 COMPILING ENGAGEMENT METRICS (POSTS & COMMISSIONS)
  const totalPosts = selectedEstate?.posts?.length || 0;
  let totalLikes = 0;
  let totalComments = 0;

  selectedEstate?.posts?.forEach((post: any) => {
    totalLikes += parseInt(post.likes_count || 0, 10);
    totalComments += parseInt(post.comments_count || 0, 10);
  });

  // 🚨 COMPILING INCIDENT LOG MATRIX DATA
  const reportMetrics = {
    total: selectedEstate?.reports?.length || 0,
    payment: 0,
    security: 0,
    general: 0,
    services: 0,
    pending: 0,
    resolved: 0,
    reviewed: 0,
  };

  selectedEstate?.reports?.forEach((report: any) => {
    const type = (report.type || "").toUpperCase();
    if (type === "PAYMENT") reportMetrics.payment++;
    else if (type === "SECURITY") reportMetrics.security++;
    else if (type === "GENERAL") reportMetrics.general++;
    else if (type === "SERVICES") reportMetrics.services++;

    const status = (report.status || "").toUpperCase();
    if (status === "PENDING") reportMetrics.pending++;
    else if (status === "RESOLVED") reportMetrics.resolved++;
    else if (status === "REVIEWED") reportMetrics.reviewed++;
  });

  // 🛠️ COMPILING SERVICE UTILITIES & VENDOR CONFIGURATIONS
  const totalServices = selectedEstate?.services?.length || 0;
  let totalVendorsCount = 0;

  selectedEstate?.services?.forEach((service: any) => {
    if (Array.isArray(service.vendors)) {
      totalVendorsCount += service.vendors.length;
    }
  });

  // 🚏 COMPILING LIVE MAINTENANCE DISPATCH REQUEST PIPELINES
  const requestMetrics = {
    total: selectedEstate?.service_requests?.length || 0,
    dispatched: 0,
    pendingDispatch: 0,
    completed: 0,
  };

  selectedEstate?.service_requests?.forEach((req: any) => {
    if (req.is_completed === true) {
      requestMetrics.completed++;
    }
    if (req.is_dispatched === true) {
      requestMetrics.dispatched++;
    } else {
      requestMetrics.pendingDispatch++;
    }
  });

  // 🏢 COMPILING PHYSICAL VENUE INFRASTRUCTURE NODES & BOOKED DAYS
  const totalLocations = selectedEstate?.locations?.length || 0;
  let totalBookedDays = 0;

  selectedEstate?.locations?.forEach((loc: any) => {
    if (!loc.event_booked_on) return;
    try {
      let bookingData = loc.event_booked_on;
      if (typeof bookingData === "string") {
        bookingData = JSON.parse(bookingData);
      }
      Object.keys(bookingData).forEach((key) => {
        const eventBookingBlock = bookingData[key];
        if (eventBookingBlock && Array.isArray(eventBookingBlock.dates)) {
          totalBookedDays += eventBookingBlock.dates.length;
        }
      });
    } catch (e) {
      console.error(
        "Failed to parse venue event_booked_on JSON structural index:",
        e,
      );
    }
  });

  // 📅 COMPILING SCHEDULED ESTATE EVENTS & TICKET REVENUE PIPELINE
  const eventMetrics = {
    total: selectedEstate?.bookings?.length || 0,
    pending: 0,
    payment_pending: 0,
    payment_submitted: 0,
    approved: 0,
    rejected: 0,
    paidBookings: 0,
    totalRevenueTransacted: 0,
  };

  selectedEstate?.bookings?.forEach((ev: any) => {
    if (ev.status === "PENDING_APPROVAL") eventMetrics.pending++;
    if (ev.status === "PAYMENT_PENDING") eventMetrics.payment_pending++;
    if (ev.status === "PAYMENT_SUBMITTED") eventMetrics.payment_submitted++;
    if (ev.status === "REJECTED") eventMetrics.rejected++;
    if (ev.status === "REJECTED") eventMetrics.rejected++;
    if (ev.isPaid) eventMetrics.paidBookings++;
    eventMetrics.totalRevenueTransacted += ev.total_amount;
  });

  // 💳 COMPILING PAYMENT LOGS MATRIX & FINANCIAL SUMMARY
  // 1. Safe Helper Function
  const getPercentage = (count: number, total: number): string => {
    if (!total || total === 0) return "0%";
    const percentage = Math.round((count / total) * 100);
    return `${percentage}%`;
  };

  // 2. Global Metrics (For the Status Filter Button Percentages)
  const paymentMetrics = useMemo(() => {
    const logs = selectedEstate?.payment_logs || [];
    let pendingCount = 0;
    let verifiedCount = 0;
    let rejectedCount = 0;
    let totalAmount = 0;

    logs.forEach((log: any) => {
      const amount = parseFloat(log.amount || 0);
      totalAmount += amount;
      const status = (log.status || "").toUpperCase();

      if (status === "PENDING") {
        pendingCount++;
      } else if (
        status === "VERIFIED" ||
        status === "SUCCESS" ||
        status === "APPROVED"
      ) {
        verifiedCount++;
      } else if (status === "REJECTED" || status === "FAILED") {
        rejectedCount++;
      }
    });

    return {
      total: logs.length,
      totalAmount,
      pendingCount,
      verifiedCount,
      rejectedCount,
    };
  }, [selectedEstate?.payment_logs]);

  // 3. Filtered Category & Cashflow Data (Re-calculates whenever paymentFilter changes)
  const filteredPaymentData = useMemo(() => {
    const logs = selectedEstate?.payment_logs || [];

    // Filter logs based on active filter state
    const matchingLogs = logs.filter((log: any) => {
      if (paymentFilter === "ALL") return true;
      const status = (log.status || "").toUpperCase();
      if (paymentFilter === "PENDING") return status === "PENDING";
      if (paymentFilter === "APPROVED") {
        return (
          status === "VERIFIED" || status === "SUCCESS" || status === "APPROVED"
        );
      }
      if (paymentFilter === "REJECTED") {
        return status === "REJECTED" || status === "FAILED";
      }
      return true;
    });

    // Aggregate category counts and totals for matching status only
    let filteredTotalAmount = 0;
    const byCategory: Record<string, { count: number; totalAmount: number }> =
      {};

    matchingLogs.forEach((log: any) => {
      const amount = parseFloat(log.amount || 0);
      filteredTotalAmount += amount;

      const category = (log.category || "UNASSIGNED").toUpperCase();
      if (!byCategory[category]) {
        byCategory[category] = { count: 0, totalAmount: 0 };
      }
      byCategory[category].count++;
      byCategory[category].totalAmount += amount;
    });

    return {
      totalCount: matchingLogs.length,
      totalAmount: filteredTotalAmount,
      byCategory,
    };
  }, [selectedEstate?.payment_logs, paymentFilter]);

  const estateResdentsOrSecurity = (type: "resident" | "security") => {
    if (type === "resident") {
      if (!canViewResidents) return showAccessDeniedToast();
      setResidentsSelected(true);
    } else {
      if (!canViewSecurity) return showAccessDeniedToast();
      setSecuritySelected(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-fit my-auto mx-auto bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gm-navy mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !selectedEstate) {
    return (
      <div className="p-6 max-w-4xl mx-auto mt-10 bg-white rounded-2xl border border-red-100 shadow-sm text-center">
        <p className="text-sm font-bold text-red-600">
          Error Loading Estate Info
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {error || "No data records found for this asset node."}
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  if (selectedAdmin) {
    return (
      <AdminUserDetailsPage
        admin={selectedAdmin}
        estate={selectedEstate.estate}
        toggleAccess={handleAdminStatusUpdate}
        onBack={() => setSelectedAdmin(null)}
      />
    );
  }

  if (invitationsSelected) {
    return (
      <GatePassesOverviewPage
        passes={selectedEstate.gatepasses}
        estate_id={selectedEstate.id}
        estatename={selectedEstate.name}
        onBack={() => setInvitationsSelected(false)}
      />
    );
  }

  if (postsSelected) {
    return (
      <CommunityPostsOverviewPage
        posts={selectedEstate.posts}
        estate_id={selectedEstate.id}
        estatename={selectedEstate.name}
        onBack={() => setPostsSelected(false)}
      />
    );
  }

  if (reportsSelected) {
    return (
      <ReportsOverviewPage
        reports={selectedEstate.reports}
        estatename={selectedEstate.name}
        estateId={selectedEstate.id}
        onBack={() => setReportsSelected(false)}
      />
    );
  }

  if (servicesSelected) {
    return (
      <ServicesOverviewPage
        services={selectedEstate.services}
        estate_id={selectedEstate.id}
        estatename={selectedEstate.name}
        vendors={selectedEstate.vendors}
        onBack={() => setServicesSelected(false)}
      />
    );
  }

  if (requestsSelected) {
    return (
      <ServiceRequestsOverviewPage
        requests={selectedEstate.service_requests}
        services={selectedEstate.services}
        estate_id={selectedEstate.id}
        estatename={selectedEstate.name}
        vendors={selectedEstate.vendors}
        onBack={() => setRequestsSelected(false)}
      />
    );
  }

  if (venuesSelected) {
    return (
      <EstateLocationsOverviewPage
        locations={selectedEstate.locations}
        estatename={selectedEstate.name}
        onBack={() => setVenuesSelected(false)}
      />
    );
  }

  if (eventsSelected) {
    return (
      <LocationBookingsOverviewPage
        events={selectedEstate.bookings}
        estatename={selectedEstate.name}
        locations={selectedEstate.locations}
        onBack={() => setEventsSelected(false)}
      />
    );
  }

  if (residentsSelected) {
    return (
      <ResidentsOverviewPage
        estatename={selectedEstate.name}
        estateId={selectedEstate.id}
        onBack={() => setResidentsSelected(false)}
      />
    );
  }

  if (securitySelected) {
    return (
      <SecurityPersonnelPage
        estatename={selectedEstate.name}
        estateId={selectedEstate.id}
        onBack={() => setSecuritySelected(false)}
      />
    );
  }

  if (paymentsSelected) {
    return (
      <PaymentLogsOverviewPage
        estatename={selectedEstate.name}
        logs={selectedEstate.payment_logs}
        onBack={() => setPaymentsSelected(false)}
      />
    );
  }

  return (
    <div className="p-1 sm:p-6 bg-slate-50 overflow-hidden flex flex-col justify-between flex-1 min-h-0">
      <div
        ref={scrollContainerRef}
        className="space-y-6 overflow-y-auto flex-1 pr-1 w-full pb-4"
      >
        {/* Dashboard Header Bar */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <button
              onClick={onBack}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors mb-1.5 inline-flex items-center gap-1"
            >
              ← Back to Global Directory
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {selectedEstate.name} Control Desk
              </h2>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-md ${selectedEstate.status === "ACTIVE" ? "bg-indigo-50 text-indigo-700" : "bg-red-50 text-red-700"}`}
              >
                {selectedEstate.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedEstate.lga}, {selectedEstate.state} State
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setMessageModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Notify
            </button>
            <button
              onClick={() =>
                triggerEstateStatusWarning(
                  selectedEstate.id,
                  selectedEstate.name,
                  selectedEstate.status,
                )
              }
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${selectedEstate.status === "ACTIVE" ? "bg-slate-100 text-red-600 hover:bg-slate-200" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
            >
              {selectedEstate.status === "ACTIVE"
                ? "Suspend Estate"
                : "Activate Estate"}
            </button>
            <button
              onClick={() =>
                triggerEstateDeleteWarning(
                  selectedEstate.id,
                  selectedEstate.name,
                )
              }
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Delete Account
            </button>
          </div>
        </div>

        <>
          {/* High-Level Analytics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Code
              </p>
              <p className="text-xl font-black text-slate-900 mt-1 font-mono">
                {selectedEstate.estate_code}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Residents (Active 30d)
              </p>
              <p className="text-xl font-black text-indigo-600 mt-1">
                {selectedEstate.active_residents_30_days}{" "}
                <span className="text-xs font-medium text-slate-400">
                  / {selectedEstate.total_residents} total
                </span>
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Guards
              </p>
              <p className="text-xl font-black text-emerald-600 mt-1">
                {selectedEstate.guards_on_duty}{" "}
                <span className="text-xs font-medium text-slate-400">
                  On Duty ({selectedEstate.total_guards})
                </span>
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Onboarding Date
              </p>
              <p className="text-xl font-black text-slate-700 mt-1">
                {selectedEstate.joined_date
                  ? new Date(selectedEstate.joined_date).toLocaleDateString(
                      "en-GB",
                    )
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* ─── ROW 1: ADMINISTRATORS & ACCESS GATES PASSES ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <div>
                <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Estate Administrators
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Personnels in charge of Estate management
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-900 font-mono">
                      {selectedEstate.admins?.length || 0}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Total Admins
                    </p>
                  </div>
                </div>
                <div className="space-y-2 max-h-40 mb-4">
                  {!selectedEstate.admins ||
                  selectedEstate.admins.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 italic">
                      No administrators provisioned.
                    </p>
                  ) : (
                    <div className="space-y-4 mb-4">
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                        {(() => {
                          // Find the root admin object from the admins array
                          const rootAdmin = (selectedEstate.admins || []).find(
                            (a: AdminUser) =>
                              a.email === selectedEstate.root_admin_email,
                          );

                          return (
                            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              {rootAdmin ? (
                                <>
                                  {/* Circular Badge with Root Admin's Initial */}
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs ring-2 ring-white shadow-sm flex-shrink-0">
                                    {rootAdmin.name
                                      ? rootAdmin.name.charAt(0).toUpperCase()
                                      : "R"}
                                  </div>

                                  {/* Root Admin Name and Email Details */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-bold text-slate-800 truncate">
                                        {rootAdmin.name}
                                      </p>
                                      <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase">
                                        Root
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 truncate">
                                      {rootAdmin.email}
                                    </p>
                                  </div>
                                </>
                              ) : (
                                /* Fallback if root admin isn't found in array */
                                <div className="text-xs text-slate-400 font-medium py-1">
                                  Root Admin:{" "}
                                  {selectedEstate.root_admin_email ||
                                    "Not designated"}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Status Metrics Grid */}
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100/50">
                          <p className="text-[9px] font-black text-emerald-600 uppercase">
                            Active
                          </p>
                          <p className="text-sm font-black text-emerald-700 font-mono">
                            {
                              selectedEstate.admins.filter(
                                (a: AdminUser) => a.status === "ACTIVE",
                              ).length
                            }
                          </p>
                        </div>
                        <div className="bg-rose-50/60 p-2 rounded-xl border border-rose-100/50">
                          <p className="text-[9px] font-black text-rose-600 uppercase">
                            Suspended
                          </p>
                          <p className="text-sm font-black text-rose-700 font-mono">
                            {
                              selectedEstate.admins.filter(
                                (a: AdminUser) => a.status === "SUSPENDED",
                              ).length
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  if (
                    selectedEstate.admins &&
                    selectedEstate.admins.length > 0
                  ) {
                    setIsAdminListModalOpen(true);
                  }
                }}
                disabled={
                  !selectedEstate.admins || selectedEstate.admins.length === 0
                }
                className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-100 rounded-xl text-xs font-bold text-indigo-600 transition-colors mt-2"
              >
                See All Administrators →
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md flex flex-col justify-between transition-all">
              <div>
                {/* Header & Expiry Status */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                        Plan & Subscription
                      </h3>

                      {/* Dynamic Status Pill */}
                      {selectedEstate?.estate?.plan?.is_trial ? (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-black px-2.5 py-1 rounded-full border border-amber-200/70 tracking-wide uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Free Trial
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full border border-emerald-200/70 uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-slate-500">
                      Tier:{" "}
                      <span className="font-bold text-slate-800">
                        {selectedEstate?.estate?.plan?.is_trial
                          ? "Trial Tier"
                          : "Standard Tier"}
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900 font-mono tracking-tight">
                      {selectedEstate?.estate?.subscription_expiry
                        ? new Date(
                            selectedEstate.estate.subscription_expiry,
                          ).toLocaleDateString("en-GB")
                        : "N/A"}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                      {selectedEstate?.estate?.plan?.is_trial
                        ? "Trial End Date"
                        : "Expiration Date"}
                    </p>
                  </div>
                </div>

                {/* Trial Banner Alert */}
                {selectedEstate?.estate?.plan?.is_trial && (
                  <div className="mb-5 p-3.5 bg-linear-to-r from-amber-50 to-amber-100/40 border border-amber-200/80 rounded-2xl flex items-center justify-between shadow-xs">
                    <span className="text-xs font-semibold text-amber-900">
                      This estate is currently provisioned on a{" "}
                      <strong>Free Trial</strong>.
                    </span>
                    <span className="text-xs font-extrabold text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded-lg border border-amber-300/40 shadow-xs">
                      Demo Mode
                    </span>
                  </div>
                )}

                {/* Module Allocations Grid */}
                <div className="space-y-5 mb-5">
                  {/* Core Base Modules */}
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
                      Core Included Modules
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Dashboard & Analytics",
                        "System Users & Access Control",
                        "Resident Management",
                      ].map((moduleName, idx) => (
                        <span
                          key={idx}
                          className="bg-indigo-50/70 text-indigo-700 border border-indigo-100 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs"
                        >
                          ✓ {moduleName}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Selected Add-ons */}
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
                      Provisioned Add-ons
                    </p>
                    {!selectedEstate?.estate?.plan?.selected_add_ons ||
                    selectedEstate.estate.plan.selected_add_ons.length === 0 ? (
                      <p className="text-xs text-slate-400 italic bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                        No active add-on modules attached to this tier.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedEstate.estate.plan.selected_add_ons.map(
                          (addon: string, idx: number) => (
                            <span
                              key={idx}
                              className="bg-slate-100/80 text-slate-800 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs"
                            >
                              + {addon}
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* History Action Trigger */}
              <button
                onClick={() => {
                  router.push(
                    `/home/billing?search_name=${selectedEstate.estate.name}`,
                  );
                }}
                className="w-full text-center py-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-200 rounded-2xl text-xs font-extrabold text-indigo-600 transition-all duration-200 group flex items-center justify-center gap-1.5 mt-2"
              >
                <span>View Subscription History</span>
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>
          </div>

          {/* ─── ROW 2: ENGAGEMENT & REVIEWS (POSTS & REPORTS COMPILATION) ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Broadcast Communications
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Public notifications and announcement analytics.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-900 font-mono">
                      {totalPosts}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Total Posts
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                      Total Likes Linked
                    </p>
                    <p className="text-xl font-black text-indigo-600 font-mono mt-0.5">
                      {totalLikes}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                      Total Feed Comments
                    </p>
                    <p className="text-xl font-black text-indigo-600 font-mono mt-0.5">
                      {totalComments}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (selectedEstate.posts) {
                    setPostsSelected(true);
                  }
                }}
                className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs font-bold text-indigo-600 transition-colors"
              >
                Manage Notice Board →
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Incident Report Logs
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Emergency panic triggers and site issues triage.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-red-600 font-mono">
                      {reportMetrics.total}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Total Filed
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Categorization Metrics
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <p className="text-[9px] font-medium text-slate-500">
                          Security
                        </p>
                        <p className="text-sm font-black text-slate-800 font-mono">
                          {reportMetrics.security}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <p className="text-[9px] font-medium text-slate-500">
                          Payment
                        </p>
                        <p className="text-sm font-black text-slate-800 font-mono">
                          {reportMetrics.payment}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <p className="text-[9px] font-medium text-slate-500">
                          Services
                        </p>
                        <p className="text-sm font-black text-slate-800 font-mono">
                          {reportMetrics.services}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <p className="text-[9px] font-medium text-slate-500">
                          Residential
                        </p>
                        <p className="text-sm font-black text-slate-800 font-mono">
                          {reportMetrics.general}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Triage Processing Status
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-rose-50/60 p-2 rounded-xl text-center border border-rose-100/50">
                        <p className="text-[9px] font-black text-rose-600 uppercase">
                          Pending
                        </p>
                        <p className="text-sm font-black text-rose-700 font-mono">
                          {reportMetrics.pending}
                        </p>
                      </div>
                      <div className="bg-amber-50/60 p-2 rounded-xl text-center border border-amber-100/50">
                        <p className="text-[9px] font-black text-amber-600 uppercase">
                          Reviewed
                        </p>
                        <p className="text-sm font-black text-amber-700 font-mono">
                          {reportMetrics.reviewed}
                        </p>
                      </div>
                      <div className="bg-emerald-50/60 p-2 rounded-xl text-center border border-emerald-100/50">
                        <p className="text-[9px] font-black text-emerald-600 uppercase">
                          Resolved
                        </p>
                        <p className="text-sm font-black text-emerald-700 font-mono">
                          {reportMetrics.resolved}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (selectedEstate.reports) {
                    setReportsSelected(true);
                  }
                }}
                className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs font-bold text-indigo-600 transition-colors"
              >
                Triage Control Desk →
              </button>
            </div>
          </div>

          {/* ─── ROW 3: DISPATCH MATRICES (SERVICES & REQUESTS TRACKER) ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Approved Vendor Catalogs
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Active utility modules and registered services setup.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-900 font-mono">
                      {totalServices}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Active Services
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 mb-4">
                  <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100/40 text-center">
                    <p className="text-[10px] font-bold text-sky-600 uppercase tracking-tight">
                      Total Onboarded Vendors
                    </p>
                    <p className="text-2xl font-black text-sky-800 font-mono mt-1">
                      {totalVendorsCount}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (selectedEstate.services) {
                    setServicesSelected(true);
                  }
                }}
                className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs font-bold text-indigo-600 transition-colors"
              >
                Configure Vendors List →
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Service Requests
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Live service orders tracking metrics.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-900 font-mono">
                      {requestMetrics.total}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Total Pipelines
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100/50 text-center">
                    <p className="text-[9px] font-bold text-amber-600 uppercase tracking-tight">
                      Pending Dispatch
                    </p>
                    <p className="text-base font-black text-amber-700 font-mono mt-0.5">
                      {requestMetrics.pendingDispatch}
                    </p>
                  </div>
                  <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/40 text-center">
                    <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-tight">
                      Dispatched
                    </p>
                    <p className="text-base font-black text-indigo-700 font-mono mt-0.5">
                      {requestMetrics.dispatched}
                    </p>
                  </div>
                  <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/50 text-center">
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-tight">
                      Completed
                    </p>
                    <p className="text-base font-black text-emerald-700 font-mono mt-0.5">
                      {requestMetrics.completed}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (selectedEstate.service_requests) {
                    setRequestsSelected(true);
                  }
                }}
                className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs font-bold text-indigo-600 transition-colors"
              >
                See Dispatch Ledger →
              </button>
            </div>
          </div>

          {/* ─── ROW 5: AND PAYMENT ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Infrastructure Facilities
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Configured venue locations and reservations metrics.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-900 font-mono">
                      {totalLocations}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Total Venues
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 mb-4">
                  <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100/40 text-center">
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-tight">
                      Accumulated Calendar Days Booked
                    </p>
                    <p className="text-2xl font-black text-purple-800 font-mono mt-1">
                      {totalBookedDays} Days
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (selectedEstate.locations) {
                    setVenuesSelected(true);
                  }
                }}
                className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs font-bold text-indigo-600 transition-colors"
              >
                Manage Facility Hub →
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Scheduled Facilty Bookings
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Town halls or location bookings,.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-900 font-mono">
                      {eventMetrics.total}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Total Events
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">
                        Total Bookings
                      </p>
                      <p className="text-base font-black text-slate-800 font-mono mt-0.5">
                        {eventMetrics.total}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Pending */}
                    <div className="bg-amber-50/60 p-2.5 rounded-xl text-center border border-amber-100/50">
                      <p className="text-[9px] font-black text-amber-600 uppercase tracking-wider">
                        Pending
                      </p>
                      <p className="text-sm font-black text-amber-700 font-mono mt-0.5">
                        {eventMetrics.pending}
                      </p>
                    </div>

                    {/* Payment Pending */}
                    <div className="bg-sky-50/60 p-2.5 rounded-xl text-center border border-sky-100/50">
                      <p className="text-[9px] font-black text-sky-600 uppercase tracking-wider">
                        Payment Pending
                      </p>
                      <p className="text-sm font-black text-sky-700 font-mono mt-0.5">
                        {eventMetrics.payment_pending}
                      </p>
                    </div>

                    {/* Payment Submitted / Approved */}
                    <div className="bg-emerald-50/60 p-2.5 rounded-xl text-center border border-emerald-100/50">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">
                        Approved
                      </p>
                      <p className="text-sm font-black text-emerald-700 font-mono mt-0.5">
                        {eventMetrics.approved}
                      </p>
                    </div>

                    {/* Rejected */}
                    <div className="bg-rose-50/60 p-2.5 rounded-xl text-center border border-rose-100/50">
                      <p className="text-[9px] font-black text-rose-600 uppercase tracking-wider">
                        Rejected
                      </p>
                      <p className="text-sm font-black text-rose-700 font-mono mt-0.5">
                        {eventMetrics.rejected}
                      </p>
                    </div>
                  </div>

                  <div className="bg-emerald-50/30 p-2.5 rounded-xl border border-emerald-100/40 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">
                        Paid Programs
                      </p>
                      <p className="text-xs font-black text-slate-700 font-mono">
                        {eventMetrics.paidBookings} Paid Reservations
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-emerald-600 uppercase">
                        Total Transacted Revenue
                      </p>
                      <p className="text-sm font-black text-emerald-700 font-mono">
                        ₦
                        {eventMetrics.totalRevenueTransacted.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (selectedEstate.bookings) {
                    setEventsSelected(true);
                  }
                }}
                className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs font-bold text-indigo-600 transition-colors"
              >
                Open Bookings Desk →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ─── ROW: SYSTEM SUBSCRIPTION & ADD-ON MODULES CONTROL ─── */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Gate Access Passes
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Recent GatePass Stats
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-900 font-mono">
                      {passMetrics.total}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Total Issued
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  <div className="bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/40 text-center">
                    <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-tight">
                      Pending
                    </p>
                    <p className="text-base font-black text-indigo-700 font-mono">
                      {passMetrics.pending}
                    </p>
                  </div>
                  <div className="bg-amber-50/60 p-2 rounded-xl border border-amber-100 text-center">
                    <p className="text-[9px] font-bold text-amber-600 uppercase tracking-tight">
                      Upcoming
                    </p>
                    <p className="text-base font-black text-amber-700 font-mono">
                      {passMetrics.upcoming}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                      Expired/Unused
                    </p>
                    <p className="text-base font-black text-slate-600 font-mono">
                      {passMetrics.expiredUnused}
                    </p>
                  </div>
                  <div className="bg-rose-50 p-2 rounded-xl border border-rose-100 text-center">
                    <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tight">
                      Cancelled
                    </p>
                    <p className="text-base font-black text-rose-600 font-mono">
                      {passMetrics.cancelled}
                    </p>
                  </div>
                  <div className="bg-red-50 p-2 rounded-xl border border-red-100 text-center">
                    <p className="text-[9px] font-bold text-red-500 uppercase tracking-tight">
                      Overstayed
                    </p>
                    <p className="text-base font-black text-red-600 font-mono">
                      {passMetrics.overstayed}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded-xl border border-purple-100 text-center">
                    <p className="text-[9px] font-bold text-purple-600 uppercase tracking-tight">
                      Is Staff
                    </p>
                    <p className="text-base font-black text-purple-700 font-mono">
                      {passMetrics.isStaff}
                    </p>
                  </div>
                  <div className="bg-sky-50 p-2 rounded-xl border border-sky-100 text-center">
                    <p className="text-[9px] font-bold text-sky-600 uppercase tracking-tight">
                      Multi-Entry
                    </p>
                    <p className="text-base font-black text-sky-700 font-mono">
                      {passMetrics.isMultiEntry}
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100 text-center">
                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-tight">
                      Used Success
                    </p>
                    <p className="text-base font-black text-emerald-700 font-mono">
                      {passMetrics.usedGoodTime}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (selectedEstate.gatepasses) {
                    setInvitationsSelected(true);
                  }
                }}
                className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs font-bold text-indigo-600 transition-colors"
              >
                See Details →
              </button>
            </div>

            {/* ─── PAYMENT LOGS & FINANCIAL SUMMARY ─── */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-100">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">
                      Payment Category Breakdown Graph
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Visual financial distribution across payment
                      classifications.
                    </p>
                  </div>

                  {/* Status Filter Strip */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                    <button
                      onClick={() => setPaymentFilter("ALL")}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        paymentFilter === "ALL"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setPaymentFilter("PENDING")}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        paymentFilter === "PENDING"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "text-slate-500 hover:text-amber-600"
                      }`}
                    >
                      Pending (
                      {getPercentage(
                        paymentMetrics.pendingCount,
                        paymentMetrics.total,
                      )}
                      )
                    </button>
                    <button
                      onClick={() => setPaymentFilter("APPROVED")}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        paymentFilter === "APPROVED"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-emerald-600"
                      }`}
                    >
                      Approved (
                      {getPercentage(
                        paymentMetrics.verifiedCount,
                        paymentMetrics.total,
                      )}
                      )
                    </button>
                    <button
                      onClick={() => setPaymentFilter("REJECTED")}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        paymentFilter === "REJECTED"
                          ? "bg-rose-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-rose-600"
                      }`}
                    >
                      Rejected (
                      {getPercentage(
                        paymentMetrics.rejectedCount,
                        paymentMetrics.total,
                      )}
                      )
                    </button>
                  </div>
                </div>

                {/* Category Progress Bars */}
                <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1 mt-2">
                  {Object.keys(filteredPaymentData.byCategory).length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium py-6 text-center">
                      No{" "}
                      {paymentFilter !== "ALL"
                        ? paymentFilter.toLowerCase()
                        : ""}{" "}
                      payments logged for this estate.
                    </p>
                  ) : (
                    Object.entries(filteredPaymentData.byCategory).map(
                      ([category, data], idx) => {
                        // Calculates category count against total logs in current filter
                        const categoryPercentage = getPercentage(
                          data.count,
                          filteredPaymentData.totalCount,
                        );

                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                                {category} ({categoryPercentage})
                              </span>
                              <span className="font-mono text-slate-500">
                                ₦{data.totalAmount.toLocaleString()} (
                                {data.count} log{data.count === 1 ? "" : "s"})
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-600 transition-all duration-500"
                                style={{ width: categoryPercentage }}
                              />
                            </div>
                          </div>
                        );
                      },
                    )
                  )}
                </div>
              </div>

              {/* Financial Ledger Aggregation Summary Banner */}
              <div className="bg-emerald-900 text-white rounded-xl p-4 mt-6 flex justify-between items-center shadow-md">
                <div>
                  <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
                    Filtered Payment Logs
                  </p>
                  <p className="text-sm font-black mt-0.5 font-mono">
                    {paymentFilter} Status Filter
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
                    Aggregated Cash Flow Ledger
                  </p>
                  <p className="text-xl font-black text-emerald-100 font-mono">
                    ₦
                    {filteredPaymentData.totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (selectedEstate.payment_logs) {
                    console.log("Payment logs button clicked");
                    setPaymentsSelected(true);
                  }
                }}
                className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs font-bold text-indigo-600 transition-colors mt-2"
              >
                See All Payment Logs →
              </button>
            </div>
          </div>
        </>
      </div>

      {/* ─── BOTTOM ADMINISTRATIVE ACTIONS BAR ─── */}
      {(canViewResidents || canViewSecurity) && (
        <div className="mt-8 max-w-7xl mx-auto w-full pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-end items-center gap-3">
          {canViewResidents && (
            <button
              onClick={() => estateResdentsOrSecurity("resident")}
              className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              👥 View Residents Info
            </button>
          )}

          {canViewSecurity && (
            <button
              onClick={() => estateResdentsOrSecurity("security")}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              🛡️ View Security Info
            </button>
          )}
        </div>
      )}
      <SecurityActionWarningModal
        isOpen={isWarningOpen}
        onClose={() => setIsWarningOpen(false)}
        title={warningConfig.title}
        message={warningConfig.message}
        confirmText={warningConfig.confirmText}
        variant={warningConfig.variant}
        onConfirm={warningConfig.onConfirm}
      />
      <AdminListModal
        isOpen={adminListModalOpen}
        onClose={() => setIsAdminListModalOpen(false)}
        admins={selectedEstate.admins}
        onSelectAdmin={(admin) => {
          setSelectedAdmin(admin);
          setIsAdminListModalOpen(false); // Close modal on selecting specific admin
        }}
      />
      <NotifyEstateModal
        isOpen={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        estate={{ id: selectedEstate.id, name: selectedEstate.estate.name }}
      />
    </div>
  );
}
