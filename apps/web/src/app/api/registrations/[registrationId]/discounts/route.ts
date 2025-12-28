import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { prisma } from '@fire/db'

// POST /api/registrations/[registrationId]/discounts - Apply discount
export async function POST(request: Request, { params }: { params: { registrationId: string } }) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { name, discountType, amount } = body

    // Validate
    if (!name || !discountType || amount === undefined) {
      return NextResponse.json(
        { error: 'Name, discount type, and amount are required' },
        { status: 400 }
      )
    }

    // Get registration
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: params.registrationId },
      include: {
        lineItems: true,
        discounts: true,
      },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Calculate subtotal (sum of line items)
    const subtotal = registration.lineItems.reduce(
      (sum, item) => sum + parseFloat(item.calculatedAmount.toString()),
      0
    )

    // Calculate discount amount
    let discountAmount = 0
    if (discountType === 'FIXED_AMOUNT') {
      discountAmount = parseFloat(amount.toString())
    } else if (discountType === 'PERCENTAGE') {
      discountAmount = subtotal * (parseFloat(amount.toString()) / 100)
    }

    // Create discount
    const discount = await prisma.discount.create({
      data: {
        registrationId: params.registrationId,
        name,
        discountType,
        amount: discountAmount,
        appliedById: session.user.id,
      },
    })

    // Recalculate registration totals
    const existingDiscounts = registration.discounts.reduce(
      (sum, d) => sum + parseFloat(d.amount.toString()),
      0
    )
    const totalDiscounts = existingDiscounts + discountAmount
    const newTotal = Math.max(0, subtotal - totalDiscounts)
    const currentDepositPaid = parseFloat(registration.depositPaid.toString())
    const newBalanceDue = Math.max(0, newTotal - currentDepositPaid)

    // Update registration
    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id: params.registrationId },
      data: {
        totalAmount: newTotal,
        balanceDue: newBalanceDue,
      },
      include: {
        discounts: true,
        lineItems: {
          include: {
            lineItem: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      discount,
      registration: updatedRegistration,
      message: 'Discount applied successfully',
    })
  } catch (error) {
    console.error('Error applying discount:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/registrations/[registrationId]/discounts/[discountId] - Remove discount
export async function DELETE(request: Request, { params }: { params: { registrationId: string } }) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const discountId = searchParams.get('discountId')

    if (!discountId) {
      return NextResponse.json({ error: 'Discount ID required' }, { status: 400 })
    }

    // Get discount and registration
    const discount = await prisma.discount.findUnique({
      where: { id: discountId },
    })

    if (!discount || discount.registrationId !== params.registrationId) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 })
    }

    // Delete discount
    await prisma.discount.delete({
      where: { id: discountId },
    })

    // Recalculate registration totals
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: params.registrationId },
      include: {
        lineItems: true,
        discounts: true,
      },
    })

    if (registration) {
      const subtotal = registration.lineItems.reduce(
        (sum, item) => sum + parseFloat(item.calculatedAmount.toString()),
        0
      )
      const totalDiscounts = registration.discounts.reduce(
        (sum, d) => sum + parseFloat(d.amount.toString()),
        0
      )
      const newTotal = Math.max(0, subtotal - totalDiscounts)
      const currentDepositPaid = parseFloat(registration.depositPaid.toString())
      const newBalanceDue = Math.max(0, newTotal - currentDepositPaid)

      await prisma.eventRegistration.update({
        where: { id: params.registrationId },
        data: {
          totalAmount: newTotal,
          balanceDue: newBalanceDue,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing discount:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
