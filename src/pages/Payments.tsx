import { useState, useEffect } from 'react';
import { Search, Download, DollarSign, Calendar, User, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Job {
  id: string;
  customer_id: string;
  job_type: string;
  price?: number;
  job_date: string;
  status: string;
  vehicle_lock_details?: string;
  customers?: {
    name: string;
    phone?: string;
    email?: string;
  };
}

export default function Payments() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customers (name, phone, email)
        `)
        .not('price', 'is', null)
        .order('job_date', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus as any })
        .eq('id', jobId);

      if (error) throw error;
      
      toast({ 
        title: "Success", 
        description: `Job marked as ${newStatus.replace(/_/g, ' ')}` 
      });
      loadJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const exportToCsv = () => {
    const headers = ['Date', 'Customer', 'Job Type', 'Amount', 'Status', 'Phone', 'Email'];
    const csvData = filteredJobs.map(job => [
      format(new Date(job.job_date), 'yyyy-MM-dd'),
      job.customers?.name || '',
      formatJobType(job.job_type),
      job.price || 0,
      job.status,
      job.customers?.phone || '',
      job.customers?.email || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heat-wave-payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: "Success", description: "Payment data exported successfully" });
  };

  const generateReceipt = (job: Job) => {
    const receiptContent = `
HEAT WAVE LOCKSMITH
Professional Locksmith Services

RECEIPT
Date: ${format(new Date(), 'PPP')}
Job Date: ${format(new Date(job.job_date), 'PPP')}

Customer: ${job.customers?.name}
Phone: ${job.customers?.phone || 'N/A'}
Email: ${job.customers?.email || 'N/A'}

Service: ${formatJobType(job.job_type)}
Details: ${job.vehicle_lock_details || 'N/A'}

Amount: $${Number(job.price).toFixed(2)}
Status: ${job.status.replace(/_/g, ' ').toUpperCase()}

Thank you for your business!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${job.customers?.name?.replace(/\s+/g, '-')}-${format(new Date(job.job_date), 'yyyy-MM-dd')}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: "Success", description: "Receipt generated successfully" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatJobType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.job_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = filteredJobs
    .filter(job => job.status === 'paid')
    .reduce((sum, job) => sum + (Number(job.price) || 0), 0);

  const pendingAmount = filteredJobs
    .filter(job => job.status !== 'paid')
    .reduce((sum, job) => sum + (Number(job.price) || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Payments & Invoices</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">Payments & Invoices</h1>
        <Button onClick={exportToCsv} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Paid jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Unpaid jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredJobs.length}</div>
            <p className="text-xs text-muted-foreground">With pricing</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or job type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No jobs found matching your filters.' 
                  : 'No jobs with pricing found.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{job.customers?.name}</p>
                        <p className="text-sm text-muted-foreground">{job.customers?.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{format(new Date(job.job_date), 'MMM dd, yyyy')}</p>
                        <p className="text-sm text-muted-foreground">{formatJobType(job.job_type)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-lg">${Number(job.price).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Amount</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateReceipt(job)}
                      className="gap-2"
                    >
                      <Receipt className="h-4 w-4" />
                      Receipt
                    </Button>
                    
                    {job.status !== 'paid' && (
                      <Button
                        size="sm"
                        onClick={() => updateJobStatus(job.id, 'paid')}
                        className="gap-2"
                      >
                        <DollarSign className="h-4 w-4" />
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </div>
                
                {job.vehicle_lock_details && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Details:</span> {job.vehicle_lock_details}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}