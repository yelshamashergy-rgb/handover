import type { SnagItem } from './types'
import { uid } from './payments'

/** Standard handover snagging checklist for a UAE apartment. */
const TEMPLATE: string[] = [
  'Front door — alignment, lock, handle',
  'Windows & sliding doors — seals, smooth glide',
  'Walls & ceilings — cracks, paint finish',
  'Flooring & skirting — tiles, scratches, grout',
  'Kitchen units & worktops — doors, drawers, finish',
  'Kitchen appliances — working & connected',
  'Bathrooms — fixtures, sealant, drainage',
  'Plumbing — water pressure, leaks, hot water',
  'Electrical — sockets, switches, lighting',
  'A/C & ventilation — cooling, thermostat, noise',
  'Balcony / terrace — railing, drainage, finish',
  'Built-in wardrobes — doors, shelves',
  'Smart home / intercom — if applicable',
  'General cleanliness & snag-free handover',
]

export function snaggingTemplate(): SnagItem[] {
  return TEMPLATE.map((label) => ({ id: uid(), label, status: 'pending' }))
}
