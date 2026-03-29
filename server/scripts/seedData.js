const getStartOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const classrooms = [
  {
    name: 'A-101',
    capacity: 60,
    location: 'Academic Block',
    amenities: ['Projector', 'Whiteboard']
  },
  {
    name: 'B-205',
    capacity: 40,
    location: 'Science Block',
    amenities: ['AC', 'Smart Display']
  },
  {
    name: 'Library Hall',
    capacity: 120,
    location: 'Library',
    amenities: ['Projector', 'Audio System']
  }
];

const cabs = [
  { id: 'CAB-101', driver: 'Ravi Kumar', capacity: 4, currentLocation: 'Main Gate' },
  { id: 'CAB-102', driver: 'Arun Patel', capacity: 4, currentLocation: 'Hostel' },
  { id: 'CAB-103', driver: 'Sana Khan', capacity: 6, currentLocation: 'Library' }
];

const users = [
  {
    googleId: 'seed-student-1',
    email: 'student.seed@test.edu',
    name: 'Seed Student',
    role: 'Student'
  },
  {
    googleId: 'seed-faculty-1',
    email: 'faculty.seed@test.edu',
    name: 'Seed Faculty',
    role: 'Faculty'
  },
  {
    googleId: 'seed-admin-1',
    email: 'admin.seed@test.edu',
    name: 'Seed Admin',
    role: 'Admin'
  },
  {
    googleId: 'seed-vendor-1',
    email: 'vendor.seed@test.edu',
    name: 'Taaza Tiffins',
    role: 'Vendor'
  },
  {
    googleId: 'seed-cab-operator-1',
    email: 'cab.seed@test.edu',
    name: 'Seed Cab Operator',
    role: 'Cab Operator'
  }
];

const menus = [
  {
    vendor: 'Taaza Tiffins',
    date: getStartOfToday(),
    items: [
      { name: 'Veg Sandwich', description: 'Grilled sandwich with veggies', price: 50, category: 'Snacks', isAvailable: true },
      { name: 'Idli Sambar', description: 'Steamed idli with sambar', price: 40, category: 'Breakfast', isAvailable: true }
    ]
  },
  {
    vendor: "Domino's",
    date: getStartOfToday(),
    items: [
      { name: 'Margherita Pizza', description: 'Classic cheese pizza', price: 120, category: 'Main Course', isAvailable: true },
      { name: 'Garlic Bread', description: 'Buttery garlic bread', price: 70, category: 'Sides', isAvailable: true }
    ]
  }
];

module.exports = {
  classrooms,
  cabs,
  users,
  menus,
  getStartOfToday
};
