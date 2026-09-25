import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import VendorLayout from "@/components/VendorLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Inbox, Calendar, Users, IndianRupee, Mail, Phone } from "lucide-react";

const STATUS_STYLES = {
  Pending: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30",
  Confirmed: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30",
  Cancelled: "bg-red-500/15 text-red-800 dark:text-red-300 border border-red-500/30",
  Completed: "bg-slate-500/15 text-slate-800 dark:text-slate-300 border border-slate-500/30",
};

function formatDate(d) {
  if (!d) return "Date TBC";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function VendorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Booking.list("-created_date", 100);
      setRequests(data);
    } catch (err) {
      toast({ title: "Couldn't load requests", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const respond = async (id, status) => {
    setActingOn(id);
    try {
      await base44.entities.Booking.update(id, { status });
      setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
      toast({ title: status === "Confirmed" ? "Request accepted" : "Request declined" });
    } catch (err) {
      toast({ title: "Couldn't update request", description: err.message, variant: "destructive" });
    } finally {
      setActingOn(null);
    }
  };

  return (
    <VendorLayout>
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-primary/10 shrink-0">
          <Inbox className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Requests</h1>
          <p className="text-sm text-muted-foreground">Booking requests planners have sent to your listing.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground">No requests yet. They'll show up here as soon as a planner books you.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{r.event_type}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status] || "bg-slate-100 text-slate-700"}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{r.client_name}</p>
                </div>
                {r.status === "Pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingOn === r.id}
                      onClick={() => respond(r.id, "Cancelled")}
                    >
                      Decline
                    </Button>
                    <Button size="sm" disabled={actingOn === r.id} onClick={() => respond(r.id, "Confirmed")}>
                      {actingOn === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 shrink-0" /> {formatDate(r.event_date)}
                </div>
                {r.guest_count ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4 shrink-0" /> {r.guest_count} guests
                  </div>
                ) : null}
                {r.budget ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IndianRupee className="w-4 h-4 shrink-0" /> ₹{Number(r.budget).toLocaleString("en-IN")} budget
                  </div>
                ) : null}
                {r.client_email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 shrink-0" /> {r.client_email}
                  </div>
                )}
                {r.client_phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0" /> {r.client_phone}
                  </div>
                )}
              </div>

              {r.notes && (
                <p className="mt-3 text-sm text-foreground bg-muted/50 rounded-lg p-3">{r.notes}</p>
              )}

              {r.status === "Confirmed" && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 font-medium">
                  <span>Platform Commission (8%): <strong>₹{(r.commission_amount || (parseFloat(r.budget || 0) * 0.08)).toLocaleString("en-IN")}</strong></span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 uppercase text-[10px] tracking-wider font-bold border border-amber-500/30">
                    Commission: {r.commission_status || "pending"}
                  </span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </VendorLayout>
  );
}
