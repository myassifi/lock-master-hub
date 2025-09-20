import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, DollarSign, Users, AlertTriangle, Briefcase, Package, TrendingUp } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Analytics } from '@/components/Analytics';
import { SkeletonCard } from '@/components/LoadingSpinner';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { useErrorHandler } from '@/hooks/useErrorHandler';

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
  const { isLoading, executeAsync } = useErrorHandler();

  // Real-time updates for jobs and inventory
  useRealtimeUpdates({
    table: 'jobs',
    onInsert: () => loadDashboardData(),
    onUpdate: () => loadDashboardData(),
    onDelete: () => loadDashboardData(),
    showNotifications: true
  });

  useRealtimeUpdates({
    table: 'inventory',
    onUpdate: () => loadDashboardData(),
    showNotifications: false
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    await executeAsync(async () => {
      const today = new Date();
      const weekStart = startOfWeek(today);
      const weekEnd = endOfWeek(today);
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);

      // Parallel data fetching for better performance
      const [
        todayJobsData,
        weeklyJobsData,
        monthlyJobsData,
        customerCount,
        lowStockData,
        recentJobsData
      ] = await Promise.all([
        supabase
          .from('jobs')
          .select('*')
          .eq('job_date', format(today, 'yyyy-MM-dd')),
        supabase
          .from('jobs')
          .select('price')
          .gte('job_date', format(weekStart, 'yyyy-MM-dd'))
          .lte('job_date', format(weekEnd, 'yyyy-MM-dd'))
          .eq('status', 'paid'),
        supabase
          .from('jobs')
          .select('price')
          .gte('job_date', format(monthStart, 'yyyy-MM-dd'))
          .lte('job_date', format(monthEnd, 'yyyy-MM-dd'))
          .eq('status', 'paid'),
        supabase
          .from('customers')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('inventory')
          .select('*')
          .lt('quantity', 5),
        supabase
          .from('jobs')
          .select(`
            *,
            customers (name, phone)
          `)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const weeklyRevenue = weeklyJobsData.data?.reduce((sum, job) => sum + (Number(job.price) || 0), 0) || 0;
      const monthlyRevenue = monthlyJobsData.data?.reduce((sum, job) => sum + (Number(job.price) || 0), 0) || 0;

      setStats({
        todayJobs: todayJobsData.data?.length || 0,
        weeklyRevenue,
        monthlyRevenue,
        totalCustomers: customerCount.count || 0,
        lowStockItems: lowStockData.data?.length || 0,
        recentJobs: recentJobsData.data || [],
        lowStockProducts: lowStockData.data || []
      });

      return true;
    }, {
      errorMessage: "Failed to load dashboard data"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'paid': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatJobType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="space-y-6 fade-in">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover-lift glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Jobs</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayJobs}</div>
                <p className="text-xs text-muted-foreground">Jobs scheduled for today</p>
              </CardContent>
            </Card>

            <Card className="hover-lift glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${stats.weeklyRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">This week's earnings</p>
              </CardContent>
            </Card>

            <Card className="hover-lift glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${stats.monthlyRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">This month's earnings</p>
              </CardContent>
            </Card>

            <Card className="hover-lift glass-card">
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
            {/* Enhanced Recent Jobs */}
            <Card className="hover-lift">
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
                    stats.recentJobs.map((job, index) => (
                      <div key={job.id} className={`flex items-center justify-between p-3 rounded-lg border bg-card/50 slide-up`} style={{animationDelay: `${index * 100}ms`}}>
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
                            <p className="text-sm font-medium mt-1">${Number(job.price).toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Low Stock Alert */}
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className={`h-5 w-5 ${stats.lowStockItems > 0 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
                  Low Stock Alert
                  {stats.lowStockItems > 0 && (
                    <Badge variant="destructive" className="animate-pulse">{stats.lowStockItems}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.lowStockProducts.length === 0 ? (
                    <div className="text-center py-4">
                      <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-green-600 font-medium">All items well stocked!</p>
                    </div>
                  ) : (
                    stats.lowStockProducts.map((item, index) => (
                      <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5 slide-up`} style={{animationDelay: `${index * 100}ms`}}>
                        <div>
                          <p className="font-medium">{item.key_type}</p>
                          <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                        </div>
                        <Badge variant="destructive" className="animate-pulse">
                          {item.quantity} left
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}