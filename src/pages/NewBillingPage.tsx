import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { WizardStepper } from '@/components/wizard/WizardStepper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

import { Step1BuildingPeriod } from '@/components/wizard/steps/Step1BuildingPeriod';
import { Step2Leases } from '@/components/wizard/steps/Step2Leases';
import { Step3OperatingCosts } from '@/components/wizard/steps/Step3OperatingCosts';
import { Step4DirectCosts } from '@/components/wizard/steps/Step4DirectCosts';
import { Step5HeatingCosts } from '@/components/wizard/steps/Step5HeatingCosts';
import { Step6Results } from '@/components/wizard/steps/Step6Results';
import { Step7Preview } from '@/components/wizard/steps/Step7Preview';
import { Step8Send } from '@/components/wizard/steps/Step8Send';
import type { WizardData, Building, Lease, OperatingCostItem } from '@/types/database';

const WIZARD_STEPS = [
  { id: 1, title: 'Objekt' },
  { id: 2, title: 'Mietverträge' },
  { id: 3, title: 'Betriebskosten' },
  { id: 4, title: 'Direktkosten' },
  { id: 5, title: 'Heizkosten' },
  { id: 6, title: 'Ergebnisse' },
  { id: 7, title: 'Vorschau' },
  { id: 8, title: 'Versand' },
];

export default function NewBillingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [availableLeases, setAvailableLeases] = useState<Lease[]>([]);
  const [operatingCostId, setOperatingCostId] = useState<string | null>(null);

  const [wizardData, setWizardData] = useState<WizardData>({
    selectedLeaseIds: [],
    costItems: [],
    customCostItems: [],
    directCosts: [],
    heatingTotal: 0,
    heatingAreaPercentage: 30,
    meterReadings: [],
  });

  useEffect(() => {
    const fetchBuildings = async () => {
      const { data } = await supabase.from('buildings').select('*').order('name');
      setBuildings(data || []);
    };

    if (user) fetchBuildings();
  }, [user]);

  useEffect(() => {
    const fetchLeases = async () => {
      if (!wizardData.buildingId || !wizardData.periodStart || !wizardData.periodEnd) {
        setAvailableLeases([]);
        return;
      }

      const { data } = await supabase
        .from('leases')
        .select(`
          *,
          tenant:tenants(*),
          unit:units(*)
        `)
        .eq('unit.building_id', wizardData.buildingId);

      // Filter leases that overlap with the billing period
      const filtered = (data || []).filter((lease: any) => {
        const leaseStart = new Date(lease.start_date);
        const leaseEnd = lease.end_date ? new Date(lease.end_date) : new Date('2099-12-31');
        const periodStart = new Date(wizardData.periodStart!);
        const periodEnd = new Date(wizardData.periodEnd!);

        return leaseStart <= periodEnd && leaseEnd >= periodStart;
      });

      setAvailableLeases(filtered);
    };

    fetchLeases();
  }, [wizardData.buildingId, wizardData.periodStart, wizardData.periodEnd]);

  const updateWizardData = (updates: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = async () => {
    // On step 1, create the operating_cost record
    if (currentStep === 1 && !operatingCostId) {
      if (!wizardData.buildingId || !wizardData.periodStart || !wizardData.periodEnd) {
        toast({ title: 'Fehler', description: 'Bitte füllen Sie alle Felder aus.', variant: 'destructive' });
        return;
      }

      const { data, error } = await supabase
        .from('operating_costs')
        .insert({
          user_id: user!.id,
          building_id: wizardData.buildingId,
          period_start: wizardData.periodStart,
          period_end: wizardData.periodEnd,
          status: 'draft',
        })
        .select()
        .single();

      if (error) {
        toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
        return;
      }

      setOperatingCostId(data.id);
    }

    setCurrentStep((prev) => Math.min(prev + 1, 8));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleComplete = () => {
    toast({ title: 'Erfolg', description: 'Abrechnung wurde erstellt.' });
    navigate('/abrechnungen');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1BuildingPeriod buildings={buildings} data={wizardData} onUpdate={updateWizardData} />;
      case 2:
        return <Step2Leases leases={availableLeases} data={wizardData} onUpdate={updateWizardData} />;
      case 3:
        return <Step3OperatingCosts data={wizardData} onUpdate={updateWizardData} operatingCostId={operatingCostId} />;
      case 4:
        return <Step4DirectCosts data={wizardData} onUpdate={updateWizardData} leases={availableLeases.filter(l => wizardData.selectedLeaseIds.includes(l.id))} operatingCostId={operatingCostId} />;
      case 5:
        return <Step5HeatingCosts data={wizardData} onUpdate={updateWizardData} leases={availableLeases.filter(l => wizardData.selectedLeaseIds.includes(l.id))} operatingCostId={operatingCostId} />;
      case 6:
        return <Step6Results data={wizardData} leases={availableLeases.filter(l => wizardData.selectedLeaseIds.includes(l.id))} operatingCostId={operatingCostId} />;
      case 7:
        return <Step7Preview data={wizardData} operatingCostId={operatingCostId} building={buildings.find(b => b.id === wizardData.buildingId)} />;
      case 8:
        return <Step8Send data={wizardData} leases={availableLeases.filter(l => wizardData.selectedLeaseIds.includes(l.id))} operatingCostId={operatingCostId} onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Neue Nebenkostenabrechnung</h1>
          <p className="text-muted-foreground">Erstellen Sie eine neue Abrechnung in 8 Schritten</p>
        </div>

        <Card>
          <CardHeader>
            <WizardStepper steps={WIZARD_STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />
          </CardHeader>
          <CardContent className="pt-6">
            {renderStep()}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
                Zurück
              </Button>
              {currentStep < 8 ? (
                <Button onClick={handleNext}>
                  Weiter
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
