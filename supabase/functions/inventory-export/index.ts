import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log(`Starting inventory export for user ${user.id}`)

    // Export inventory data for the user
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', user.id)
      .order('key_type', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch inventory data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!inventory || inventory.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No inventory data found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Convert to CSV
    const headers = [
      'SKU',
      'Key Type',
      'Make',
      'Year From',
      'Year To',
      'Quantity',
      'Cost',
      'Total Value',
      'Category',
      'Supplier',
      'FCC ID',
      'Module',
      'Usage Count',
      'Last Used'
    ]

    const csvRows = [
      headers.join(','),
      ...inventory.map(item => [
        item.sku || '',
        item.key_type || '',
        item.make || '',
        item.year_from || '',
        item.year_to || '',
        item.quantity || 0,
        item.cost || '',
        item.total_cost_value || '',
        item.category || '',
        item.supplier || '',
        item.fcc_id || '',
        item.module || '',
        item.usage_count || 0,
        item.last_used_date ? new Date(item.last_used_date).toLocaleDateString() : ''
      ].map(field => {
        const value = String(field)
        // Escape commas and quotes in CSV
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(','))
    ]

    const csvContent = csvRows.join('\n')
    const filename = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`

    console.log(`Export completed: ${inventory.length} inventory items`)

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to export inventory', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})