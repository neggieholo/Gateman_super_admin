/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { Invitation } from "../services/types";

export interface GatePassMetrics {
  total: number;
  pending: number;
  upcoming: number;
  expiredUnused: number;
  cancelled: number;
  overstayed: number;
  isStaff: number;
  isMultiEntry: number;
  isOneTimeEntry: number;
  usedGoodTime: number;
}

// Fixed parameter type: Input should be an array of raw invitation/pass objects, not metrics objects
export function useGatePassMetrics(gatepasses: Invitation[] = []): GatePassMetrics {
  return useMemo(() => {
    let pendingCount = 0;
    let upcomingCount = 0;
    let expiredUnusedCount = 0;
    let cancelledCount = 0;
    let overstayedCount = 0;
    let isStaffCount = 0;
    let isMultiEntryCount = 0;
    let isOneTimeEntryCount = 0;
    let usedGoodTimeCount = 0;

    const now = new Date();
    const toLocalDateStr = (d: any): string => {
      if (!d) return "";
      return new Date(d).toLocaleDateString("en-CA"); // YYYY-MM-DD
    };

    const todayStr = toLocalDateStr(now);
    const todayZeroed = new Date(new Date().setHours(0, 0, 0, 0));

    gatepasses.forEach((invite: Invitation) => {
      // 1. Structural Flags Auditing
      if (invite.invite_type === "staff_entry") {
        isStaffCount++;
      }

      if (invite.invite_type === "multi_entry") {
        isMultiEntryCount++;
      }

      if (invite.invite_type === "one_time") {
        isOneTimeEntryCount++;
      }

      // 2. Cancelled Check
      if (invite.is_cancelled) {
        cancelledCount++;
        return;
      }

    //   const [startH, startM] = (invite.start_time || "00:00").split(":");
      const [endH, endM] = (invite.end_time || "23:59").split(":");

      const todayEnd = new Date();
      todayEnd.setHours(parseInt(endH, 10), parseInt(endM, 10), 0, 0);

      const overallExpiry = new Date(invite.end_date);
      overallExpiry.setHours(parseInt(endH, 10), parseInt(endM, 10), 0);

    //   const startDateStr = toLocalDateStr(invite.start_date);
      const startDayZeroed = invite.start_date
        ? new Date(new Date(invite.start_date).setHours(0, 0, 0, 0))
        : null;

      const checkinDateStr = toLocalDateStr(invite.actual_checkin_date);
      const checkoutDateStr = toLocalDateStr(invite.actual_checkout_date);

      // 3. Upcoming Checks (Pass window hasn't opened yet)
      const isStatusPending = invite.status === "pending";
      if (isStatusPending && startDayZeroed && todayZeroed < startDayZeroed) {
        upcomingCount++;
        return;
      }

      // 4. Overstayed Logic Check
      const hasOverstayedPast =
        checkinDateStr &&
        checkinDateStr < todayStr &&
        (!checkoutDateStr || checkoutDateStr < checkinDateStr);
      const hasOverstayedToday =
        checkinDateStr === todayStr && !checkoutDateStr && now > todayEnd;

      if (
        hasOverstayedPast ||
        hasOverstayedToday ||
        invite.status === "overstayed"
      ) {
        overstayedCount++;
        return;
      }

      // 5. Expired / Unused Check
      if (now > overallExpiry) {
        if (!checkinDateStr) {
          expiredUnusedCount++;
        } else if (checkoutDateStr) {
          const preciseCheckoutTime = new Date(invite.actual_checkout_date || "");
          if (preciseCheckoutTime > overallExpiry) {
            overstayedCount++;
          } else {
            usedGoodTimeCount++;
          }
        }
        return;
      }

      // 6. Checked-out Evaluation
      if (invite.actual_checkout_date || invite.status === "checked_out") {
        if (invite.actual_checkout_date) {
          const preciseCheckoutTime = new Date(invite.actual_checkout_date);
          if (preciseCheckoutTime > overallExpiry) {
            overstayedCount++;
            return;
          }
        }
        usedGoodTimeCount++;
        return;
      }

      // 7. Active / Pending Check
      if (!checkinDateStr) {
        pendingCount++;
      } else {
        usedGoodTimeCount++; // Checked in, safe inside boundaries
      }
    });

    return {
      total: gatepasses.length,
      pending: pendingCount,
      upcoming: upcomingCount,
      expiredUnused: expiredUnusedCount,
      cancelled: cancelledCount,
      overstayed: overstayedCount,
      isStaff: isStaffCount,
      isMultiEntry: isMultiEntryCount,
      isOneTimeEntry: isOneTimeEntryCount,
      usedGoodTime: usedGoodTimeCount,
    };
  }, [gatepasses]);
}
