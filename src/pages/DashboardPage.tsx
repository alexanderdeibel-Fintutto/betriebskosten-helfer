import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, FileText, Receipt, Plus, ArrowRight } from 'lucide-react';
import { STATUS_LABELS, type OperatingCostStatus } from '@/types/database';

interface Stats {
  buildings: number;
  tenants: number;
  leases: number;
  draftBillings: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ buildings: 0, tenants: 0, leases: 0, draftBillings: 0 });
  const [recentBillings, setRecentBillings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      const [buildingsRes, tenantsRes, leasesRes, billingsRes, recentRes] = await Promise.all([
        supabase.from('buildings').select('id', { count: 'exact', head: true }),
        supabase.from('tenants').select('id', { count: 'exact', head: true }),
        supabase.from('leases').select('id', { count: 'exact', head: true }),
        supabase.from('operating_costs').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('operating_costs').select(`
          *,
          building:buildings(name, street, house_number, city)
        `).order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        buildings: buildingsRes.count || 0,
        tenants: tenantsRes.count || 0,
        leases: leasesRes.count || 0,
        draftBillings: billingsRes.count || 0,
      });

      setRecentBillings(recentRes.data || []);
      setLoading(false);
    };

    fetchStats();
  }, [user]);

  const getStatusBadgeVariant = (status: OperatingCostStatus) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'calculated': return 'default';
      case 'sent': return 'outline';
      case 'completed': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Übersicht Ihrer Nebenkostenabrechnungen</p>
          </div>
          <Link to="/abrechnungen/neu">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neue Abrechnung
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gebäude</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.buildings}</div>
              <Link to="/gebaeude" className="text-xs text-secondary hover:underline">
                Verwalten →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mieter</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tenants}</div>
              <Link to="/mieter" className="text-xs text-secondary hover:underline">
                Verwalten →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mietverträge</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.leases}</div>
              <Link to="/mietvertraege" className="text-xs text-secondary hover:underline">
                Verwalten →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offene Abrechnungen</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draftBillings}</div>
              <Link to="/abrechnungen" className="text-xs text-secondary hover:underline">
                Alle anzeigen →
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Billings */}
        <Card>
          <CardHeader>
            <CardTitle>Aktuelle Abrechnungen</CardTitle>
            <CardDescription>Ihre zuletzt erstellten Nebenkostenabrechnungen</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Laden...</div>
            ) : recentBillings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Sie haben noch keine Abrechnungen erstellt.</p>
                <Link to="/abrechnungen/neu">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Erste Abrechnung erstellen
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBillings.map((billing) => (
                  <div key={billing.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">
                        {billing.building?.name || 'Gebäude'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {billing.building?.street} {billing.building?.house_number}, {billing.building?.city}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Zeitraum: {new Date(billing.period_start).toLocaleDateString('de-DE')} - {new Date(billing.period_end).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={getStatusBadgeVariant(billing.status)}>
                        {STATUS_LABELS[billing.status as OperatingCostStatus]}
                      </Badge>
                      <Link to={`/abrechnungen/${billing.id}`}>
                        <Button variant="ghost" size="icon">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
