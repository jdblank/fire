import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Header } from '@/components/Header'
import { ReferralNetworkGraph } from '@/components/ReferralNetworkGraph'
import { NetworkUser } from '@/lib/network-utils'

async function getNetworkData(): Promise<NetworkUser[]> {
  // In production, this would use the API endpoint
  // For now, we'll import prisma directly for server-side rendering
  const { prisma } = await import('@fire/db')
  
  const users = await prisma.user.findMany({
    where: {
      accountStatus: {
        in: ['ACTIVE', 'PENDING_INVITE']
      }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      displayName: true,
      image: true,
      hometown: true,
      referredById: true,
      accountStatus: true,
      eventRegistrations: {
        select: {
          event: {
            select: {
              startDate: true,
              eventType: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })
  
  // Transform to include paid event years
  return users.map(user => {
    // Get unique years from PAID events only
    const paidEventYears = Array.from(
      new Set(
        user.eventRegistrations
          .filter(reg => reg.event.eventType === 'PAID')
          .map(reg => new Date(reg.event.startDate).getFullYear())
      )
    ).sort((a, b) => b - a) // Sort descending (most recent first)
    
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      image: user.image,
      hometown: user.hometown,
      referredById: user.referredById,
      accountStatus: user.accountStatus,
      paidEventYears
    }
  })
}

export default async function CommunityPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const networkData = await getNetworkData()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />

      {/* Network Graph - Full height container */}
      <div style={{ height: 'calc(100vh - 73px)', position: 'relative' }}>
        <ReferralNetworkGraph users={networkData} />
      </div>
    </div>
  )
}
