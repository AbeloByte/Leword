// app/api/admin/check/route.ts
//
// Tells the signed-in user whether they may open /admin, so the menu can show
// the link. Says nothing about who else is an admin.

import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { isAdmin } from "@/lib/admin";

export async function GET(req: Request) {
    const user = await getUserFromRequest(req);
    return NextResponse.json(
        { admin: isAdmin(user) },
        { headers: { "Cache-Control": "no-store" } },
    );
}
