import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Banknote,
  Boxes,
  TriangleAlert,
  Tags,
  Plus,
  RefreshCw,
  Moon,
  Sun,
  Calendar,
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import { toast } from '@/hooks/use-toast';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { ActivityPanel } from '@/components/dashboard/ActivityPanel';
import { formatCurrency, formatNumber } from '@/lib/format';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { subDays, subMonths, format, startOfDay, endOfDay } from 'date-fns';

interface DashboardData {
  kpis: {
    totalValue: number;
    totalItems: number;
    lowStock: number;
    categories: number;
    deltas: {
      totalValue: number;
      totalItems: number;
      lowStock: number;
      categories: number;
    };
  };
  weeklyRevenue: Array<{ date: string; value: number }>;
  monthlyRevenue: Array<{ date: string; value: number }>;
  customers: { total: number; newThisPeriod: number };
  jobs: { total: number; pending: number; completed: number };
  alerts: Array<{
    id: string;
    type: 'low-stock' | 'job' | 'customer';
    title: string;
    subtitle?: string;
    qty?: number;
    threshold?: number;
    timestamp?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  }>;
  revenueByService: Array<{ name: string; value: number }>;
  jobsByStatus: Array<{ name: string; value: number }>;
}

export default function DashboardNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('7');
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    kpis: {
      totalValue: 0,
      totalItems: 0,
      lowStock: 0,
      categories: 0,
      deltas: { totalValue: 0, totalItems: 0, lowStock: 0, categories: 0 },
    },
    weeklyRevenue: [],
    monthlyRevenue: [],
    customers: { total: 0, newThisPeriod: 0 },
    jobs: { total: 0, pending: 0, completed: 0 },
    alerts: [],
    revenueByService: [],
    jobsByStatus: [],
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const days = parseInt(dateRange);
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      // Fetch all data in parallel
      const [inventoryRes, customersRes, jobsRes, previousInventoryRes] = await Promise.all([
        supabase.from('inventory').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('jobs').select('*'),
        supabase.from('inventory').select('*'), // For delta calculation
      ]);

      const inventory = inventoryRes.data || [];
      const customers = customersRes.data || [];
      const jobs = jobsRes.data || [];

      // Calculate KPIs
      const totalValue = inventory.reduce((sum, item) => sum + (item.total_cost_value || 0), 0);
      const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
      const lowStock = inventory.filter(
        (item) => item.quantity <= (item.low_stock_threshold || 3) && item.quantity > 0
      ).length;
      const categories = new Set(inventory.map((item) => item.category).filter(Boolean)).size;

      // Calculate deltas (mock for now - would need historical data)
      const deltas = {
        totalValue: 5.2,
        totalItems: 2.1,
        lowStock: -10.5,
        categories: 0,
      };

      // Weekly revenue data
      const weeklyRevenue = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const revenue = jobs
          .filter(
            (job) =>
              job.status === 'paid' && format(new Date(job.job_date), 'yyyy-MM-dd') === dateStr
          )
          .reduce((sum, job) => sum + (Number(job.price) || 0), 0);
        return { date: format(date, 'EEE'), value: revenue };
      });

      // Monthly revenue data
      const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
        const date = subMonths(new Date(), 11 - i);
        const monthStr = format(date, 'yyyy-MM');
        const revenue = jobs
          .filter(
            (job) =>
              job.status === 'paid' &&
              format(new Date(job.job_date), 'yyyy-MM') === monthStr
          )
          .reduce((sum, job) => sum + (Number(job.price) || 0), 0);
        return { date: format(date, 'MMM'), value: revenue };
      });

      // Customer stats
      const newCustomers = customers.filter(
        (c) => new Date(c.created_at) >= startDate
      ).length;

      // Jobs stats
      const jobsInPeriod = jobs.filter((j) => new Date(j.created_at) >= startDate);
      const pendingJobs = jobs.filter((j) => j.status === 'pending').length;
      const completedJobs = jobs.filter((j) => j.status === 'paid').length;

      // Alerts - Low stock items
      const lowStockAlerts = inventory
        .filter((item) => item.quantity <= (item.low_stock_threshold || 3))
        .slice(0, 10)
        .map((item) => ({
          id: item.id,
          type: 'low-stock' as const,
          title: item.sku || 'Unknown Item',
          subtitle: item.fcc_id ? `FCC ID: ${item.fcc_id}` : undefined,
          qty: item.quantity,
          threshold: item.low_stock_threshold || 3,
          action: {
            label: 'View',
            onClick: () => navigate('/inventory'),
          },
        }));

      // Revenue by service type (mock data - would need job_type categorization)
      const jobTypes = jobs.reduce((acc, job) => {
        const type = job.job_type || 'other';
        acc[type] = (acc[type] || 0) + (Number(job.price) || 0);
        return acc;
      }, {} as Record<string, number>);

      const revenueByService = Object.entries(jobTypes).map(([name, value]) => ({
        name,
        value,
      }));

      // Jobs by status
      const statusCounts = jobs.reduce((acc, job) => {
        const status = job.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const jobsByStatus = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
      }));

      setDashboardData({
        kpis: {
          totalValue,
          totalItems,
          lowStock,
          categories,
          deltas,
        },
        weeklyRevenue,
        monthlyRevenue,
        customers: { total: customers.length, newThisPeriod: newCustomers },
        jobs: { total: jobs.length, pending: pendingJobs, completed: completedJobs },
        alerts: lowStockAlerts,
        revenueByService,
        jobsByStatus,
      });
    } catch (error) {
      console.error('Dashboard load error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast({
      title: 'Refreshed',
      description: 'Dashboard data updated',
    });
  };

  const hasRevenueData = dashboardData.weeklyRevenue.some((d) => d.value > 0);

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Professional Management Dashboard
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[140px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} className="space-y-6">
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* KPI Cards */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  title="Total Value"
                  value={formatCurrency(dashboardData.kpis.totalValue)}
                  delta={dashboardData.kpis.deltas.totalValue}
                  icon={Banknote}
                  sparklineData={dashboardData.weeklyRevenue.map((d) => d.value)}
                />
                <KpiCard
                  title="Total Items"
                  value={formatNumber(dashboardData.kpis.totalItems)}
                  subtitle="In Stock"
                  delta={dashboardData.kpis.deltas.totalItems}
                  icon={Boxes}
                />
                <KpiCard
                  title="Low Stock"
                  value={formatNumber(dashboardData.kpis.lowStock)}
                  badge={{ text: 'Needs Attention', variant: 'destructive' }}
                  delta={dashboardData.kpis.deltas.lowStock}
                  icon={TriangleAlert}
                  onClick={() => navigate('/inventory')}
                />
                <KpiCard
                  title="Categories"
                  value={formatNumber(dashboardData.kpis.categories)}
                  icon={Tags}
                  onClick={() => navigate('/inventory')}
                />
              </div>
            )}

            {/* Insights Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {/* Weekly Revenue Chart */}
                {loading ? (
                  <Skeleton className="h-[300px] rounded-2xl" />
                ) : (
                  <ChartCard
                    title="Weekly Revenue"
                    subtitle="Last 7 days"
                    icon={TrendingUp}
                    isEmpty={!hasRevenueData}
                    emptyState={{
                      message: 'No sales yet',
                      action: {
                        label: 'Create Job',
                        onClick: () => navigate('/jobs'),
                      },
                    }}
                  >
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={dashboardData.weeklyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}

                {/* Monthly Revenue Chart */}
                {loading ? (
                  <Skeleton className="h-[300px] rounded-2xl" />
                ) : (
                  <ChartCard
                    title="Monthly Revenue"
                    subtitle="Last 12 months"
                    icon={DollarSign}
                  >
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dashboardData.monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => navigate('/jobs')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Job
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/inventory')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Inventory
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/customers')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Customer
                  </Button>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Activity Panel */}
                {loading ? (
                  <Skeleton className="h-[400px] rounded-2xl" />
                ) : (
                  <ActivityPanel
                    alerts={dashboardData.alerts}
                    onViewAll={() => navigate('/inventory')}
                  />
                )}

                {/* Customer Overview */}
                {loading ? (
                  <Skeleton className="h-[200px] rounded-2xl" />
                ) : (
                  <ChartCard
                    title="Customers"
                    icon={Users}
                    action={{
                      label: 'Manage',
                      onClick: () => navigate('/customers'),
                    }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="text-2xl font-bold">
                          {formatNumber(dashboardData.customers.total)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">New This Period</span>
                        <span className="text-lg font-semibold text-emerald-600">
                          +{formatNumber(dashboardData.customers.newThisPeriod)}
                        </span>
                      </div>
                    </div>
                  </ChartCard>
                )}

                {/* Jobs Overview */}
                {loading ? (
                  <Skeleton className="h-[200px] rounded-2xl" />
                ) : (
                  <ChartCard
                    title="Jobs"
                    icon={Briefcase}
                    action={{
                      label: 'Create',
                      onClick: () => navigate('/jobs'),
                    }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="text-2xl font-bold">
                          {formatNumber(dashboardData.jobs.total)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground">Pending</span>
                          <p className="text-lg font-semibold text-amber-600">
                            {formatNumber(dashboardData.jobs.pending)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Completed</span>
                          <p className="text-lg font-semibold text-emerald-600">
                            {formatNumber(dashboardData.jobs.completed)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </ChartCard>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-0">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Revenue by Service */}
              {loading ? (
                <Skeleton className="h-[350px] rounded-2xl" />
              ) : (
                <ChartCard title="Revenue by Service" subtitle="Distribution of income">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardData.revenueByService}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dashboardData.revenueByService.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* Jobs by Status */}
              {loading ? (
                <Skeleton className="h-[350px] rounded-2xl" />
              ) : (
                <ChartCard title="Jobs by Status" subtitle="Current job distribution">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboardData.jobsByStatus} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
