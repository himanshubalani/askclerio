"use client";

import { useMemo } from "react";
import { api } from "@/trpc/react";
import { computeDashboardData } from "../_lib/dashboard-utils";

export function useCalendarDashboard() {
  const { data, isLoading, error, refetch, isFetching } =
    api.calendar.getDashboardData.useQuery();

  const utils = api.useUtils();

  const syncLatest = api.calendar.syncLatest.useMutation({
    onSuccess: () => utils.calendar.getDashboardData.invalidate(),
  });

  const createEvent = api.calendar.createEvent.useMutation({
    onSuccess: () => utils.calendar.getDashboardData.invalidate(),
  });

  const deleteEvent = api.calendar.deleteEvent.useMutation({
    onSuccess: () => utils.calendar.getDashboardData.invalidate(),
  })

  const saveNote = api.calendar.saveNote.useMutation({
    onSuccess: () => utils.calendar.getDashboardData.invalidate(),
  });

  // Client-side derived data
  const { stats, todayEvents, upcomingGroups } = useMemo(() => {
    return computeDashboardData(data?.events ?? []);
  }, [data?.events]);

  return {
    isLoading,
    isFetching,
    error,
    needsAuth: data?.needsAuth,
    needsSync: data?.needsSync,
    stats,
    todayEvents,
    upcomingGroups,
    syncLatest,
    createEvent,
    deleteEvent,
    saveNote,
    refetch,
  };
}
