import { NextRequest, NextResponse } from "next/server";

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

    // Log user data to server console
    // In production, you would save this to a database (e.g., PostgreSQL with Prisma)
    console.log("=".repeat(50));
    console.log("User data received:");
    console.log("  Name:", name);
    console.log("  Email:", email);
    console.log("  Phone:", phone);
    console.log("  Timestamp:", new Date().toISOString());
    console.log("=".repeat(50));
    console.log("\n💡 To view this data in production:");
    console.log("   1. Set up Prisma with PostgreSQL");
    console.log("   2. Run: npx prisma studio");
    console.log("   3. Or query the database directly\n");

    // In a real application, you would save this to a database here
    // Example with Prisma:
    // const user = await prisma.user.create({
    //   data: { name, email, phone }
    // });

    return NextResponse.json(
      { message: "User data saved successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

