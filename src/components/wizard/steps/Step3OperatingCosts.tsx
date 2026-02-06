import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt, Plus, Trash2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { COST_TYPE_LABELS, ALLOCATION_KEY_LABELS, type CostType, type AllocationKey, type WizardData, type OperatingCostItem, type CostItemReceipt } from '@/types/database';

interface Step3Props {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
  operatingCostId: string | null;
}

// Standard 17 BetrKV categories (without 'custom')
const STANDARD_COST_TYPES = Object.keys(COST_TYPE_LABELS).filter(k => k !== 'custom') as CostType[];

export function Step3OperatingCosts({ data, onUpdate }: Step3Props) {
  const [newCustomLabel, setNewCustomLabel] = useState('');
  const [expandedReceipts, setExpandedReceipts] = useState<Record<string, boolean>>({});

  const getCostItem = (costType: CostType, customId?: string): Partial<OperatingCostItem> => {
    if (costType === 'custom' && customId) {
      return data.customCostItems?.find((item) => item.id === customId) || { 
        id: customId,
        cost_type: 'custom', 
        amount: 0, 
        allocation_key: 'area',
        receipts: []
      };
    }
    return data.costItems.find((item) => item.cost_type === costType) || { 
      cost_type: costType, 
      amount: 0, 
      allocation_key: 'area',
      receipts: []
    };
  };

  const updateCostItem = (costType: CostType, updates: Partial<OperatingCostItem>, customId?: string) => {
    if (costType === 'custom' && customId) {
      const existing = data.customCostItems?.find((item) => item.id === customId);
      let newItems: Partial<OperatingCostItem>[];
      
      if (existing) {
        newItems = (data.customCostItems || []).map((item) =>
          item.id === customId ? { ...item, ...updates } : item
        );
      } else {
        newItems = [...(data.customCostItems || []), { id: customId, cost_type: 'custom', amount: 0, allocation_key: 'area' as AllocationKey, ...updates }];
      }
      
      onUpdate({ customCostItems: newItems });
    } else {
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
    }
  };

  const addCustomCategory = () => {
    if (!newCustomLabel.trim()) return;
    
    const newItem: Partial<OperatingCostItem> = {
      id: crypto.randomUUID(),
      cost_type: 'custom',
      custom_label: newCustomLabel.trim(),
      is_custom_category: true,
      amount: 0,
      allocation_key: 'area',
      receipts: []
    };
    
    onUpdate({ customCostItems: [...(data.customCostItems || []), newItem] });
    setNewCustomLabel('');
  };

  const removeCustomCategory = (customId: string) => {
    onUpdate({ 
      customCostItems: (data.customCostItems || []).filter(item => item.id !== customId) 
    });
  };

  // Receipt management
  const addReceipt = (costType: CostType, customId?: string) => {
    const item = getCostItem(costType, customId);
    const newReceipt: CostItemReceipt = {
      id: crypto.randomUUID(),
      description: '',
      amount: 0,
      receipt_date: undefined
    };
    const updatedReceipts = [...(item.receipts || []), newReceipt];
    updateCostItem(costType, { receipts: updatedReceipts }, customId);
  };

  const updateReceipt = (costType: CostType, receiptId: string, updates: Partial<CostItemReceipt>, customId?: string) => {
    const item = getCostItem(costType, customId);
    const updatedReceipts = (item.receipts || []).map(r => 
      r.id === receiptId ? { ...r, ...updates } : r
    );
    
    // Calculate total from receipts
    const receiptsTotal = updatedReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    updateCostItem(costType, { receipts: updatedReceipts, amount: receiptsTotal > 0 ? receiptsTotal : item.amount }, customId);
  };

  const removeReceipt = (costType: CostType, receiptId: string, customId?: string) => {
    const item = getCostItem(costType, customId);
    const updatedReceipts = (item.receipts || []).filter(r => r.id !== receiptId);
    const receiptsTotal = updatedReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    updateCostItem(costType, { receipts: updatedReceipts, amount: receiptsTotal > 0 ? receiptsTotal : 0 }, customId);
  };

  const toggleReceipts = (key: string) => {
    setExpandedReceipts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const totalCosts = data.costItems.reduce((sum, item) => sum + (item.amount || 0), 0) +
    (data.customCostItems || []).reduce((sum, item) => sum + (item.amount || 0), 0);

  const renderCostItemContent = (costType: CostType, item: Partial<OperatingCostItem>, customId?: string) => {
    const key = customId || costType;
    const hasReceipts = (item.receipts?.length || 0) > 0;
    const receiptsTotal = (item.receipts || []).reduce((sum, r) => sum + (r.amount || 0), 0);

    return (
      <div className="space-y-4 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Gesamtbetrag (€)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={item.amount || ''}
              onChange={(e) => updateCostItem(costType, { amount: parseFloat(e.target.value) || 0 }, customId)}
              placeholder="0.00"
              disabled={hasReceipts && receiptsTotal > 0}
            />
            {hasReceipts && receiptsTotal > 0 && (
              <p className="text-xs text-muted-foreground">
                Summe aus Einzelbelegen: {receiptsTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Umlageschlüssel</Label>
            <Select 
              value={item.allocation_key || 'area'} 
              onValueChange={(v) => updateCostItem(costType, { allocation_key: v as AllocationKey }, customId)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ALLOCATION_KEY_LABELS) as AllocationKey[]).map((allocationKey) => (
                  <SelectItem key={allocationKey} value={allocationKey}>
                    {ALLOCATION_KEY_LABELS[allocationKey]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Receipts Section */}
        <div className="border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-between"
            onClick={() => toggleReceipts(key)}
          >
            <span className="text-sm">
              Einzelbelege ({item.receipts?.length || 0})
            </span>
            {expandedReceipts[key] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {expandedReceipts[key] && (
            <div className="mt-3 space-y-3">
              {(item.receipts || []).length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Beschreibung</TableHead>
                        <TableHead className="min-w-[100px]">Betrag</TableHead>
                        <TableHead className="min-w-[120px]">Datum</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(item.receipts || []).map((receipt) => (
                        <TableRow key={receipt.id}>
                          <TableCell>
                            <Input
                              value={receipt.description || ''}
                              onChange={(e) => updateReceipt(costType, receipt.id!, { description: e.target.value }, customId)}
                              placeholder="z.B. Rechnung Stadtwerke"
                              className="h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={receipt.amount || ''}
                              onChange={(e) => updateReceipt(costType, receipt.id!, { amount: parseFloat(e.target.value) || 0 }, customId)}
                              placeholder="0.00"
                              className="h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={receipt.receipt_date || ''}
                              onChange={(e) => updateReceipt(costType, receipt.id!, { receipt_date: e.target.value }, customId)}
                              className="h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeReceipt(costType, receipt.id!, customId)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addReceipt(costType, customId)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Beleg hinzufügen
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
        <Receipt className="h-5 w-5 text-primary flex-shrink-0" />
        <span>Schritt 3: Betriebskosten erfassen</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Erfassen Sie die Betriebskosten nach den 17 Kategorien der Betriebskostenverordnung (BetrKV).
      </p>

      <Accordion type="multiple" className="w-full">
        {STANDARD_COST_TYPES.map((costType) => {
          const item = getCostItem(costType);
          return (
            <AccordionItem key={costType} value={costType}>
              <AccordionTrigger className="hover:no-underline text-sm sm:text-base">
                <div className="flex items-center justify-between w-full pr-4 gap-2">
                  <span className="text-left">{COST_TYPE_LABELS[costType]}</span>
                  {(item.amount || 0) > 0 && (
                    <span className="text-xs sm:text-sm font-normal text-muted-foreground whitespace-nowrap">
                      {(item.amount || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {renderCostItemContent(costType, item)}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Custom Categories Section */}
      <div className="border-t pt-4 sm:pt-6">
        <h3 className="text-base sm:text-lg font-semibold mb-3">Benutzerdefinierte Kategorien</h3>
        
        <Alert variant="default" className="mb-4 border-warning/50 bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-sm text-foreground">
            Benutzerdefinierte Kategorien sind nicht Teil der Betriebskostenverordnung (BetrKV) und möglicherweise nicht rechtlich auf Mieter umlagefähig. Nutzen Sie diese Option mit Bedacht.
          </AlertDescription>
        </Alert>

        {(data.customCostItems || []).length > 0 && (
          <Accordion type="multiple" className="w-full mb-4">
            {(data.customCostItems || []).map((customItem) => (
              <AccordionItem key={customItem.id} value={customItem.id!}>
                <AccordionTrigger className="hover:no-underline text-sm sm:text-base">
                  <div className="flex items-center justify-between w-full pr-4 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-left">{customItem.custom_label}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-warning/20 text-warning-foreground">
                        Benutzerdefiniert
                      </span>
                    </div>
                    {(customItem.amount || 0) > 0 && (
                      <span className="text-xs sm:text-sm font-normal text-muted-foreground whitespace-nowrap">
                        {(customItem.amount || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {renderCostItemContent('custom', customItem, customItem.id)}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeCustomCategory(customItem.id!)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Kategorie entfernen
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={newCustomLabel}
            onChange={(e) => setNewCustomLabel(e.target.value)}
            placeholder="Name der neuen Kategorie"
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={addCustomCategory} 
            disabled={!newCustomLabel.trim()}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Kategorie hinzufügen
          </Button>
        </div>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-base sm:text-lg font-semibold">
          Gesamtkosten: {totalCosts.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
        </p>
      </div>
    </div>
  );
}
