"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { User, LogOut, Settings, Loader2 } from "lucide-react";
import {
    AVATAR_PRESETS,
    AvatarGlyph,
    avatarIconName,
    isAvatarIcon,
} from "@/components/profile-avatar";

export function UserNav() {
    const { user, signOut } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);
    const [signOutOpen, setSignOutOpen] = useState(false);

    // Profile Form States
    const currentName =
        user?.user_metadata?.full_name || user?.user_metadata?.name || "";
    const currentAvatar = user?.user_metadata?.avatar_url || "";

    const [displayName, setDisplayName] = useState(currentName);
    const [avatarUrl, setAvatarUrl] = useState(currentAvatar);
    const [updating, setUpdating] = useState(false);


    // Presets are Lucide glyphs, not remotely generated artwork -- same icon
    // family as the rest of the app, and no third-party image host.
    const presetAvatars = AVATAR_PRESETS;

    // User initials for avatar fallback
    const initials = displayName
        ? displayName.slice(0, 2).toUpperCase()
        : user?.email?.slice(0, 2).toUpperCase() || "U";

    // Update profile via Supabase Auth
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);

        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: displayName.trim(),
                    avatar_url: avatarUrl.trim(),
                },
            });

            if (error) throw error;

            toast.success("Profile updated!");
            setProfileOpen(false);
            window.location.reload();
        } catch (err: any) {
            toast.error(err.message || "Failed to update profile");
        } finally {
            setUpdating(false);
        }
    };

    if (!user) return null;

    return (
        <>
            {/* Avatar Dropdown Trigger */}
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button
                            variant="ghost"
                            className="relative h-10 w-10 rounded-full p-0 ring-offset-background transition-colors hover:bg-muted"
                        />
                    }
                >
                    <Avatar className="h-10 w-10">
                        {isAvatarIcon(currentAvatar) ? (
                            <AvatarFallback className="bg-muted text-muted-foreground">
                                <AvatarGlyph
                                    value={currentAvatar}
                                    className="h-4.5 w-4.5"
                                />
                            </AvatarFallback>
                        ) : (
                            <>
                                <AvatarImage
                                    src={currentAvatar}
                                    alt={displayName || "User avatar"}
                                />
                                <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
                                    {initials}
                                </AvatarFallback>
                            </>
                        )}
                    </Avatar>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56 p-1.5" align="end">
                    {/* Replaced DropdownMenuLabel with standard styled div for Base UI compatibility */}
                    <div className="px-2 py-1.5 mb-1">
                        <p className="text-sm font-semibold leading-none capitalize">
                            {displayName || "Lexicon Explorer"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground truncate mt-1">
                            {user.email}
                        </p>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        className="cursor-pointer gap-2 text-xs font-medium py-2 px-2.5 rounded-sm hover:bg-muted"
                        onClick={() => setProfileOpen(true)}
                    >
                        <Settings className="h-4 w-4" />
                        Profile Settings
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive font-medium py-2 px-2.5 rounded-sm hover:bg-destructive/10"
                        onClick={() => setSignOutOpen(true)}
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmDialog
                open={signOutOpen}
                onOpenChange={setSignOutOpen}
                title="Sign out of Leword?"
                description="Your words are saved to your account, so they will all be here when you sign back in."
                confirmLabel="Sign out"
                cancelLabel="Stay signed in"
                onConfirm={() => {
                    setSignOutOpen(false);
                    void signOut();
                }}
            />

            {/* Profile Management Modal */}
            <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-accent-ink" />
                            Manage Profile
                        </DialogTitle>
                        <DialogDescription>
                            Customize how you appear in Leword.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={handleUpdateProfile}
                        className="space-y-4 pt-2"
                    >
                        {/* Current Avatar Preview */}
                        <div className="flex flex-col items-center justify-center gap-2 pb-2">
                            <Avatar className="h-20 w-20 border">
                                {isAvatarIcon(avatarUrl || currentAvatar) ? (
                                    <AvatarFallback className="bg-muted text-muted-foreground">
                                        <AvatarGlyph
                                            value={avatarUrl || currentAvatar}
                                            className="h-8 w-8"
                                        />
                                    </AvatarFallback>
                                ) : (
                                    <>
                                        <AvatarImage
                                            src={avatarUrl || currentAvatar}
                                        />
                                        <AvatarFallback className="bg-muted text-lg font-bold text-muted-foreground">
                                            {initials}
                                        </AvatarFallback>
                                    </>
                                )}
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                                Preview
                            </span>
                        </div>

                        {/* Pick from preset stylish avatars */}
                        <div className="space-y-1.5">
                            <Label className="text-xs">
                                Choose an avatar
                            </Label>
                            <div className="flex flex-wrap items-center justify-center gap-2 py-1">
                                {presetAvatars.map((preset) => {
                                    const active = avatarUrl === preset;
                                    return (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setAvatarUrl(preset)}
                                            aria-pressed={active}
                                            aria-label={`Use the ${avatarIconName(preset)} avatar`}
                                            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                                                active
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            <AvatarGlyph
                                                value={preset}
                                                className="h-4.5 w-4.5"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs">
                                Display Name
                            </Label>
                            <Input
                                id="name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your name"
                                className="text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="avatar" className="text-xs">
                                Or use a custom image URL
                            </Label>
                            <Input
                                id="avatar"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                placeholder="https://example.com/avatar.jpg"
                                className="text-sm"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full font-medium"
                            disabled={updating}
                        >
                            {updating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Profile"
                            )}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
