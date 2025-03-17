import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Delete the authentication token
    (await cookies()).delete("token");

    return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
