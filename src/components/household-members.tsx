"use client";

import { useState } from "react";
import { UserPlus, UserMinus, X, Users, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { inviteMember, removeMember, cancelInvite } from "@/lib/actions/household";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Household {
  id: string;
  name: string;
  members: Member[];
}

interface SentInvite {
  id: string;
  invitee: { id: string; name: string | null; email: string };
}

interface Props {
  household: Household;
  currentUserId: string;
  sentInvites: SentInvite[];
}

export function HouseholdMembers({ household, currentUserId, sentInvites }: Props) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removingMember, setRemovingMember] = useState<{ id: string; name: string | null } | null>(null);
  const [removing, setRemoving] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await inviteMember(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Convite enviado");
      setInviteOpen(false);
    }
    setLoading(false);
  }

  async function handleRemove() {
    if (!removingMember) return;
    setRemoving(true);
    const result = await removeMember(removingMember.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Membro removido");
    }
    setRemoving(false);
    setRemovingMember(null);
  }

  async function handleCancelInvite(inviteId: string) {
    setCancellingId(inviteId);
    const result = await cancelInvite(inviteId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Convite cancelado");
    }
    setCancellingId(null);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            {household.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {household.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 text-sm font-medium">
                    {member.name?.split(" ").map((n) => n[0]).join("").toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{member.name ?? "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
              {member.id !== currentUserId && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setRemovingMember({ id: member.id, name: member.name })}>
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {sentInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>Convites Enviados</span>
              </div>
              <Badge variant="secondary" className="font-mono tabular-nums">
                {sentInvites.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sentInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 text-sm font-medium">
                      {invite.invitee.name?.split(" ").map((n) => n[0]).join("").toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-muted-foreground">
                        {invite.invitee.name ?? "Sem nome"}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Clock className="h-3 w-3" />
                        Pendente
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{invite.invitee.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  disabled={cancellingId === invite.id}
                  onClick={() => handleCancelInvite(invite.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button onClick={() => setInviteOpen(true)}>
        <UserPlus className="mr-2 h-4 w-4" />
        Convidar Membro
      </Button>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do membro</Label>
              <Input id="email" name="email" type="email" placeholder="membro@email.com" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Convidando..." : "Convidar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removingMember}
        onOpenChange={(open) => !open && setRemovingMember(null)}
        title="Remover membro"
        description={`Tem certeza que deseja remover ${removingMember?.name ?? "este membro"} do grupo?`}
        onConfirm={handleRemove}
        loading={removing}
      />
    </div>
  );
}
