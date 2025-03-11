import { NextResponse } from "next/server"
import { z } from "zod"
import { hash } from "bcrypt"
import { db } from "../../../../../configs/db"
import { users } from "../../../../../configs/schema"

// Schema for validation
const registerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  firstName: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Pincode must be 6 digits"),
  termsAccepted: z.literal(true),
})

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate request data
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, validatedData.email),
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 10)

    // Generate a random 6-digit reference ID
    const referenceId = Math.floor(100000 + Math.random() * 900000).toString()

    // Create new user
    const newUser = await db
      .insert(users)
      .values({
        referenceId,
        title: validatedData.title,
        firstName: validatedData.firstName,
        surname: validatedData.surname,
        mobile: validatedData.mobile,
        email: validatedData.email,
        password: hashedPassword,
        addressLine1: validatedData.addressLine1,
        addressLine2: validatedData.addressLine2,
        city: validatedData.city,
        state: validatedData.state,
        pincode: validatedData.pincode,
        termsAccepted: validatedData.termsAccepted,
      })
      .returning({ id: users.id, referenceId: users.referenceId })

    return NextResponse.json({
      message: "User registered successfully",
      referenceId: newUser[0].referenceId,
    })
  } catch (error) {
    console.error("Registration error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

