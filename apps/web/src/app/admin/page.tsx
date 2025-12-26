import { redirect } from 'next/navigation'

export default function AdminPage() {
  // Redirect to users management page
  redirect('/admin/users')
}

