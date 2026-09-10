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
import { User, LogOut, Settings, Loader2 } from "lucide-react";

export function UserNav() {
    const { user, signOut } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);

    // Profile Form States
    const currentName =
        user?.user_metadata?.full_name || user?.user_metadata?.name || "";
    const currentAvatar = user?.user_metadata?.avatar_url || "";

    const [displayName, setDisplayName] = useState(currentName);
    const [avatarUrl, setAvatarUrl] = useState(currentAvatar);
    const [updating, setUpdating] = useState(false);

    // Preset fun avatars using DiceBear (SVG avatars that look great)
    const presetAvatars = [
        `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || "avatar1"}`,
        `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.id || "avatar2"}`,
        `https://api.dicebear.com/7.x/lorelei/svg?seed=${user?.id || "avatar3"}`,
        `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.id || "avatar4"}`,
    ];

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
                            className="relative h-9 w-9 rounded-full p-0 ring-offset-background transition-all hover:ring-2 hover:ring-primary/20"
                        />
                    }
                >
                    <Avatar className="h-9 w-9">
                        <AvatarImage
                            src={currentAvatar}
                            alt={displayName || "User avatar"}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                            {initials}
                        </AvatarFallback>
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
                        onClick={() => signOut()}
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Management Modal */}
            <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
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
                            <Avatar className="h-20 w-20 border-2 border-border shadow-sm">
                                <AvatarImage src={avatarUrl || currentAvatar} />
                                <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                                Preview
                            </span>
                        </div>

                        {/* Pick from preset stylish avatars */}
                        <div className="space-y-1.5">
                            <Label className="text-xs">
                                Or choose an avatar
                            </Label>
                            <div className="flex items-center justify-center gap-3 py-1">
                                {presetAvatars.map((preset, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setAvatarUrl(preset)}
                                        className={`h-10 w-10 rounded-full border-2 overflow-hidden transition-all hover:scale-110 ${
                                            avatarUrl === preset
                                                ? "border-primary ring-2 ring-primary/20"
                                                : "border-transparent"
                                        }`}
                                    >
                                        <img
                                            src={preset}
                                            alt={`Preset ${idx + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                ))}
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
                                Custom Avatar Image URL
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
