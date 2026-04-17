"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Download,
  Upload,
  Trash2,
  Save,
  Clock,
  FileJson,
  HardDrive,
  RefreshCw,
  Send,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

interface BackupFile {
  filename: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
}

export function BackupPanel() {
  const { t } = useLanguage();
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showRestore, setShowRestore] = useState<string | null>(null);
  
  // Settings
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [backupInterval, setBackupInterval] = useState("24");
  const [sendToTelegram, setSendToTelegram] = useState(false);
  
  // New backup form
  const [backupType, setBackupType] = useState<"FULL" | "SETTINGS" | "TRADES">("FULL");

  const fetchBackups = async () => {
    try {
      // Simulated backups for demo
      setBackups([
        {
          filename: "backup-full-2024-01-15.json",
          size: 245000,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          modifiedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          filename: "backup-settings-2024-01-14.json",
          size: 12000,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          modifiedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          filename: "backup-full-2024-01-13.json",
          size: 198000,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          modifiedAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);
    } catch (e) {
      console.error("Failed to fetch backups:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const createBackup = async () => {
    setCreating(true);
    try {
      // In production, this would call the API
      const newBackup: BackupFile = {
        filename: `backup-${backupType.toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`,
        size: backupType === "FULL" ? 250000 : backupType === "TRADES" ? 180000 : 15000,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      };

      setBackups([newBackup, ...backups]);
      setShowCreate(false);
      toast.success("Backup created successfully!");
    } catch (e) {
      toast.error("Failed to create backup");
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (filename: string) => {
    try {
      // In production, this would call the API
      toast.success(`Restored from ${filename}`);
      setShowRestore(null);
    } catch (e) {
      toast.error("Failed to restore backup");
    }
  };

  const deleteBackup = async (filename: string) => {
    setBackups(backups.filter((b) => b.filename !== filename));
    toast.success("Backup deleted");
  };

  const downloadBackup = (filename: string) => {
    // In production, this would download the actual file
    toast.success(`Downloading ${filename}...`);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const totalSize = backups.reduce((s, b) => s + b.size, 0);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Save className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{t('createBackup')}</p>
                <p className="text-xs text-muted-foreground">Save current state</p>
              </div>
            </div>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button className="w-full mt-3" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Backup</DialogTitle>
                  <DialogDescription>Choose what to backup</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Backup Type</Label>
                    <Select
                      value={backupType}
                      onValueChange={(v) => setBackupType(v as typeof backupType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL">
                          <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4" />
                            Full Backup (All data)
                          </div>
                        </SelectItem>
                        <SelectItem value="SETTINGS">
                          <div className="flex items-center gap-2">
                            <FileJson className="h-4 w-4" />
                            Settings Only
                          </div>
                        </SelectItem>
                        <SelectItem value="TRADES">
                          <div className="flex items-center gap-2">
                            <FileJson className="h-4 w-4" />
                            Trades Only
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Send to Telegram</Label>
                      <p className="text-xs text-muted-foreground">
                        Receive backup file via Telegram
                      </p>
                    </div>
                    <Switch checked={sendToTelegram} onCheckedChange={setSendToTelegram} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreate(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createBackup} disabled={creating}>
                    {creating ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Create Backup
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium">{t('autoBackup')}</p>
                <p className="text-xs text-muted-foreground">
                  {autoBackupEnabled ? `Every ${backupInterval}h` : "Disabled"}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Enable</Label>
                <Switch checked={autoBackupEnabled} onCheckedChange={setAutoBackupEnabled} />
              </div>
              {autoBackupEnabled && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs">{t('backupInterval')}</Label>
                  <Select value={backupInterval} onValueChange={setBackupInterval}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6h</SelectItem>
                      <SelectItem value="12">12h</SelectItem>
                      <SelectItem value="24">24h</SelectItem>
                      <SelectItem value="48">48h</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <HardDrive className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Storage</p>
                <p className="text-xs text-muted-foreground">
                  {backups.length} backups, {formatSize(totalSize)}
                </p>
              </div>
            </div>
            <Button
              className="w-full mt-3"
              variant="outline"
              onClick={() => fetchBackups()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('backupHistory')}</CardTitle>
          <CardDescription>All backup files</CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HardDrive className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No backups yet</p>
            </div>
          ) : (
            <ScrollArea className="h-72">
              <div className="space-y-2">
                {backups.map((backup) => (
                  <div
                    key={backup.filename}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <FileJson className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium font-mono text-sm">{backup.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatSize(backup.size)} • {new Date(backup.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadBackup(backup.filename)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRestore(backup.filename)}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBackup(backup.filename)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!showRestore} onOpenChange={() => setShowRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Restore Backup
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('restoreWarning')}
              <br />
              <br />
              File: <span className="font-mono">{showRestore}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => showRestore && restoreBackup(showRestore)}>
              <Upload className="h-4 w-4 mr-2" />
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
