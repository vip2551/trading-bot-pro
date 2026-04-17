"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Shield,
  BarChart3,
  RefreshCw,
  Trash2,
  Search,
  Mail,
  CheckCircle,
  XCircle,
  Crown,
  AlertTriangle,
  UserX,
  Database,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";

interface User {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  subscription?: {
    planName: string;
    status: string;
    isTrial: boolean;
  } | null;
}

interface AuditLog {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  user?: {
    email: string;
    name: string | null;
  } | null;
}

interface AdminPanelProps {
  isAdmin?: boolean;
}

export function AdminPanel({ isAdmin = false }: AdminPanelProps) {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, totalTrades: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, logsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/users?page=${page}&search=${encodeURIComponent(search)}`).catch(() => null),
        fetch("/api/admin/logs?page=1&limit=50").catch(() => null),
        fetch("/api/analytics").catch(() => null),
      ]);

      const usersData = usersRes ? await usersRes.json() : { users: [], total: 0 };
      const logsData = logsRes ? await logsRes.json() : { logs: [] };
      const statsData = statsRes ? await statsRes.json() : { summary: { totalUsers: 0, activeUsers: 0, totalTrades: 0 } };

      setUsers(usersData.users || []);
      setTotalUsers(usersData.total || 0);
      setLogs(logsData.logs || []);
      setStats(statsData.summary || { totalUsers: 0, activeUsers: 0, totalTrades: 0 });
    } catch (e) {
      console.error('Admin fetch error:', e);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, fetchData]);

  const toggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isAdmin: !currentIsAdmin }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.user.isAdmin ? "Admin granted" : "Admin revoked");
        fetchData();
      } else {
        toast.error(data.error || "Failed to update");
      }
    } catch (e) {
      toast.error("Failed to update user");
    }
  };

  const verifyEmail = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, emailVerified: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Email verified");
        fetchData();
      } else {
        toast.error(data.error || "Failed to verify");
      }
    } catch (e) {
      toast.error("Failed to verify email");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("User deleted");
        fetchData();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch (e) {
      toast.error("Failed to delete user");
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("LOGIN")) return "text-blue-500";
    if (action.includes("TRADE")) return "text-green-500";
    if (action.includes("DELETE")) return "text-red-500";
    return "text-muted-foreground";
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-xl font-bold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have admin privileges</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Admin Panel</h2>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-3xl font-bold">{stats.activeUsers}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-3xl font-bold">{stats.totalTrades}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" />Users ({users.length})</TabsTrigger>
          <TabsTrigger value="logs"><Database className="h-4 w-4 mr-2" />Audit Logs ({logs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by email or name..."
              className="pl-10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              {users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <UserX className="h-12 w-12 mb-2" />
                  <p>No users found</p>
                  <p className="text-sm">Users will appear here when they register</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-background border-b">
                      <tr>
                        <th className="text-left p-3">User</th>
                        <th className="text-left p-3">Plan</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Role</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/30">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{user.name || "No name"}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            {user.subscription ? (
                              <Badge className={
                                user.subscription.isTrial ? "bg-yellow-500/10 text-yellow-500" :
                                user.subscription.status === "ACTIVE" ? "bg-green-500/10 text-green-500" :
                                "bg-red-500/10 text-red-500"
                              }>
                                {user.subscription.planName}
                              </Badge>
                            ) : (
                              <Badge variant="outline">No plan</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              {user.emailVerified ? (
                                <Badge className="bg-green-500/10 text-green-500"><Mail className="h-3 w-3" /></Badge>
                              ) : (
                                <Badge className="bg-yellow-500/10 text-yellow-500"><Mail className="h-3 w-3" /></Badge>
                              )}
                              {user.twoFactorEnabled && (
                                <Badge className="bg-blue-500/10 text-blue-500"><Shield className="h-3 w-3" /></Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            {user.isAdmin ? (
                              <Badge className="bg-purple-500/10 text-purple-500"><Crown className="h-3 w-3 mr-1" />Admin</Badge>
                            ) : (
                              <Badge variant="outline">User</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              {!user.emailVerified && (
                                <Button size="sm" variant="ghost" onClick={() => verifyEmail(user.id)} title="Verify Email">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => toggleAdmin(user.id, user.isAdmin)} title={user.isAdmin ? "Remove Admin" : "Make Admin"}>
                                <Crown className={`h-4 w-4 ${user.isAdmin ? "text-purple-500" : "text-muted-foreground"}`} />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteUser(user.id)} title="Delete User">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Database className="h-12 w-12 mb-2" />
                  <p>No audit logs yet</p>
                  <p className="text-sm">Activity logs will appear here</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="p-4 space-y-2">
                    {logs.map((log) => (
                      <div key={log.id} className="p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium ${getActionColor(log.action)}`}>{log.action}</span>
                          <div className="flex items-center gap-2">
                            {log.status === "SUCCESS" ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {log.user && (
                          <p className="text-sm text-muted-foreground">{log.user.email}</p>
                        )}
                        {log.errorMessage && (
                          <p className="text-sm text-red-500">{log.errorMessage}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
