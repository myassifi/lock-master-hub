import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Briefcase,
  Calendar,
  Target,
  BarChart3,
  Flame,
  Moon,
  Sun,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import { Analytics } from '@/components/Analytics';
import { format } from 'date-fns';
import DataExport from '@/components/DataExport';

interface DashboardStats {
  totalValue: number;
  totalItems: number;
  lowStockCount: number;
  categoriesCount: number;
  customersCount: number;
  jobsCount: number;
  pendingJobs: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  recentActivity: any[];
  recentJobs: any[];
  lowStockProducts: any[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    totalValue: 0,
    totalItems: 0,
    lowStockCount: 0,
    categoriesCount: 0,
    customersCount: 0,
    jobsCount: 0,
    pendingJobs: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    recentActivity: [],
    recentJobs: [],
    lowStockProducts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardStats();
    }
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      // Parallel data fetching for better performance
      const [inventoryData, customersData, jobsData, activitiesData] = await Promise.all([
        supabase.from('inventory').select('*'),
        supabase.from('customers').select('id'),
        supabase.from('jobs').select('*'),
        supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      const inventory = inventoryData.data || [];
      const jobs = jobsData.data || [];
      
      // Calculate inventory stats
      const totalValue = inventory.reduce((sum, item) => sum + (item.total_cost_value || 0), 0);
      const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
      const lowStockCount = inventory.filter(item => item.quantity <= item.low_stock_threshold).length;
      const lowStockProducts = inventory.filter(item => item.quantity <= item.low_stock_threshold);
      const categoriesCount = new Set(inventory.map(item => item.category)).size;

      // Calculate job stats
      const pendingJobs = jobs.filter(job => job.status === 'pending').length;
      const weeklyRevenue = jobs
        .filter(job => job.status === 'paid' && new Date(job.job_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .reduce((sum, job) => sum + (Number(job.price) || 0), 0);
      const monthlyRevenue = jobs
        .filter(job => job.status === 'paid' && new Date(job.job_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .reduce((sum, job) => sum + (Number(job.price) || 0), 0);

      // Get recent jobs with customer data
      const { data: recentJobsData } = await supabase
        .from('jobs')
        .select(`
          *,
          customers (name, phone)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalValue,
        totalItems,
        lowStockCount,
        categoriesCount,
        customersCount: customersData.data?.length || 0,
        jobsCount: jobs.length,
        pendingJobs,
        weeklyRevenue,
        monthlyRevenue,
        recentActivity: activitiesData.data || [],
        recentJobs: recentJobsData || [],
        lowStockProducts
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatCardClick = (route: string, filter?: string) => {
    navigate(route + (filter ? `?filter=${filter}` : ''));
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="pro-card">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Please log in to view dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 fade-in mobile-container">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-muted rounded-full shimmer"></div>
          <div className="w-48 h-8 bg-muted rounded shimmer"></div>
        </div>
        <div className="mobile-stats-grid">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="pro-card">
              <CardContent className="p-6">
                <div className="w-full h-20 bg-muted rounded shimmer"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Professional Header with Brand */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mobile-container">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Flame className="h-8 w-8 text-accent" />
            <div className="absolute -inset-1 bg-gradient-to-r from-accent to-primary rounded-full opacity-20 blur-sm"></div>
          </div>
          <div>
            <h1 className="mobile-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Heat Wave Locksmith Pro
            </h1>
            <p className="text-muted-foreground text-sm">Professional Management Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="touch-target"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Welcome, {user.email?.split('@')[0]}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="mobile-container">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Clickable Stats Cards */}
          <div className="mobile-stats-grid mobile-container">
            <Card 
              className="stat-card stat-card-success tap-highlight"
              onClick={() => handleStatCardClick('/inventory')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                    <p className="text-3xl font-bold text-green-600">
                      ${stats.totalValue.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      💰 Inventory Investment
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="stat-card stat-card-primary tap-highlight"
              onClick={() => handleStatCardClick('/inventory')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                    <p className="text-3xl font-bold text-primary">
                      {stats.totalItems}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      📦 In Stock
                    </p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="stat-card stat-card-warning tap-highlight"
              onClick={() => handleStatCardClick('/inventory', 'low-stock')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                    <p className="text-3xl font-bold text-warning">
                      {stats.lowStockCount}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ⚠️ Needs Attention
                    </p>
                  </div>
                  <div className="p-3 bg-warning/10 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="stat-card stat-card-accent tap-highlight"
              onClick={() => handleStatCardClick('/inventory')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Categories</p>
                    <p className="text-3xl font-bold text-accent">
                      {stats.categoriesCount}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      🏷️ Product Types
                    </p>
                  </div>
                  <div className="p-3 bg-accent/10 rounded-full">
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Cards */}
          <div className="grid gap-4 md:grid-cols-2 mobile-container">
            <Card className="pro-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Weekly Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${stats.weeklyRevenue.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground mt-1">Last 7 days earnings</p>
              </CardContent>
            </Card>

            <Card className="pro-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Monthly Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${stats.monthlyRevenue.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground mt-1">Last 30 days earnings</p>
              </CardContent>
            </Card>
          </div>

          {/* Business Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 mobile-container">
            <Card className="pro-card tap-highlight" onClick={() => navigate('/customers')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Customer Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Customers</span>
                    <span className="font-semibold text-2xl">{stats.customersCount}</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    Manage Customers
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="pro-card tap-highlight" onClick={() => navigate('/jobs')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Jobs Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Jobs</span>
                    <span className="font-semibold text-2xl">{stats.jobsCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <Badge variant={stats.pendingJobs > 0 ? "destructive" : "secondary"}>
                      {stats.pendingJobs}
                    </Badge>
                  </div>
                  <Button variant="outline" className="w-full">
                    Manage Jobs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Jobs */}
          <div className="grid gap-6 md:grid-cols-2 mobile-container">
            <Card className="pro-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Recent Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentJobs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No jobs found</p>
                  ) : (
                    stats.recentJobs.map((job, index) => (
                      <div key={job.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg slide-up" style={{animationDelay: `${index * 100}ms`}}>
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

            <Card className="pro-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className={`h-5 w-5 ${stats.lowStockCount > 0 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
                  Low Stock Alert
                  {stats.lowStockCount > 0 && (
                    <Badge variant="destructive" className="animate-pulse">{stats.lowStockCount}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.lowStockProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-green-600 font-medium">All items well stocked!</p>
                    </div>
                  ) : (
                    stats.lowStockProducts.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border border-destructive/20 bg-destructive/5 rounded-lg slide-up" style={{animationDelay: `${index * 100}ms`}}>
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

          {/* Recent Activity */}
          <Card className="pro-card mobile-container">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4"
                    onClick={() => navigate('/actions')}
                  >
                    View All Activity
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activity to display.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Data Export Section */}
          <div className="mobile-container">
            <DataExport />
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}