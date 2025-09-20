import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportData {
  customers: any[]
  jobs: any[]
  inventory: any[]
  activities: any[]
  profiles: any[]
  job_inventory: any[]
  inventory_usage: any[]
  export_metadata: {
    timestamp: string
    user_id: string
    app_version: string
    total_records: number
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { format = 'json' } = await req.json().catch(() => ({ format: 'json' }))

    console.log(`Starting data export for user ${user.id} in ${format} format`)

    // Export all user data
    const exportData: ExportData = {
      customers: [],
      jobs: [],
      inventory: [],
      activities: [],
      profiles: [],
      job_inventory: [],
      inventory_usage: [],
      export_metadata: {
        timestamp: new Date().toISOString(),
        user_id: user.id,
        app_version: '1.0.0',
        total_records: 0
      }
    }

    // Export customers
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
    exportData.customers = customers || []

    // Export jobs
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
    exportData.jobs = jobs || []

    // Export inventory
    const { data: inventory } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', user.id)
    exportData.inventory = inventory || []

    // Export activities
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
    exportData.activities = activities || []

    // Export user profile
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
    exportData.profiles = profiles || []

    // Export job inventory relations
    const { data: jobInventory } = await supabase
      .from('job_inventory')
      .select('*')
      .eq('user_id', user.id)
    exportData.job_inventory = jobInventory || []

    // Export inventory usage
    const { data: inventoryUsage } = await supabase
      .from('inventory_usage')
      .select('*')
      .eq('user_id', user.id)
    exportData.inventory_usage = inventoryUsage || []

    // Calculate total records
    exportData.export_metadata.total_records = 
      exportData.customers.length +
      exportData.jobs.length +
      exportData.inventory.length +
      exportData.activities.length +
      exportData.profiles.length +
      exportData.job_inventory.length +
      exportData.inventory_usage.length

    console.log(`Export completed: ${exportData.export_metadata.total_records} total records`)

    if (format === 'csv') {
      // Convert to CSV format
      const csvSections = []
      
      // Add metadata section
      csvSections.push('=== EXPORT METADATA ===')
      csvSections.push(`Timestamp,${exportData.export_metadata.timestamp}`)
      csvSections.push(`User ID,${exportData.export_metadata.user_id}`)
      csvSections.push(`Total Records,${exportData.export_metadata.total_records}`)
      csvSections.push('')

      // Helper function to convert array to CSV
      const arrayToCSV = (arr: any[], title: string) => {
        if (!arr || arr.length === 0) return `=== ${title} ===\nNo data\n`
        
        const headers = Object.keys(arr[0])
        const csv = [
          `=== ${title} ===`,
          headers.join(','),
          ...arr.map(row => 
            headers.map(header => {
              const value = row[header]
              if (value === null || value === undefined) return ''
              if (typeof value === 'string' && value.includes(',')) return `"${value}"`
              return String(value)
            }).join(',')
          ),
          ''
        ]
        return csv.join('\n')
      }

      csvSections.push(arrayToCSV(exportData.customers, 'CUSTOMERS'))
      csvSections.push(arrayToCSV(exportData.jobs, 'JOBS'))
      csvSections.push(arrayToCSV(exportData.inventory, 'INVENTORY'))
      csvSections.push(arrayToCSV(exportData.activities, 'ACTIVITIES'))
      csvSections.push(arrayToCSV(exportData.job_inventory, 'JOB INVENTORY'))
      csvSections.push(arrayToCSV(exportData.inventory_usage, 'INVENTORY USAGE'))

      return new Response(csvSections.join('\n'), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="locksmith_backup_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Return JSON format
    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="locksmith_backup_${new Date().toISOString().split('T')[0]}.json"`
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to export data', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})