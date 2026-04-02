export const demoClassrooms = [
  {
    _id: 'demo-classroom-1',
    name: 'LHC-101',
    capacity: 120,
    location: 'Lecture Hall Complex - Block A',
    amenities: ['Projector', 'Smart Board', 'Air Conditioning'],
    isActive: true,
    isDemo: true
  },
  {
    _id: 'demo-classroom-2',
    name: 'CSE-205',
    capacity: 75,
    location: 'CSE Department - 2nd Floor',
    amenities: ['Projector', 'Whiteboard'],
    isActive: true,
    isDemo: true
  },
  {
    _id: 'demo-classroom-3',
    name: 'ME-310',
    capacity: 60,
    location: 'Mechanical Block - 3rd Floor',
    amenities: ['Smart Display', 'Mic System'],
    isActive: true,
    isDemo: true
  }
];

export const demoVendorMenus = {
  'Taaza Tiffins': [
    {
      name: 'Mini Tiffin Combo',
      description: 'Idli, vada, upma, and chutneys with sambar.',
      price: 90,
      category: 'Breakfast',
      isAvailable: true,
      prepTimeMins: 15
    },
    {
      name: 'North Meal Box',
      description: 'Jeera rice, paneer curry, dal, roti, and salad.',
      price: 140,
      category: 'Lunch',
      isAvailable: true,
      prepTimeMins: 20
    },
    {
      name: 'Lemon Rice Bowl',
      description: 'Tangy lemon rice topped with roasted peanuts.',
      price: 70,
      category: 'Quick Bites',
      isAvailable: true,
      prepTimeMins: 10
    }
  ],
  "Domino's": [
    {
      name: 'Veggie Paradise Pizza',
      description: 'Capsicum, onion, tomato and sweet corn.',
      price: 199,
      category: 'Pizza',
      isAvailable: true,
      prepTimeMins: 25
    },
    {
      name: 'Paneer Zingy Wrap',
      description: 'Spiced paneer wrap with chipotle dressing.',
      price: 129,
      category: 'Wraps',
      isAvailable: true,
      prepTimeMins: 18
    },
    {
      name: 'Garlic Breadsticks',
      description: 'Classic garlic bread with herb seasoning.',
      price: 109,
      category: 'Sides',
      isAvailable: true,
      prepTimeMins: 12
    }
  ],
  'Campus Cafe': [
    {
      name: 'Cold Coffee',
      description: 'Iced coffee blended with milk and chocolate.',
      price: 80,
      category: 'Beverages',
      isAvailable: true,
      prepTimeMins: 6
    },
    {
      name: 'Veg Club Sandwich',
      description: 'Grilled triple-layer sandwich with fries.',
      price: 120,
      category: 'Snacks',
      isAvailable: true,
      prepTimeMins: 14
    }
  ]
};

export const demoCabs = [
  {
    _id: 'demo-cab-1',
    id: 'NITW-EV-01',
    driver: 'Ramesh',
    capacity: 4,
    isAvailable: true,
    currentLocation: 'Main Gate'
  },
  {
    _id: 'demo-cab-2',
    id: 'NITW-EV-07',
    driver: 'Suresh',
    capacity: 6,
    isAvailable: true,
    currentLocation: 'Hostel Circle'
  },
  {
    _id: 'demo-cab-3',
    id: 'NITW-EV-12',
    driver: 'Akash',
    capacity: 4,
    isAvailable: true,
    currentLocation: 'Library Junction'
  }
];

export const demoBookingHistory = [
  {
    _id: 'demo-booking-1',
    type: 'classroom',
    classroom: { name: 'LHC-101' },
    date: '2026-04-10T00:00:00.000Z',
    startTime: '10:00',
    endTime: '11:00',
    status: 'Approved',
    isDemo: true
  },
  {
    _id: 'demo-booking-2',
    type: 'food',
    vendor: 'Taaza Tiffins',
    date: '2026-04-09T00:00:00.000Z',
    pickupTime: '2026-04-09T13:15:00.000Z',
    status: 'Preparing',
    isDemo: true
  },
  {
    _id: 'demo-booking-3',
    type: 'cab',
    pickupLocation: 'Hostel H-Block',
    dropLocation: 'ECE Department',
    date: '2026-04-08T00:00:00.000Z',
    status: 'Completed',
    isDemo: true
  }
];

export const demoRouteSuggestions = [
  'Main Gate',
  'Library',
  'LHC',
  'CSE Department',
  'Hostel Circle',
  'Sports Complex',
  'Health Centre'
];
