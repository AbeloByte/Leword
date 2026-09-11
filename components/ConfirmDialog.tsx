"use client";

import React from "react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, TriangleAlert } from "lucide-react";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Styles the confirm button as destructive and shows a warning mark. */
    destructive?: boolean;
    /** Disables both buttons and spins the confirm one. */
    busy?: boolean;
    onConfirm: () => void;
}

/**
 * A small yes/no gate for actions that are hard to undo.
 *
 * Controlled on purpose: the caller owns which item is pending, so one dialog
 * instance serves a whole list instead of mounting one per row.
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    destructive = false,
    busy = false,
    onConfirm,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-100" showCloseButton={false}>
                <DialogHeader>
                    <div className="flex items-start gap-3">
                        {destructive && (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                <TriangleAlert className="h-4.5 w-4.5" />
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <DialogTitle className="text-base">
                                {title}
                            </DialogTitle>
                            <DialogDescription className="text-sm leading-relaxed">
                                {description}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <DialogFooter>
                    <DialogClose
                        render={
                            <Button
                                variant="outline"
                                className="h-9"
                                disabled={busy}
                            />
                        }
                    >
                        {cancelLabel}
                    </DialogClose>
                    <Button
                        className="h-10 gap-1.5"
                        variant={destructive ? "destructive" : "default"}
                        onClick={onConfirm}
                        disabled={busy}
                    >
                        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
