import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, DollarSign, Users, AlertTriangle, Briefcase, Package } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface DashboardStats {
  todayJobs: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  totalCustomers: number;
  lowStockItems: number;
  recentJobs: any[];
  lowStockProducts: any[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todayJobs: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    totalCustomers: 0,
    lowStockItems: 0,
    recentJobs: [],
    lowStockProducts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date();
      const weekStart = startOfWeek(today);
      const weekEnd = endOfWeek(today);
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);

      // Get today's jobs
      const { data: todayJobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('job_date', format(today, 'yyyy-MM-dd'));

      // Get weekly revenue
      const { data: weeklyJobsData } = await supabase
        .from('jobs')
        .select('price')
        .gte('job_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('job_date', format(weekEnd, 'yyyy-MM-dd'))
        .eq('status', 'paid');

      // Get monthly revenue
      const { data: monthlyJobsData } = await supabase
        .from('jobs')
        .select('price')
        .gte('job_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('job_date', format(monthEnd, 'yyyy-MM-dd'))
        .eq('status', 'paid');

      // Get total customers
      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // Get low stock items
      const { data: lowStockData } = await supabase
        .from('inventory')
        .select('*')
        .lt('quantity', 5);

      // Get recent jobs
      const { data: recentJobsData } = await supabase
        .from('jobs')
        .select(`
          *,
          customers (name, phone)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      const weeklyRevenue = weeklyJobsData?.reduce((sum, job) => sum + (Number(job.price) || 0), 0) || 0;
      const monthlyRevenue = monthlyJobsData?.reduce((sum, job) => sum + (Number(job.price) || 0), 0) || 0;

      setStats({
        todayJobs: todayJobsData?.length || 0,
        weeklyRevenue,
        monthlyRevenue,
        totalCustomers: customerCount || 0,
        lowStockItems: lowStockData?.length || 0,
        recentJobs: recentJobsData || [],
        lowStockProducts: lowStockData || []
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatJobType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Jobs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayJobs}</div>
            <p className="text-xs text-muted-foreground">Jobs scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.weeklyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This week's earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This month's earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Active customers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Recent Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentJobs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No jobs found</p>
              ) : (
                stats.recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{job.customers?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatJobType(job.job_type)} - {format(new Date(job.job_date), 'MMM dd')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status.replace(/_/g, ' ')}
                      </Badge>
                      {job.price && (
                        <p className="text-sm font-medium">${Number(job.price).toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Low Stock Alert
              {stats.lowStockItems > 0 && (
                <Badge variant="destructive">{stats.lowStockItems}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.lowStockProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">All items well stocked</p>
              ) : (
                stats.lowStockProducts.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.key_type}</p>
                      <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                    </div>
                    <Badge variant="destructive">
                      {item.quantity} left
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}