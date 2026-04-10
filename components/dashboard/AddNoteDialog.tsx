"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NoteType } from "@prisma/client";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { saveNote } from "@/app/actions/notes";

const IMAGE_TOKEN = "[image]";

interface Props {
  /** When provided, the note is created as PROJECT_BASED for this project. */
  projectId?:   string;
  projectName?: string;
}

export default function AddNoteDialog({ projectId, projectName }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProjectNote = !!projectId;

  const resetAndClose = () => {
    setOpen(false);
    setTitle("");
    setContent("");
    setImageUrls([]);
    setError(null);
  };

  const buildContentToSave = (body: string) => {
    let imageIndex = 0;
    return body.trim().replace(/\[image\]/g, () => {
      const url = imageUrls[imageIndex++];
      return url ? `![](${url})` : IMAGE_TOKEN;
    });
  };

  const removeAttachment = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    setContent((prev) => {
      let i = 0;
      return prev.replace(/\[image\]/g, (match) => {
        if (i === index) {
          i++;
          return "";
        }
        i++;
        return match;
      });
    });
  };

  const handleSubmit = () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!content.trim()) {
      setError("Content is required.");
      return;
    }

    const contentToSave = buildContentToSave(content);

    startTransition(async () => {
      const result = await saveNote({
        title: title.trim(),
        content: contentToSave,
        type: isProjectNote ? NoteType.PROJECT_BASED : NoteType.NORMAL,
        projectId: isProjectNote ? projectId : undefined,
      });

      if (result.success) {
        if (result.pendingApproval) {
          toast.success("Request submitted. An admin will review your note before it appears.");
        } else {
          toast.success("Note created.");
        }
        resetAndClose();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const dialogTitle = isProjectNote
    ? `Add Note — ${projectName ?? "Project"}`
    : "Add General Note";

  const appendImageFromDataUrl = (dataUrl: string) => {
    setImageUrls((prev) => [...prev, dataUrl]);
    setContent((prev) => prev + `\n\n${IMAGE_TOKEN}\n\n`);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;
    const fileItem = Array.from(items).find(
      (it) => it.kind === "file" && it.type.startsWith("image/"),
    );
    if (!fileItem) return;

    const file = fileItem.getAsFile();
    if (!file) return;

    e.preventDefault();

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      appendImageFromDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      if (dataUrl) appendImageFromDataUrl(dataUrl);
    }
    e.target.value = "";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetAndClose();
        else setOpen(true);
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <svg className="mr-1.5 h-4 w-4" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2v12M2 8h12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Add Note
          </Button>
        }
      />

      <DialogContent
        className={cn(
          "flex max-h-[min(92vh,52rem)] flex-col",
          isProjectNote
            ? "max-w-lg sm:max-w-lg"
            : "w-[min(96vw,56rem)] max-w-[min(96vw,56rem)] sm:max-w-[min(96vw,56rem)]",
        )}
      >
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="mt-2 flex min-h-0 flex-1 flex-col space-y-4 overflow-hidden">
          <div className="space-y-1.5">
            <Label htmlFor="n-title">Title</Label>
            <Input
              id="n-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deployment checklist"
              disabled={isPending}
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col space-y-1.5">
              <Label htmlFor="n-content">Content</Label>
              <textarea
                id="n-content"
                rows={isProjectNote ? 6 : 12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note here… Paste images or add them from the Images panel."
                disabled={isPending}
                onPaste={handlePaste}
                className="min-h-[10rem] w-full flex-1 resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[14rem]"
              />
            </div>
            <div
              className={cn(
                "flex shrink-0 flex-col rounded-lg border border-dashed border-input bg-muted/30 p-3",
                isProjectNote ? "sm:w-[200px]" : "sm:w-[min(100%,280px)]",
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Images
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={isPending}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  disabled={isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-3.5 w-3.5" aria-hidden />
                  Add
                </Button>
              </div>
              {imageUrls.length === 0 ? (
                <p className="flex flex-1 items-center text-center text-xs leading-relaxed text-muted-foreground">
                  Attach images here or paste into the note. Previews appear below — not as long
                  URLs in the text.
                </p>
              ) : (
                <ul className="grid max-h-[min(40vh,320px)] grid-cols-2 gap-2 overflow-y-auto pr-0.5">
                  {imageUrls.map((src, index) => (
                    <li
                      key={`${index}-${src.slice(0, 48)}`}
                      className="group relative aspect-square overflow-hidden rounded-md border bg-background"
                    >
                      <img
                        src={src}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow ring-1 ring-border transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
                        aria-label={`Remove image ${index + 1}`}
                        disabled={isPending}
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={resetAndClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Saving…" : "Create Note"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
