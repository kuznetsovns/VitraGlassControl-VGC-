export const checkStorageStatus = () => {
  console.log('========== STORAGE CHECK ==========')

  // Check localStorage
  const localObjects = localStorage.getItem('project-objects')
  if (localObjects) {
    try {
      const parsed = JSON.parse(localObjects)
      console.log('📦 localStorage objects:', parsed.length, 'items')
      console.log('First localStorage object:', parsed[0])
    } catch (e) {
      console.log('❌ Failed to parse localStorage')
    }
  } else {
    console.log('📦 localStorage is empty (no project-objects key)')
  }

  // Check if objectStorage is using fallback
  console.log('\n🔍 Now try creating a new object and watch the console logs!')
  console.log('Look for:')
  console.log('  - "🆕 Creating object in Supabase..." (attempt to use Supabase)')
  console.log('  - "✅ Successfully created in Supabase" (success)')
  console.log('  - "⚠️ Supabase unavailable for CREATE" (fallback to localStorage)')
}

if (typeof window !== 'undefined') {
  (window as any).checkStorage = checkStorageStatus
  console.log('💡 Run window.checkStorage() to see where objects are stored')
}