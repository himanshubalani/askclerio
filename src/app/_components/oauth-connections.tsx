"use client";

import { useState } from "react";
import { api } from "@/trpc/react";

export function GoogleOAuthConnection() {
  const [isConnecting, setIsConnecting] = useState(false);
  
  const generateUrlMutation = api.auth.generateOAuthUrl.useMutation({
    onSuccess: (result) => {
      // Open OAuth URL in a popup
      const popup = window.open(
        result.url,
        'oauth-popup',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for OAuth completion
      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'oauth-success' || event.data.type === 'oauth-error') {
          setIsConnecting(false);
          window.removeEventListener('message', messageHandler);
          popup?.close();
          
          if (event.data.type === 'oauth-success') {
            console.log('Google account connected successfully');
            // Refetch both connection statuses
            gmailStatusQuery.refetch();
            calendarStatusQuery.refetch();
          } else {
            console.error('Google connection failed:', event.data.error);
          }
        }
      };

      window.addEventListener('message', messageHandler);
      setIsConnecting(true);

      // Handle popup closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          window.removeEventListener('message', messageHandler);
        }
      }, 1000);
    },
    onError: (error) => {
      console.error('Failed to generate OAuth URL:', error);
      setIsConnecting(false);
    },
  });

  const gmailStatusQuery = api.auth.checkConnectionStatus.useQuery({ plugin: "gmail" });
  const calendarStatusQuery = api.auth.checkConnectionStatus.useQuery({ plugin: "googlecalendar" });

  const handleConnect = () => {
    generateUrlMutation.mutate({ plugin: "gmail" });
  };

  // Connected if both Gmail and Calendar are connected
  const isGmailConnected = gmailStatusQuery.data?.connected;
  const isCalendarConnected = calendarStatusQuery.data?.connected;
  const isConnected = isGmailConnected && isCalendarConnected;
  
  const isLoading = 
    gmailStatusQuery.isLoading || 
    calendarStatusQuery.isLoading || 
    isConnecting || 
    generateUrlMutation.isPending;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <h3 className="font-medium">Google Account</h3>
        <p className="text-sm text-gray-600">Access Gmail and Google Calendar</p>
        {isConnected && (
          <div className="text-sm text-green-600 mt-2">
            <p>✓ Gmail connected as {gmailStatusQuery.data?.email}</p>
            <p>✓ Calendar ready</p>
          </div>
        )}
      </div>
      
      <button
        onClick={handleConnect}
        disabled={isLoading || isConnected}
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          isConnected 
            ? "bg-green-100 text-green-700 cursor-not-allowed" 
            : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        }`}
      >
        {isLoading ? "Connecting..." : isConnected ? "Connected" : "Connect"}
      </button>
    </div>
  );
}