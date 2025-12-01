import { supabase } from '../lib/supabase'

export const testSupabaseConnection = async () => {
  console.log('========== SUPABASE CONNECTION TEST ==========')
  console.log('📍 URL:', import.meta.env.VITE_SUPABASE_URL)
  console.log('🔑 Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)

  try {
    console.log('\n🔄 Testing direct Supabase query...')

    // Test 1: Check if table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('objects')
      .select('count')
      .limit(1)

    if (tableError) {
      console.error('❌ Table check failed:', tableError)
      console.error('Table error details:', {
        message: tableError.message,
        details: tableError.details,
        hint: tableError.hint,
        code: tableError.code
      })

      // Try to create a simple test object
      console.log('\n🔧 Attempting to insert test object...')
      const { data: insertData, error: insertError } = await supabase
        .from('objects')
        .insert({
          name: 'Test Object',
          customer: 'Test Customer',
          address: 'Test Address',
          corpus_count: 1
        })
        .select()

      if (insertError) {
        console.error('❌ Insert test failed:', insertError)
        return false
      } else {
        console.log('✅ Test insert successful:', insertData)
        // Clean up test object
        if (insertData && insertData[0]) {
          await supabase.from('objects').delete().eq('id', insertData[0].id)
          console.log('🗑️ Test object cleaned up')
        }
      }
    } else {
      console.log('✅ Table exists and is accessible')

      // Test 2: List all objects
      const { data: objects, error: listError } = await supabase
        .from('objects')
        .select('*')
        .order('created_at', { ascending: false })

      if (listError) {
        console.error('❌ Failed to list objects:', listError)
      } else {
        console.log(`✅ Successfully fetched ${objects?.length || 0} objects from Supabase`)
        if (objects && objects.length > 0) {
          console.log('📋 First object:', objects[0])
        }
      }
    }

    console.log('\n✅ SUPABASE CONNECTION TEST COMPLETED')
    return true
  } catch (error) {
    console.error('\n❌ SUPABASE CONNECTION TEST FAILED')
    console.error('Error:', error)
    return false
  }
}

// Run test on window object for easy browser console access
if (typeof window !== 'undefined') {
  (window as any).testSupabase = testSupabaseConnection
  console.log('💡 Run window.testSupabase() in console to test Supabase connection')
}