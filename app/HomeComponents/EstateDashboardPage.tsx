/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  AdminUser,
  EstateDetailedContext,
} from "../services/types";
import { getEstateDetailsContext } from "../services/apis_estates";
import { useGatePassMetrics } from "../hooks/useGatePassMetrics";
import { getRelativeTime } from "../services/apis";
import AdminUserDetailsPage from "./EstateAdminDetailsPage";
import GatePassesOverviewPage from "./GatePassesOverviewPage";
import CommunityPostsOverviewPage from "./CommunityPostsOverviewPage";
import ReportsOverviewPage from "./ReportsOverviewPage";
import ServicesOverviewPage from "./ServicesOverviewPage";
import ServiceRequestsOverviewPage from "./ServiceRequestsOverviewPage";
import EstateLocationsOverviewPage from "./EstateLocationsOverviewPage";
import EstateEventsOverviewPage from "./EstateEventsOverviewPage";

interface EstateDashboardPageProps {
  estateId: string;
  onBack?: () => void;
}

export default function EstateDashboardPage({
  estateId,
  onBack,
}: EstateDashboardPageProps) {
  const [selectedEstate, setSelectedEstate] =
    useState<EstateDetailedContext | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"metrics" | "charts">("metrics");
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [invitationsSelected, setInvitationsSelected] =
    useState<boolean>(false);
  const [postsSelected, setPostsSelected] = useState<boolean>(false);
  const [reportsSelected, setReportsSelected] = useState<boolean>(false);
  const [servicesSelected, setServicesSelected] = useState<boolean>(false);
  const [requestsSelected, setRequestsSelected] = useState<boolean>(false);
  const [venuesSelected, setVenuesSelected] = useState<boolean>(false);
  const [eventsSelected, setEventsSelected] = useState<boolean>(false);

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
        admin: prevEstate.admin
          ? { ...prevEstate.admin, status: nextStatus }
          : prevEstate.admin,
      };
    });
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
    total: selectedEstate?.events?.length || 0,
    paidEvents: 0,
    totalRevenueTransacted: 0,
    approved: 0,
    rejected: 0,
    totalExpectedGuests: 0,
    totalRegisteredGuests: 0,
  };

  selectedEstate?.events?.forEach((ev: any) => {
    if (ev.is_approved === true) eventMetrics.approved++;
    if (ev.is_rejected === true) eventMetrics.rejected++;

    eventMetrics.totalExpectedGuests += parseInt(
      ev.expected_guests || ev._expected_guests || 0,
      10,
    );
    eventMetrics.totalRegisteredGuests += parseInt(
      ev.registered_guests || 0,
      10,
    );

    if (ev.is_paid === true) {
      eventMetrics.paidEvents++;
      const guestsCount = parseInt(ev.registered_guests || 0, 10);
      const ticketPrice = parseFloat(ev.ticket_price || 0);
      eventMetrics.totalRevenueTransacted += guestsCount * ticketPrice;
    }
  });

  // Helper macro helper to calculate clean inline width bars percentage metrics without blowing layout boundaries
  const getPercentage = (value: number, total: number) => {
    if (!total || total === 0) return "0%";
    return `${Math.min(100, Math.round((value / total) * 100))}%`;
  };

  const toggleSuspension = (id: string, currentStatus: string) => {
    console.log(
      `Toggling suspension for ${id}. Current status: ${currentStatus}`,
    );
  };

  const handleLockdown = (id: string, name: string) => {
    console.log(`🚨 EMERGENCY LOCKDOWN TRIGGERED FOR: ${name} (${id})`);
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
        estatename={selectedEstate.name}
        onBack={() => setInvitationsSelected(false)}
      />
    );
  }

  if (postsSelected) {
    return (
      <CommunityPostsOverviewPage
        posts={selectedEstate.posts}
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
      <EstateEventsOverviewPage
        events={selectedEstate.events}
        estatename={selectedEstate.name}
        locations={selectedEstate.locations}
        onBack={() => setEventsSelected(false)}
      />
    );
  }

  return (
    <div className="p-1 sm:p-6 bg-slate-50 overflow-hidden flex flex-col justify-between flex-1 min-h-0">
      <div className="space-y-6 overflow-y-auto flex-1 pr-1 w-full pb-4">
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
            <div className="bg-slate-100 p-1 rounded-xl flex items-center mr-2">
              <button
                onClick={() => setViewMode("metrics")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "metrics" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                Metrics
              </button>
              <button
                onClick={() => setViewMode("charts")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "charts" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                📊 Charts View
              </button>
            </div>
            <button
              onClick={() =>
                toggleSuspension(selectedEstate.id, selectedEstate.status)
              }
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${selectedEstate.status === "ACTIVE" ? "bg-slate-100 text-red-600 hover:bg-slate-200" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
            >
              {selectedEstate.status === "ACTIVE"
                ? "Suspend Estate"
                : "Activate Estate"}
            </button>
            <button
              onClick={() =>
                handleLockdown(selectedEstate.id, selectedEstate.name)
              }
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* ─── CHARTS VIEW SCREEN MODAL INTERACTION LAYOUT ─── */}
        {viewMode === "charts" ? (
          <div className="space-y-6 animate-fadeIn">
            {/* Visual Grid Segment Row 1: Access Pass Distribution & Incident Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GatePass Analytical Bar Chart Block */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">
                  Gate Pass Breakdown Graph
                </h3>
                <p className="text-[11px] text-slate-400 mb-6">
                  Visual volume tracking across pass classifications.
                </p>
                <div className="space-y-3.5">
                  {[
                    {
                      label: "Pending Access",
                      count: passMetrics.pending,
                      color: "bg-indigo-600",
                    },
                    {
                      label: "Upcoming Bookings",
                      count: passMetrics.upcoming,
                      color: "bg-amber-500",
                    },
                    {
                      label: "Expired/Unused passes",
                      count: passMetrics.expiredUnused,
                      color: "bg-slate-400",
                    },
                    {
                      label: "Cancelled Passes",
                      count: passMetrics.cancelled,
                      color: "bg-rose-500",
                    },
                    {
                      label: "Overstayed Guards Tracking",
                      count: passMetrics.overstayed,
                      color: "bg-red-600",
                    },
                    {
                      label: "Staff Passes Assigned",
                      count: passMetrics.isStaff,
                      color: "bg-purple-600",
                    },
                    {
                      label: "Multi-Entry Passes Active",
                      count: passMetrics.isMultiEntry,
                      color: "bg-sky-500",
                    },
                    {
                      label: "Successful Validations",
                      count: passMetrics.usedGoodTime,
                      color: "bg-emerald-500",
                    },
                  ].map((bar, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-700">
                          {bar.label}
                        </span>
                        <span className="font-mono text-slate-500">
                          {bar.count} (
                          {getPercentage(bar.count, passMetrics.total)})
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${bar.color} transition-all duration-500`}
                          style={{
                            width: getPercentage(bar.count, passMetrics.total),
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incidents Report Logs Category Distribution Matrix */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">
                    Incident Allocation Index
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-6">
                    Distribution mapping of reported panics or utility tickets.
                  </p>

                  {/* Visual Split Stack Tracker Bar */}
                  <div className="w-full h-7 rounded-xl flex overflow-hidden mb-6 shadow-inner">
                    <div
                      className="bg-red-500 h-full transition-all"
                      style={{
                        width: getPercentage(
                          reportMetrics.security,
                          reportMetrics.total,
                        ),
                      }}
                      title="Security"
                    />
                    <div
                      className="bg-amber-500 h-full transition-all"
                      style={{
                        width: getPercentage(
                          reportMetrics.payment,
                          reportMetrics.total,
                        ),
                      }}
                      title="Payment"
                    />
                    <div
                      className="bg-sky-500 h-full transition-all"
                      style={{
                        width: getPercentage(
                          reportMetrics.services,
                          reportMetrics.total,
                        ),
                      }}
                      title="Services"
                    />
                    <div
                      className="bg-slate-400 h-full transition-all"
                      style={{
                        width: getPercentage(
                          reportMetrics.general,
                          reportMetrics.total,
                        ),
                      }}
                      title="Residential"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-slate-100 p-3 rounded-xl flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Security
                        </p>
                        <p className="text-lg font-black text-slate-800 font-mono">
                          {reportMetrics.security}
                        </p>
                      </div>
                    </div>
                    <div className="border border-slate-100 p-3 rounded-xl flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Payment
                        </p>
                        <p className="text-lg font-black text-slate-800 font-mono">
                          {reportMetrics.payment}
                        </p>
                      </div>
                    </div>
                    <div className="border border-slate-100 p-3 rounded-xl flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-sky-500 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Services
                        </p>
                        <p className="text-lg font-black text-slate-800 font-mono">
                          {reportMetrics.services}
                        </p>
                      </div>
                    </div>
                    <div className="border border-slate-100 p-3 rounded-xl flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-slate-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Residential
                        </p>
                        <p className="text-lg font-black text-slate-800 font-mono">
                          {reportMetrics.general}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Triage processing metrics progress lines subheader */}
                <div className="border-t border-slate-100 pt-4 mt-6 space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Triage Completion Efficiency
                  </p>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                    <span className="text-rose-600 font-mono">
                      Pending: {reportMetrics.pending}
                    </span>
                    <span className="text-amber-600 font-mono">
                      Reviewed: {reportMetrics.reviewed}
                    </span>
                    <span className="text-emerald-600 font-mono">
                      Resolved: {reportMetrics.resolved}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-rose-500"
                      style={{
                        width: getPercentage(
                          reportMetrics.pending,
                          reportMetrics.total,
                        ),
                      }}
                    ></div>
                    <div
                      className="bg-amber-500"
                      style={{
                        width: getPercentage(
                          reportMetrics.reviewed,
                          reportMetrics.total,
                        ),
                      }}
                    ></div>
                    <div
                      className="bg-emerald-500"
                      style={{
                        width: getPercentage(
                          reportMetrics.resolved,
                          reportMetrics.total,
                        ),
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Grid Segment Row 2: Dispatch Pipes & Program Ledgers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Maintenance Request Funnel Diagram */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">
                    Maintenance Funnel pipeline
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-6">
                    Workflow load metrics tracking residential deployments.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                        <span>Awaiting Vendor Assignment</span>
                        <span className="font-mono">
                          {requestMetrics.pendingDispatch} Requests
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-xl overflow-hidden">
                        <div
                          className="bg-amber-500 h-full"
                          style={{
                            width: getPercentage(
                              requestMetrics.pendingDispatch,
                              requestMetrics.total,
                            ),
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                        <span>Active Enroute/Dispatched Jobs</span>
                        <span className="font-mono">
                          {requestMetrics.dispatched} Workers Active
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-xl overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full"
                          style={{
                            width: getPercentage(
                              requestMetrics.dispatched,
                              requestMetrics.total,
                            ),
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                        <span>Completed Resolution Orders</span>
                        <span className="font-mono">
                          {requestMetrics.completed} Resolved
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-xl overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{
                            width: getPercentage(
                              requestMetrics.completed,
                              requestMetrics.total,
                            ),
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 flex justify-center mt-6 text-center text-xs border border-slate-100">
                  <div className="px-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Total Services
                    </p>
                    <p className="text-base font-black text-slate-800 font-mono mt-0.5">
                      {totalServices}
                    </p>
                  </div>
                  <div className="border-l border-slate-200 px-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Total Vendors
                    </p>
                    <p className="text-base font-black text-slate-800 font-mono mt-0.5">
                      {totalVendorsCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Programs Approvals & Ticket Conversion Analysis */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">
                    Events Analytics Hub
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-4">
                    Tracking event approvals and regstration.
                  </p>

                  <div className="space-y-4">
                    {/* Visitor Registrations Comparison Meter */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-bold text-slate-700">
                          Guest Invitation Capacity Fill-Rate
                        </span>
                        <span className="font-mono font-medium text-slate-500">
                          {eventMetrics.totalRegisteredGuests} Registered /{" "}
                          {eventMetrics.totalExpectedGuests} Invited
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full transition-all"
                          style={{
                            width: getPercentage(
                              eventMetrics.totalRegisteredGuests,
                              eventMetrics.totalExpectedGuests,
                            ),
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Operational Approvals Vector Row */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                        <p className="text-[9px] font-bold text-emerald-600 uppercase">
                          Approved Event Logs
                        </p>
                        <div className="flex justify-between items-baseline mt-1">
                          <span className="text-xl font-black text-emerald-800 font-mono">
                            {eventMetrics.approved}
                          </span>
                          <span className="text-xs text-emerald-600 font-bold font-mono">
                            {getPercentage(
                              eventMetrics.approved,
                              eventMetrics.total,
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                        <p className="text-[9px] font-bold text-rose-600 uppercase">
                          Rejected / Flagged Mandates
                        </p>
                        <div className="flex justify-between items-baseline mt-1">
                          <span className="text-xl font-black text-rose-800 font-mono">
                            {eventMetrics.rejected}
                          </span>
                          <span className="text-xs text-rose-600 font-bold font-mono">
                            {getPercentage(
                              eventMetrics.rejected,
                              eventMetrics.total,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Ledger Section */}
                <div className="bg-emerald-900 text-white rounded-xl p-4 mt-6 flex justify-between items-center shadow-md">
                  <div>
                    <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
                      Ticketing Monetization Flow
                    </p>
                    <p className="text-sm font-black mt-0.5">
                      {eventMetrics.paidEvents} Paid Tier Programs
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
                      Aggregated Cash Flow Ledger
                    </p>
                    <p className="text-xl font-black text-emerald-100 font-mono">
                      ₦
                      {eventMetrics.totalRevenueTransacted.toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
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
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        Estate Administrator
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Personnel in charge of Estate management
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
                    {!selectedEstate.admin ? (
                      <p className="text-xs text-slate-400 p-2 italic">
                        No administrator provisioned.
                      </p>
                    ) : (
                      <div className="bg-slate-50 p-2 rounded-xl flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-800">
                          {selectedEstate.admin.name ||
                            selectedEstate.admin.email}
                        </span>
                        <span className="text-[10px] bg-slate-200/70 px-2 py-0.5 rounded text-slate-600 font-medium">
                          {selectedEstate.admin.role || "ADMIN"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[14px] text-slate-400">Active Last</p>
                    <span className="text-[12px] bg-slate-200/70 px-2 py-0.5 rounded text-slate-600 font-medium">
                      {getRelativeTime(selectedEstate.admin.last_activity_at)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (selectedEstate.admin) {
                      setSelectedAdmin(selectedEstate.admin);
                    }
                  }}
                  className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs font-bold text-indigo-600 transition-colors"
                >
                  See Details →
                </button>
              </div>

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
                        Maintenance & Utility Requests
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

            {/* ─── ROW 4: STRUCTURAL VENUES & EVENT MANAGEMENT NODES ─── */}
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
                        Scheduled Public Events
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Town halls, gate bookings, and ticketing revenue
                        pipeline.
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
                          Invited (Expected)
                        </p>
                        <p className="text-base font-black text-slate-800 font-mono mt-0.5">
                          {eventMetrics.totalExpectedGuests}
                        </p>
                      </div>
                      <div className="bg-indigo-50/60 p-2 rounded-xl text-center border border-indigo-100/40">
                        <p className="text-[9px] font-bold text-indigo-600 uppercase">
                          Registered Guests
                        </p>
                        <p className="text-base font-black text-indigo-700 font-mono mt-0.5">
                          {eventMetrics.totalRegisteredGuests}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-emerald-50/60 p-2 rounded-xl text-center border border-emerald-100/50 col-span-2">
                        <p className="text-[9px] font-black text-emerald-600 uppercase">
                          Approved
                        </p>
                        <p className="text-sm font-black text-emerald-700 font-mono">
                          {eventMetrics.approved}
                        </p>
                      </div>
                      <div className="bg-rose-50/60 p-2 rounded-xl text-center border border-rose-100/50 col-span-2">
                        <p className="text-[9px] font-black text-rose-600 uppercase">
                          Rejected
                        </p>
                        <p className="text-sm font-black text-rose-700 font-mono">
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
                          {eventMetrics.paidEvents} Tickets System
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
                    if (selectedEstate.events) {
                      setEventsSelected(true);
                    }
                  }}
                  className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs font-bold text-indigo-600 transition-colors"
                >
                  Open Events Desk →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── BOTTOM ADMINISTRATIVE ACTIONS BAR ─── */}
      <div className="mt-8 max-w-7xl mx-auto w-full pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-end items-center gap-3">
        <button
          onClick={() =>
            console.log("Routing to Residents Directory Context...")
          }
          className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
        >
          👥 View Residents Info
        </button>
        <button
          onClick={() =>
            console.log("Routing to Security/Guard Roster Scope...")
          }
          className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
        >
          🛡️ View Security Info
        </button>
      </div>
    </div>
  );
}
