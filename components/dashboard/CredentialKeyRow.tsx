"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Check, Eye, EyeOff, Pencil, Trash2, X, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { updateCredentialKey, deleteCredentialKey } from "@/app/actions/credentials";

interface Props {
  keyId:        string;
  ownerLabel:   string;
  initialLabel: string;
  initialValue: string;
  canEdit:      boolean;
  canDelete:    boolean;
}

export default function CredentialKeyRow({
  keyId,
  ownerLabel,
  initialLabel,
  initialValue,
  canEdit,
  canDelete,
}: Props) {
  const router = useRouter();
  const [isEditing,      setIsEditing]      = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);
  const [editLabel,      setEditLabel]      = useState(initialLabel);
  const [editValue,      setEditValue]      = useState(initialValue);
  const [showPassword,   setShowPassword]   = useState(false);
  const [copiedLabel,    setCopiedLabel]    = useState(false);
  const [copiedValue,    setCopiedValue]    = useState(false);
  const [isPending,      startTransition]   = useTransition();

  const handleCopyLabel = async () => {
    await navigator.clipboard.writeText(initialLabel);
    setCopiedLabel(true);
    setTimeout(() => setCopiedLabel(false), 2000);
    toast.success("Username copied.");
  };

  const handleCopyValue = async () => {
    await navigator.clipboard.writeText(initialValue);
    setCopiedValue(true);
    setTimeout(() => setCopiedValue(false), 2000);
    toast.success("Password copied.");
  };

  const handleStartEdit = () => {
    setEditLabel(initialLabel);
    setEditValue(initialValue);
    setIsEditing(true);
    setConfirmDelete(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    const l = editLabel.trim();
    const v = editValue.trim();
    if (!l || !v) {
      toast.error("Username and password are required.");
      return;
    }
    startTransition(async () => {
      const result = await updateCredentialKey(keyId, { label: l, value: v });
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Credential updated.");
        setIsEditing(false);
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCredentialKey(keyId);
      if (!result.success) {
        toast.error(result.error);
        setConfirmDelete(false);
      } else {
        toast.success("Credential deleted.");
        router.refresh();
      }
    });
  };

  if (isEditing) {
    return (
      <tr className="border-t border-white/20 bg-blue-50/30">
        <td className="whitespace-nowrap px-4 py-2.5 align-middle text-sm text-slate-500">
          {ownerLabel}
        </td>
        <td className="px-4 py-2 align-middle">
          <Input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            className="h-8 w-40 text-sm"
            disabled={isPending}
            placeholder="Username"
            autoFocus
          />
        </td>
        <td className="px-4 py-2 align-middle">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-sm font-mono"
            disabled={isPending}
            placeholder="Password"
          />
        </td>
        <td className="whitespace-nowrap px-4 py-2 align-middle">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              title="Save"
              className="p-1.5 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isPending}
              title="Cancel"
              className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-white/60 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  if (confirmDelete) {
    return (
      <tr className="border-t border-white/20 bg-red-50/40">
        <td
          colSpan={3}
          className="px-4 py-2.5 align-middle text-sm font-medium text-destructive"
        >
          Delete &ldquo;{initialLabel}&rdquo;? This cannot be undone.
        </td>
        <td className="whitespace-nowrap px-4 py-2 align-middle">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              title="Confirm delete"
              className="p-1.5 rounded text-destructive hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={isPending}
              title="Cancel"
              className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-white/60 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-white/20 hover:bg-white/30 transition-colors">
      <td className="whitespace-nowrap px-4 py-2.5 align-middle text-sm text-slate-500">
        {ownerLabel}
      </td>
      <td className="whitespace-nowrap px-4 py-2.5 align-middle">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-[#0c1421]">{initialLabel}</span>
          <button
            type="button"
            onClick={handleCopyLabel}
            title="Copy username"
            className="p-0.5 rounded text-slate-500 hover:text-slate-800 hover:bg-white/60"
          >
            {copiedLabel
              ? <Check className="h-3 w-3 text-emerald-500" />
              : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </td>
      <td className="px-4 py-2.5 align-middle">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-mono text-slate-700">
            {showPassword ? initialValue : "••••••••"}
          </span>
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            title={showPassword ? "Hide password" : "Show password"}
            className="p-0.5 rounded text-slate-500 hover:text-slate-800 hover:bg-white/60"
          >
            {showPassword
              ? <EyeOff className="h-3 w-3" />
              : <Eye className="h-3 w-3" />}
          </button>
          <button
            type="button"
            onClick={handleCopyValue}
            title="Copy password"
            className="p-0.5 rounded text-slate-500 hover:text-slate-800 hover:bg-white/60"
          >
            {copiedValue
              ? <Check className="h-3 w-3 text-emerald-500" />
              : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-2.5 align-middle">
        <div className="flex items-center gap-0.5">
          {canEdit && (
            <button
              type="button"
              onClick={handleStartEdit}
              title="Edit credential"
              className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-white/60"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              title="Delete credential"
              className="p-1.5 rounded text-slate-500 hover:text-destructive hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
