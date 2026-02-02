import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Receipt } from 'lucide-react';
import { COST_TYPE_LABELS, ALLOCATION_KEY_LABELS, type CostType, type AllocationKey, type WizardData, type OperatingCostItem } from '@/types/database';

interface Step3Props {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
  operatingCostId: string | null;
}

const COST_TYPES = Object.keys(COST_TYPE_LABELS) as CostType[];

export function Step3OperatingCosts({ data, onUpdate }: Step3Props) {
  const getCostItem = (costType: CostType): Partial<OperatingCostItem> => {
    return data.costItems.find((item) => item.cost_type === costType) || { cost_type: costType, amount: 0, allocation_key: 'area' };
  };

  const updateCostItem = (costType: CostType, updates: Partial<OperatingCostItem>) => {
    const existing = data.costItems.find((item) => item.cost_type === costType);
    let newItems: Partial<OperatingCostItem>[];
    
    if (existing) {
      newItems = data.costItems.map((item) =>
        item.cost_type === costType ? { ...item, ...updates } : item
      );
    } else {
      newItems = [...data.costItems, { cost_type: costType, amount: 0, allocation_key: 'area' as AllocationKey, ...updates }];
    }
    
    onUpdate({ costItems: newItems });
  };

  const totalCosts = data.costItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Receipt className="h-5 w-5 text-primary" />
        <span>Schritt 3: Betriebskosten erfassen</span>
      </div>
      <p className="text-muted-foreground">
        Erfassen Sie die Betriebskosten nach den 17 Kategorien der Betriebskostenverordnung (BetrKV).
      </p>

      <Accordion type="multiple" className="w-full">
        {COST_TYPES.map((costType) => {
          const item = getCostItem(costType);
          return (
            <AccordionItem key={costType} value={costType}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <span>{COST_TYPE_LABELS[costType]}</span>
                  {(item.amount || 0) > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {(item.amount || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label>Gesamtbetrag (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.amount || ''}
                      onChange={(e) => updateCostItem(costType, { amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Umlageschlüssel</Label>
                    <Select 
                      value={item.allocation_key || 'area'} 
                      onValueChange={(v) => updateCostItem(costType, { allocation_key: v as AllocationKey })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ALLOCATION_KEY_LABELS) as AllocationKey[]).map((key) => (
                          <SelectItem key={key} value={key}>
                            {ALLOCATION_KEY_LABELS[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-lg font-semibold">
          Gesamtkosten: {totalCosts.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
        </p>
      </div>
    </div>
  );
}
