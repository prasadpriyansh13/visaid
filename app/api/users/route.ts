import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";

/**
 * POST /api/users
 * 
 * Saves user form data (name, email, phone) to PostgreSQL database via Prisma.
 * 
 * Production Database Flow:
 * 1. User submits form on landing page
 * 2. Frontend sends POST request to this API route
 * 3. API validates input and saves to PostgreSQL (Neon) via Prisma
 * 4. Returns success response to frontend
 * 
 * Database: Neon PostgreSQL (cloud-hosted)
 * ORM: Prisma Client
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone } = body;

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format (basic validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Save user data to PostgreSQL database via Prisma
    // This creates a new record in the 'users' table
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      },
    });

    // Log successful save (for monitoring/debugging)
    console.log("User data saved to database:", {
      id: user.id,
      email: user.email,
      timestamp: user.createdAt,
    });

    return NextResponse.json(
      {
        message: "User data saved successfully",
        userId: user.id,
      },
      { status: 201 } // 201 Created - appropriate for resource creation
    );
  } catch (error) {
    console.error("Error saving user data to database:", error);

    // Handle Prisma-specific errors
    if (error instanceof Error) {
      // Check for unique constraint violations (duplicate email)
      if (error.message.includes("Unique constraint") || error.message.includes("P2002")) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 } // 409 Conflict
        );
      }

      // Check for database connection errors
      if (error.message.includes("P1001") || error.message.includes("connect")) {
        return NextResponse.json(
          { error: "Database connection error. Please try again later." },
          { status: 503 } // 503 Service Unavailable
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

