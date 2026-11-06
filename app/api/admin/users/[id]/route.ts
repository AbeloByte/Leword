// app/api/admin/users/[id]/route.ts
//
// PATCH suspends or restores an account; DELETE removes it with all its words.
// An admin can never act on their own account here, so the last admin cannot
// lock themselves out.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import type { AdminUserAction } from "@/lib/admin-types";

// Supabase has no "forever"; a century is close enough.
const SUSPEND_DURATION = "876000h";

const UUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function target(req: Request, ctx: RouteContext<"/api/admin/users/[id]">) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard;

    const { id } = await ctx.params;
    if (!UUID.test(id)) {
        return {
            ok: false as const,
            response: NextResponse.json(
                { error: "Unknown user" },
                { status: 400 },
            ),
        };
    }
    if (id === guard.user.id) {
        return {
            ok: false as const,
            response: NextResponse.json(
                { error: "You can't change your own account from here" },
                { status: 400 },
            ),
        };
    }
    return { ...guard, id };
}

export async function PATCH(
    req: Request,
    ctx: RouteContext<"/api/admin/users/[id]">,
) {
    const t = await target(req, ctx);
    if (!t.ok) return t.response;

    let action: AdminUserAction | undefined;
    try {
        action = ((await req.json()) as { action?: AdminUserAction })?.action;
    } catch {
        // fall through to the validation below
    }
    if (action !== "suspend" && action !== "restore") {
        return NextResponse.json(
            { error: "Action must be suspend or restore" },
            { status: 400 },
        );
    }

    const { error } = await t.db.auth.admin.updateUserById(t.id, {
        ban_duration: action === "suspend" ? SUSPEND_DURATION : "none",
    });
    if (error) {
        console.error("Admin update failed:", error);
        return NextResponse.json(
            { error: "Could not update that account" },
            { status: 500 },
        );
    }

    return NextResponse.json({ ok: true });
}

export async function DELETE(
    req: Request,
    ctx: RouteContext<"/api/admin/users/[id]">,
) {
    const t = await target(req, ctx);
    if (!t.ok) return t.response;

    // Remove the words explicitly rather than relying on a cascade the
    // schema may not have.
    const { error: wordsError } = await t.db
        .from("words")
        .delete()
        .eq("user_id", t.id);
    if (wordsError) {
        console.error("Admin delete (words) failed:", wordsError);
        return NextResponse.json(
            { error: "Could not delete that account's words" },
            { status: 500 },
        );
    }

    const { error } = await t.db.auth.admin.deleteUser(t.id);
    if (error) {
        console.error("Admin delete (user) failed:", error);
        return NextResponse.json(
            { error: "Words were removed, but the account could not be deleted" },
            { status: 500 },
        );
    }

    return NextResponse.json({ ok: true });
}
