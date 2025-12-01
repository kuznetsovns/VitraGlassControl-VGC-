import { supabase } from '../lib/supabase'
import { objectStorage } from '../services/objectStorage'

export const testObjectCreation = async () => {
  console.log('========== OBJECT CREATION TEST ==========')

  const testObject = {
    name: 'Test Object ' + new Date().toISOString(),
    customer: 'Test Customer',
    address: 'Test Address',
    buildingsCount: 1
  }

  console.log('📝 Test object data:', testObject)

  // Test 1: Direct Supabase insert
  console.log('\n1️⃣ Testing direct Supabase INSERT...')
  try {
    const { data: directData, error: directError } = await supabase
      .from('objects')
      .insert({
        name: testObject.name,
        customer: testObject.customer,
        address: testObject.address,
        corpus_count: testObject.buildingsCount,
        photo_url: null
      })
      .select()
      .single()

    if (directError) {
      console.error('❌ Direct Supabase INSERT failed:', directError)
      console.error('Error details:', {
        message: directError.message,
        details: directError.details,
        hint: directError.hint,
        code: directError.code
      })
    } else {
      console.log('✅ Direct Supabase INSERT successful:', directData)

      // Clean up
      if (directData?.id) {
        await supabase.from('objects').delete().eq('id', directData.id)
        console.log('🗑️ Test object cleaned up')
      }
    }
  } catch (error) {
    console.error('❌ Direct Supabase INSERT exception:', error)
  }

  // Test 2: Via objectStorage service
  console.log('\n2️⃣ Testing via objectStorage service...')
  try {
    const { data: serviceData, error: serviceError, usingFallback } = await objectStorage.create(testObject)

    if (serviceError) {
      console.error('❌ objectStorage.create failed:', serviceError)
    } else {
      console.log('✅ objectStorage.create successful!')
      console.log('📍 Using fallback?:', usingFallback)
      console.log('📦 Created object:', serviceData)

      // Clean up if created in Supabase
      if (!usingFallback && serviceData?.id) {
        await objectStorage.delete(serviceData.id)
        console.log('🗑️ Test object cleaned up')
      }
    }
  } catch (error) {
    console.error('❌ objectStorage.create exception:', error)
  }

  // Test 3: Check current storage status
  console.log('\n3️⃣ Checking current storage status...')
  try {
    const { data: allObjects, error: listError, usingFallback: listFallback } = await objectStorage.getAll()

    if (listError) {
      console.error('❌ objectStorage.getAll failed:', listError)
    } else {
      console.log('✅ objectStorage.getAll successful!')
      console.log('📍 Using fallback?:', listFallback)
      console.log('📊 Total objects:', allObjects.length)

      // Check localStorage
      const localObjects = localStorage.getItem('project-objects')
      if (localObjects) {
        const parsed = JSON.parse(localObjects)
        console.log('📦 localStorage has', parsed.length, 'objects')
      } else {
        console.log('📦 localStorage is empty')
      }
    }
  } catch (error) {
    console.error('❌ objectStorage.getAll exception:', error)
  }

  console.log('\n========== TEST COMPLETED ==========')
}

// Make it available in browser console
if (typeof window !== 'undefined') {
  (window as any).testObjectCreation = testObjectCreation
  console.log('💡 Run window.testObjectCreation() to test object creation')
}