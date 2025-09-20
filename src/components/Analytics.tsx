import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, BarChart3, PieChart, DollarSign, Users } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface AnalyticsData {
  revenueGrowth: number;
  customerGrowth: number;
  popularServices: Array<{ service: string; count: number; revenue: number }>;
  dailyRevenue: Array<{ date: string; revenue: number }>;
  averageJobValue: number;
  repeatCustomers: number;
}

export function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    revenueGrowth: 0,
    customerGrowth: 0,
    popularServices: [],
    dailyRevenue: [],
    averageJobValue: 0,
    repeatCustomers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const today = new Date();
      const thirtyDaysAgo = subDays(today, 30);
      const sixtyDaysAgo = subDays(today, 60);

      // Revenue growth (last 30 days vs previous 30 days)
      const [currentPeriodRevenue, previousPeriodRevenue] = await Promise.all([
        supabase
          .from('jobs')
          .select('price')
          .gte('created_at', format(thirtyDaysAgo, 'yyyy-MM-dd'))
          .eq('status', 'paid'),
        supabase
          .from('jobs')
          .select('price')
          .gte('created_at', format(sixtyDaysAgo, 'yyyy-MM-dd'))
          .lt('created_at', format(thirtyDaysAgo, 'yyyy-MM-dd'))
          .eq('status', 'paid')
      ]);

      const currentRevenue = currentPeriodRevenue.data?.reduce((sum, job) => sum + (Number(job.price) || 0), 0) || 0;
      const previousRevenue = previousPeriodRevenue.data?.reduce((sum, job) => sum + (Number(job.price) || 0), 0) || 0;
      const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      // Customer growth
      const [currentCustomers, previousCustomers] = await Promise.all([
        supabase
          .from('customers')
          .select('id', { count: 'exact' })
          .gte('created_at', format(thirtyDaysAgo, 'yyyy-MM-dd')),
        supabase
          .from('customers')
          .select('id', { count: 'exact' })
          .gte('created_at', format(sixtyDaysAgo, 'yyyy-MM-dd'))
          .lt('created_at', format(thirtyDaysAgo, 'yyyy-MM-dd'))
      ]);

      const customerGrowth = (previousCustomers.count || 0) > 0 
        ? (((currentCustomers.count || 0) - (previousCustomers.count || 0)) / (previousCustomers.count || 1)) * 100 
        : 0;

      // Popular services
      const { data: servicesData } = await supabase
        .from('jobs')
        .select('job_type, price')
        .gte('created_at', format(thirtyDaysAgo, 'yyyy-MM-dd'));

      const serviceStats = servicesData?.reduce((acc, job) => {
        const service = job.job_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        if (!acc[service]) {
          acc[service] = { count: 0, revenue: 0 };
        }
        acc[service].count++;
        acc[service].revenue += Number(job.price) || 0;
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>) || {};

      const popularServices = Object.entries(serviceStats)
        .map(([service, stats]) => ({ service, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Average job value
      const totalRevenue = currentPeriodRevenue.data?.reduce((sum, job) => sum + (Number(job.price) || 0), 0) || 0;
      const jobCount = currentPeriodRevenue.data?.length || 1;
      const averageJobValue = totalRevenue / jobCount;

      // Repeat customers (customers with more than 1 job)
      const { data: customerJobCounts } = await supabase
        .from('jobs')
        .select('customer_id')
        .gte('created_at', format(thirtyDaysAgo, 'yyyy-MM-dd'));

      const customerFrequency = customerJobCounts?.reduce((acc, job) => {
        acc[job.customer_id] = (acc[job.customer_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const repeatCustomers = Object.values(customerFrequency).filter(count => count > 1).length;

      setAnalytics({
        revenueGrowth,
        customerGrowth,
        popularServices,
        dailyRevenue: [], // Would need more complex query for daily breakdown
        averageJobValue,
        repeatCustomers
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => {
    const abs = Math.abs(value);
    return `${value >= 0 ? '+' : '-'}${abs.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/2 mb-2 shimmer"></div>
              <div className="h-8 bg-muted rounded w-3/4 shimmer"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Revenue Growth */}
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Growth</CardTitle>
            {analytics.revenueGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analytics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(analytics.revenueGrowth)}
            </div>
            <p className="text-xs text-muted-foreground">vs. previous 30 days</p>
          </CardContent>
        </Card>

        {/* Customer Growth */}
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Growth</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analytics.customerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(analytics.customerGrowth)}
            </div>
            <p className="text-xs text-muted-foreground">new customers</p>
          </CardContent>
        </Card>

        {/* Average Job Value */}
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Job Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.averageJobValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">per completed job</p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Services */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Popular Services (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.popularServices.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No service data available</p>
            ) : (
              analytics.popularServices.map((service, index) => (
                <div key={service.service} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{service.service}</p>
                      <p className="text-sm text-muted-foreground">{service.count} jobs</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${service.revenue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">revenue</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Retention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.repeatCustomers}</div>
            <p className="text-sm text-muted-foreground">repeat customers this month</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Business Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Revenue Growth</span>
                <span className={`text-sm font-medium ${analytics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.revenueGrowth >= 0 ? 'Positive' : 'Negative'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Customer Base</span>
                <span className={`text-sm font-medium ${analytics.customerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.customerGrowth >= 0 ? 'Growing' : 'Declining'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}