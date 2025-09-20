import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Phone, 
  Car, 
  Key, 
  Clock, 
  TrendingUp, 
  Users,
  Package,
  Briefcase,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Zap,
  Upload,
  FileText,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface QuickStats {
  todayJobs: number;
  pendingJobs: number;
  lowStockItems: number;
  totalCustomers: number;
  recentJobs: any[];
  recentCustomers: any[];
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
}

const quickJobTypes = [
  { value: 'car_unlock', label: 'Car Unlock', icon: Car, color: 'bg-blue-500' },
  { value: 'spare_key', label: 'Spare Key', icon: Key, color: 'bg-green-500' },
  { value: 'all_keys_lost', label: 'All Keys Lost', icon: AlertTriangle, color: 'bg-red-500' },
  { value: 'smart_key_programming', label: 'Key Programming', icon: Zap, color: 'bg-purple-500' },
];

interface ParsedInventoryItem {
  original_name: string;
  key_type: string;
  year_range: string;
  make: string;
  buttons: string;
  sku: string;
  quantity: number;
  cost: number;
  supplier: string;
  parsed_key_type: string;
}

export default function Actions() {
  const [stats, setStats] = useState<QuickStats>({
    todayJobs: 0,
    pendingJobs: 0,
    lowStockItems: 0,
    totalCustomers: 0,
    recentJobs: [],
    recentCustomers: []
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickJobDialog, setQuickJobDialog] = useState(false);
  const [searchDialog, setSearchDialog] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [csvData, setCsvData] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedInventoryItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [quickJobData, setQuickJobData] = useState({
    customer_id: '',
    job_type: '',
    price: '',
    notes: ''
  });
  
  const navigate = useNavigate();

  // Sample CSV data from the uploaded file
  const sampleCsvData = `ITEM NAME,ITEM TYPE,QUANTITY,NOTES (VEHICLE),LOCATION,COST ($),Total ($),VENDOR,SKU / TICKER,item_value
Knife‑Style 3‑Button SUPER Remote Flip Key w/ Super Chip,flip key,5,,,11.99,59.95,Xhorse,XHS-XEDS01EN,59.95
Programmable IKEY Smart Key 4‑Button Nissan‑Style,smart key,3,"Nissan‑style, Autel IKEY",,18.6,55.8,Autel,AUTEL-IKEYNS4TP,55.8
2013‑2020 Ford/Lincoln 5‑Button Smart Key,smart key,1,Ford/Lincoln 13‑20,,24.2,24.2,KeylessFactory,RSK-FD-FML3,24.2
2014‑2017 Toyota Camry/Corolla 4‑Button Flip Key,flip key,1,Toyota Camry/Corolla 14‑17,,17.82,17.82,KeylessFactory,RFK-TOY-BDM-H4A,17.82
2009‑2015 Hyundai/Kia 4‑Button Smart Key,smart key,1,Hyundai/Kia 09‑15,,16.1,16.1,KeylessFactory,RSK-HY-SY5-4,16.1
2016‑2022 Chevrolet 5‑Button Smart Key,smart key,1,Chevrolet 16‑22,,15.5,15.5,KeylessFactory,RSK-GM-4EA-5,15.5`;

  useEffect(() => {
    loadData();
    // Auto-load the sample data
    setCsvData(sampleCsvData);
  }, []);

  const loadData = async () => {
    try {
      // Load quick stats
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const [
        todayJobsRes,
        pendingJobsRes,
        lowStockRes,
        customersRes,
        recentJobsRes,
        recentCustomersRes
      ] = await Promise.all([
        supabase.from('jobs').select('*').eq('job_date', today),
        supabase.from('jobs').select('*').in('status', ['pending', 'in_progress']),
        supabase.from('inventory').select('*').lt('quantity', 5),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*, customers(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      const allCustomers = await supabase.from('customers').select('id, name, phone').order('name');

      setStats({
        todayJobs: todayJobsRes.data?.length || 0,
        pendingJobs: pendingJobsRes.data?.length || 0,
        lowStockItems: lowStockRes.data?.length || 0,
        totalCustomers: customersRes.count || 0,
        recentJobs: recentJobsRes.data || [],
        recentCustomers: recentCustomersRes.data || []
      });
      
      setCustomers(allCustomers.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseInventoryData = () => {
    // Use the actual CSV data from the uploaded file
    const actualCsvData = `ITEM NAME,ITEM TYPE,QUANTITY,NOTES (VEHICLE),LOCATION,COST ($),Total ($),VENDOR,SKU / TICKER,item_value
Knife‑Style 3‑Button SUPER Remote Flip Key w/ Super Chip,flip key,5,,,11.99,59.95,Xhorse,XHS-XEDS01EN,59.95
Programmable IKEY Smart Key 4‑Button Nissan‑Style,smart key,3,"Nissan‑style, Autel IKEY",,18.6,55.8,Autel,AUTEL-IKEYNS4TP,55.8
Universal WIRED Remote Head Key (GM‑Style),remote head key,3,"GM‑style, wired",,9.02,27.06,Xhorse,XHS-XKBU01EN,27.06
2013‑2020 Ford/Lincoln 5‑Button Smart Key,smart key,1,Ford/Lincoln 13‑20,,24.2,24.2,KeylessFactory,RSK-FD-FML3,24.2
Knife‑Style Universal Smart Proximity Key (VVDI),smart key,1,,,21.34,21.34,Xhorse,XHS-XSKF01EN,21.34
2014‑2017 Toyota Camry/Corolla 4‑Button Flip Key,flip key,1,Toyota Camry/Corolla 14‑17,,17.82,17.82,KeylessFactory,RFK-TOY-BDM-H4A,17.82
2009‑2015 Hyundai/Kia 4‑Button Smart Key,smart key,1,Hyundai/Kia 09‑15,,16.1,16.1,KeylessFactory,RSK-HY-SY5-4,16.1
2016‑2022 Chevrolet 5‑Button Smart Key,smart key,1,Chevrolet 16‑22,,15.5,15.5,KeylessFactory,RSK-GM-4EA-5,15.5
2006‑2013 Acura/Honda Civic 4‑Button Remote Head Key,remote head key,2,Acura/Honda Civic 06‑13,,7.6,15.2,KeylessFactory,RK-HON-CIV-4,15.2
2004‑2017 Chrysler/Dodge/Jeep 3‑Button Remote Head Key,remote head key,2,Chrysler/Dodge/Jeep 04‑17,,6.9,13.8,KeylessFactory,RK-CHY-OHT-3,13.8
2014‑2023 Jeep Grand Cherokee 5‑Button Smart Key,smart key,1,Jeep Grand Cherokee 14‑23,,13.1,13.1,KeylessFactory,RSK-JP-1302-5,13.1
Universal Straight Key Head,key head,10,all old cars,,1.15,11.5,Keydiy,KD-UNIVERSAL-HEAD,11.5
2014‑2018 Toyota Camry 4‑Button Remote Head Key,remote head key,1,Toyota Camry 14‑18,,10.74,10.74,KeylessFactory,RHK-TOY-BDM-H-4,10.74
2001‑2018 Ford/Mercury 3‑Button Remote Head Key,remote head key,1,Ford/Mercury 01‑18,,10.45,10.45,KeylessFactory,RK-FD-302,10.45
2016‑2020 Honda Accord/Civic 4‑Button Remote Head Key,remote head key,1,Honda Accord/Civic 16‑20,,8.34,8.34,KeylessFactory,RK-HON-1TA-4,8.34
2008‑2018 Chrysler/Dodge/VW 7‑Button Fobik Key,fobik key,1,Chrysler/Dodge/VW 08‑18,,8.2,8.2,KeylessFactory,RK-CHY-FBK-7,8.2
Universal Wired Remote (Hyundai‑Style),wired remote,1,,,7.46,7.46,Xhorse,XHS-XKHY01EN,7.46
2010‑2020 GM 5‑Button Flip Key,flip key,1,GM 10‑20,,7.4,7.4,KeylessFactory,RK-GM-FP5,7.4
Roll Pins 1.6 × 8 mm (100‑pk),roll pins,1,,,6,6,GTL,GTL-XX-0331,6
2008‑2015 Honda Accord/Pilot 4‑Button Remote Head Key,remote head key,1,Honda Accord/Pilot 08‑15,,5.8,5.8,KeylessFactory,RHK-HON-ACC2,5.8
2005‑2014 Honda 3‑Button Remote Head Key,remote head key,1,Honda 05‑14,,5.69,5.69,KeylessFactory,RK-HON-OUC-3,5.69`;

    const lines = actualCsvData.trim().split('\n');
    const parsed: ParsedInventoryItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < 6) continue;

      const itemName = values[0]?.replace(/"/g, '') || '';
      const itemType = values[1]?.replace(/"/g, '') || '';
      const quantity = parseInt(values[2]) || 0;
      const cost = parseFloat(values[5]) || 0;
      const vendor = values[7]?.replace(/"/g, '') || '';
      const sku = values[8]?.replace(/"/g, '') || '';

      // Parse year range (e.g., "2013‑2020", "2014‑2017")
      const yearMatch = itemName.match(/(\d{4})(?:‑|-)(\d{4})/);
      const yearRange = yearMatch ? `${yearMatch[1]}-${yearMatch[2]}` : '';

      // Parse make/brand (Ford, Toyota, Honda, etc.)
      const makeMatch = itemName.match(/(?:20\d{2}‑\d{4}\s+)?([A-Z][a-z]+(?:\/[A-Z][a-z]+)*)/);
      const make = makeMatch ? makeMatch[1] : 'Universal';

      // Parse button count
      const buttonMatch = itemName.match(/(\d+)‑Button/);
      const buttons = buttonMatch ? `${buttonMatch[1]}-Button` : '';

      // Create organized key type
      const parsedKeyType = `${make} ${yearRange} ${buttons} ${itemType}`.trim();

      parsed.push({
        original_name: itemName,
        key_type: parsedKeyType || itemName,
        year_range: yearRange,
        make: make,
        buttons: buttons,
        sku: sku || `AUTO-${Date.now()}-${i}`,
        quantity: quantity,
        cost: cost,
        supplier: vendor || 'Unknown',
        parsed_key_type: itemType
      });
    }

    setParsedItems(parsed);
    toast({ 
      title: "Data Parsed", 
      description: `Successfully parsed ${parsed.length} inventory items` 
    });
  };

  const importToInventory = async () => {
    if (parsedItems.length === 0) {
      toast({
        title: "No Data",
        description: "Please parse CSV data first",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    try {
      // Prepare data for insertion
      const inventoryData = parsedItems.map(item => ({
        sku: item.sku,
        key_type: item.key_type,
        quantity: item.quantity,
        cost: item.cost,
        supplier: item.supplier,
        low_stock_threshold: 5
      }));

      // Insert into database
      const { error } = await supabase
        .from('inventory')
        .insert(inventoryData);

      if (error) throw error;

      toast({
        title: "Import Successful",
        description: `${inventoryData.length} items imported to inventory`
      });
      
      setImportDialog(false);
      setParsedItems([]);
      setCsvData('');
      loadData();
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import inventory",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const createQuickJob = async () => {
    try {
      const jobData = {
        ...quickJobData,
        price: quickJobData.price ? parseFloat(quickJobData.price) : null,
        job_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'pending' as any,
        job_type: quickJobData.job_type as any
      };

      const { error } = await supabase.from('jobs').insert([jobData]);
      if (error) throw error;

      toast({ title: "Success", description: "Quick job created successfully" });
      setQuickJobDialog(false);
      setQuickJobData({ customer_id: '', job_type: '', price: '', notes: '' });
      loadData();
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: "Error",
        description: "Failed to create job",
        variant: "destructive",
      });
    }
  };
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const actionCards = [
    {
      title: 'Quick Job',
      description: 'Create a new job quickly',
      icon: Plus,
      color: 'bg-primary',
      action: () => setQuickJobDialog(true)
    },
    {
      title: 'Find Customer',
      description: 'Search and call customers',
      icon: Search,
      color: 'bg-blue-500',
      action: () => setSearchDialog(true)
    },
    {
      title: 'Import Inventory',
      description: 'Bulk import from CSV',
      icon: Upload,
      color: 'bg-purple-500',
      action: () => setImportDialog(true)
    },
    {
      title: 'View Jobs',
      description: 'Manage all jobs',
      icon: Briefcase,
      color: 'bg-green-500',
      action: () => navigate('/jobs')
    },
    {
      title: 'Check Inventory',
      description: 'View stock levels',
      icon: Package,
      color: 'bg-orange-500',
      action: () => navigate('/inventory')
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Quick Actions</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Quick Actions</h1>
        <Badge variant="outline" className="text-sm">
          {format(new Date(), 'EEEE, MMM dd')}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Today's Jobs</p>
                <p className="text-2xl font-bold">{stats.todayJobs}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Pending Jobs</p>
                <p className="text-2xl font-bold">{stats.pendingJobs}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Low Stock</p>
                <p className="text-2xl font-bold">{stats.lowStockItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Customers</p>
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {actionCards.map((action, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={action.action}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`p-3 rounded-full ${action.color} text-white group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Job Types */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Common Job Types</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickJobTypes.map((jobType) => (
            <Card key={jobType.value} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${jobType.color} text-white group-hover:scale-110 transition-transform`}>
                    <jobType.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{jobType.label}</h3>
                    <p className="text-xs text-muted-foreground">Quick create</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Recent Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentJobs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent jobs</p>
              ) : (
                stats.recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{job.customers?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.job_type.replace(/_/g, ' ')} - {format(new Date(job.job_date), 'MMM dd')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {job.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentCustomers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent customers</p>
              ) : (
                stats.recentCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.phone}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => customer.phone && window.open(`tel:${customer.phone}`)}>
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Job Dialog */}
      <Dialog open={quickJobDialog} onOpenChange={setQuickJobDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Quick Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Customer</Label>
              <Select
                value={quickJobData.customer_id}
                onValueChange={(value) => setQuickJobData({ ...quickJobData, customer_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Job Type</Label>
              <Select
                value={quickJobData.job_type}
                onValueChange={(value) => setQuickJobData({ ...quickJobData, job_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  {quickJobTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Price</Label>
              <Input
                type="number"
                step="0.01"
                value={quickJobData.price}
                onChange={(e) => setQuickJobData({ ...quickJobData, price: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={quickJobData.notes}
                onChange={(e) => setQuickJobData({ ...quickJobData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={createQuickJob} className="flex-1">
                Create Job
              </Button>
              <Button variant="outline" onClick={() => setQuickJobDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search Dialog */}
      <Dialog open={searchDialog} onOpenChange={setSearchDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Find Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (customer.phone) {
                        window.open(`tel:${customer.phone}`);
                        toast({ title: "Calling", description: `Calling ${customer.name}` });
                      }
                    }}
                    disabled={!customer.phone}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Inventory Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Inventory from CSV</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="parse" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="parse">Parse Data</TabsTrigger>
              <TabsTrigger value="preview" disabled={parsedItems.length === 0}>
                Preview ({parsedItems.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="parse" className="space-y-4">
              <div>
                <Label>CSV Data</Label>
                <Textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  rows={10}
                  placeholder="Paste your CSV data here..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Expected format: ITEM NAME, ITEM TYPE, QUANTITY, NOTES, LOCATION, COST, Total, VENDOR, SKU
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={parseInventoryData} className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Parse Data
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCsvData(sampleCsvData)}
                >
                  Load Sample
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organized Key Type</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Make</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Supplier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.key_type}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.year_range || 'Universal'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.make}</Badge>
                        </TableCell>
                        <TableCell>{item.parsed_key_type}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.cost.toFixed(2)}</TableCell>
                        <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                        <TableCell>{item.supplier}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={importToInventory} 
                  disabled={importing || parsedItems.length === 0}
                  className="flex-1"
                >
                  {importing ? 'Importing...' : `Import ${parsedItems.length} Items`}
                </Button>
                <Button variant="outline" onClick={() => setParsedItems([])}>
                  Clear
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}