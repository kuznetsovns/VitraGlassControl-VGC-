import { supabase } from '../lib/supabase'
import { floorPlanStorage } from '../services/floorPlanStorage'

export const testFloorPlansTable = async () => {
  console.log('========== FLOOR PLANS TABLE TEST ==========')
  console.log('📍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL)

  try {
    // Test 1: Check if table exists
    console.log('\n1️⃣ Checking if floor_plans table exists...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('floor_plans')
      .select('count')
      .limit(1)

    if (tableError) {
      console.error('❌ Table check failed:', tableError)
      console.error('Details:', {
        message: tableError.message,
        details: tableError.details,
        hint: tableError.hint,
        code: tableError.code
      })
      console.log('\n⚠️ Table might not exist. Please run migration:')
      console.log('   supabase/migrations/006_create_floor_plans_table.sql')
      return false
    }

    console.log('✅ Table floor_plans exists!')

    // Test 2: Get first object for testing
    console.log('\n2️⃣ Getting first object for testing...')
    const { data: objects, error: objError } = await supabase
      .from('objects')
      .select('id, name')
      .limit(1)

    if (objError || !objects || objects.length === 0) {
      console.log('⚠️ No objects found for testing. Create an object first.')
      return false
    }

    const testObjectId = objects[0].id
    const testObjectName = objects[0].name
    console.log(`✅ Using object: ${testObjectName} (${testObjectId})`)

    // Test 3: Create a test floor plan
    console.log('\n3️⃣ Creating test floor plan...')
    const testPlan = {
      object_id: testObjectId,
      corpus: 'Тестовый корпус',
      floor: 1,
      name: 'Тестовый план 1-го этажа',
      description: 'Это тестовый план для проверки таблицы',
      scale: 10,
      grid_visible: true,
      background_opacity: 0.7
    }

    const { data: createResult, error: createError, usingFallback } =
      await floorPlanStorage.create(testPlan)

    if (createError) {
      console.error('❌ Failed to create floor plan:', createError)
      return false
    }

    console.log('✅ Floor plan created successfully!')
    console.log('   Using fallback?:', usingFallback)
    console.log('   Created plan:', createResult)

    // Test 4: Get all floor plans for object
    console.log('\n4️⃣ Getting all floor plans for object...')
    const { data: allPlans, error: allError } =
      await floorPlanStorage.getAll(testObjectId)

    if (allError) {
      console.error('❌ Failed to get floor plans:', allError)
    } else {
      console.log(`✅ Found ${allPlans.length} floor plan(s) for object`)
    }

    // Test 5: Clean up test data
    if (createResult?.id) {
      console.log('\n5️⃣ Cleaning up test data...')
      const { error: deleteError } = await floorPlanStorage.delete(createResult.id)
      if (deleteError) {
        console.error('⚠️ Failed to clean up:', deleteError)
      } else {
        console.log('✅ Test data cleaned up')
      }
    }

    console.log('\n✅ FLOOR PLANS TABLE TEST COMPLETED SUCCESSFULLY')
    return true
  } catch (error) {
    console.error('\n❌ FLOOR PLANS TABLE TEST FAILED')
    console.error('Error:', error)
    return false
  }
}

// Make it available in browser console
if (typeof window !== 'undefined') {
  (window as any).testFloorPlans = testFloorPlansTable
  console.log('💡 Run window.testFloorPlans() to test floor_plans table')
}