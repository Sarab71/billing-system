import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import mongoose from "mongoose";
import { EJSON } from "bson";

export async function GET() {
  try {
    await connectDB();

    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        {
          success: false,
          message: "Database connection not available",
        },
        { status: 500 }
      );
    }

    // Get all collections
    const collections = await db
      .listCollections()
      .toArray();

    const backupData: Record<string, unknown[]> = {};

    // Fetch complete data from every collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;

      // Skip MongoDB system collections
      if (collectionName.startsWith("system.")) {
        continue;
      }

      const documents = await db
        .collection(collectionName)
        .find({})
        .toArray();

      backupData[collectionName] = documents;
    }

    const backup = {
      backupVersion: 1,
      createdAt: new Date().toISOString(),
      database: db.databaseName,
      collections: backupData,
    };

    // EJSON preserves MongoDB types such as ObjectId and Date
    const jsonBackup = EJSON.stringify(
      backup,
      null,
      2
    );

    // ==================================================
    // BACKUP FILE NAME
    // ==================================================

    const now = new Date();

    const timestamp =
      `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}` +
      `-${String(
        now.getHours()
      ).padStart(2, "0")}-${String(
        now.getMinutes()
      ).padStart(2, "0")}-${String(
        now.getSeconds()
      ).padStart(2, "0")}`;

    const filename =
      `billing-backup-${timestamp}.json`;

    // ==================================================
    // DOWNLOAD BACKUP
    // ==================================================

    return new NextResponse(jsonBackup, {
      status: 200,

      headers: {
        "Content-Type":
          "application/json; charset=utf-8",

        "Content-Disposition":
          `attachment; filename="${filename}"`,

        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Backup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create database backup",
      },
      { status: 500 }
    );
  }
}