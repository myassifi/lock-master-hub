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
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [quickJobData, setQuickJobData] = useState({
    customer_id: '',
    job_type: '',
    price: '',
    notes: ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
    </div>
  );
}