import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ArrowRight, Receipt } from 'lucide-react';
import { STATUS_LABELS, type OperatingCostStatus } from '@/types/database';

export default function BillingsPage() {
  const { user } = useAuth();
  const [billings, setBillings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBillings = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('operating_costs')
        .select(`
          *,
          building:buildings(name, street, house_number, city)
        `)
        .order('created_at', { ascending: false });

      setBillings(data || []);
      setLoading(false);
    };

    fetchBillings();
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
            <h1 className="text-3xl font-bold">Abrechnungen</h1>
            <p className="text-muted-foreground">Ihre Nebenkostenabrechnungen</p>
          </div>
          <Link to="/abrechnungen/neu">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neue Abrechnung
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alle Abrechnungen</CardTitle>
            <CardDescription>{billings.length} Abrechnungen insgesamt</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Laden...</div>
            ) : billings.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Noch keine Abrechnungen vorhanden.</p>
                <Link to="/abrechnungen/neu">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Erste Abrechnung erstellen
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gebäude</TableHead>
                    <TableHead>Zeitraum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erstellt am</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billings.map((billing) => (
                    <TableRow key={billing.id}>
                      <TableCell>
                        <div className="font-medium">{billing.building?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {billing.building?.street} {billing.building?.house_number}, {billing.building?.city}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(billing.period_start).toLocaleDateString('de-DE')} - {new Date(billing.period_end).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(billing.status)}>
                          {STATUS_LABELS[billing.status as OperatingCostStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(billing.created_at).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/abrechnungen/${billing.id}`}>
                          <Button variant="ghost" size="icon">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
