"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function BackupButton() {
  const [backingUp, setBackingUp] = useState(false);

  const handleBackup = async () => {
    try {
      setBackingUp(true);

      const response = await fetch("/api/backup");

      if (!response.ok) {
        let message = "Failed to create backup";

        try {
          const data = await response.json();
          message = data.message || message;
        } catch {
          // Response was not JSON
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `billing-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Backup downloaded successfully!");
    } catch (error) {
      console.error("Backup error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create backup"
      );
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBackup}
      disabled={backingUp}
      className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-gray-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {backingUp ? (
        <Loader2
          size={17}
          className="animate-spin"
        />
      ) : (
        <Download size={17} />
      )}

      {backingUp
        ? "Creating Backup..."
        : "Backup Data"}
    </button>
  );
}