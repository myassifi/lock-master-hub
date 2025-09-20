import { useState } from 'react';
import { Download, FileText, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function DataExport() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleExport = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to export data",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('data-export', {
        body: { format: exportFormat }
      });

      if (error) {
        throw error;
      }

      // Create and download the file
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `locksmith_backup_${timestamp}.${exportFormat}`;
      
      let content: string;
      let mimeType: string;

      if (exportFormat === 'json') {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
      } else {
        // For CSV, the data should already be in text format
        content = typeof data === 'string' ? data : JSON.stringify(data);
        mimeType = 'text/csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Data exported successfully as ${filename}`,
      });

      setDialogOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please log in to access data export features.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Export & Backup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Export all your business data including customers, jobs, inventory, and activities for backup or migration purposes.
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Complete Business Backup</p>
                <p className="text-xs text-muted-foreground">All customers, jobs, inventory, and activity logs</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Export Data</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Choose Export Format</Label>
                    <RadioGroup value={exportFormat} onValueChange={(value: 'json' | 'csv') => setExportFormat(value)} className="mt-3">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="json" id="json" />
                        <Label htmlFor="json" className="cursor-pointer">
                          <div>
                            <p className="font-medium">JSON Format</p>
                            <p className="text-xs text-muted-foreground">
                              Structured data format, preserves all data types and relationships
                            </p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="csv" id="csv" />
                        <Label htmlFor="csv" className="cursor-pointer">
                          <div>
                            <p className="font-medium">CSV Format</p>
                            <p className="text-xs text-muted-foreground">
                              Spreadsheet-friendly format, easily imported into Excel or Google Sheets
                            </p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>What's included:</strong> All your customers, jobs, inventory items, 
                      job-inventory relationships, inventory usage records, and activity logs.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleExport} 
                      disabled={isExporting}
                      className="flex-1"
                    >
                      {isExporting ? 'Exporting...' : 'Download Export'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setDialogOpen(false)}
                      disabled={isExporting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Security:</strong> Only your data is exported. Files are generated locally in your browser.</p>
          <p><strong>Privacy:</strong> No data is sent to external services during export.</p>
        </div>
      </CardContent>
    </Card>
  );
}