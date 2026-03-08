export const STUDENT_EMAIL_DOMAIN = "@st.knust.edu.gh";
export const STUDENT_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@st\.knust\.edu\.gh$/;

export const WING_CONFIG = {
  anans: {
    label: "Anans",
    gender: "Male",
    lanes: ["Lane 1", "Lane 2", "Lane 3"],
    roomsPerLane: 24
  },
  "west-wing": {
    label: "West Wing",
    gender: "Male",
    lanes: ["Lane 1", "Lane 2", "Lane 3"],
    roomsPerLane: 32
  },
  "east-wing": {
    label: "East Wing",
    gender: "Female",
    lanes: ["Lane 1", "Lane 2", "Lane 3"],
    roomsPerLane: 32
  },
  bridge: {
    label: "Bridge",
    gender: "Female",
    lanes: ["Lane 1", "Lane 2"],
    roomsPerLane: 24
  }
};

export const COLLEGE_TREE = {
  "College of Agriculture and Natural Resources": {
    "Department of Crop and Soil Sciences": [
      "BSc Agriculture",
      "BSc Agribusiness Management"
    ],
    "Department of Animal Science": [
      "BSc Animal Science",
      "BSc Dairy and Meat Science"
    ]
  },
  "College of Art and Built Environment": {
    "Department of Architecture": [
      "BSc Architecture",
      "MSc Architecture"
    ],
    "Department of Planning": [
      "BSc Development Planning",
      "MSc Development Policy"
    ]
  },
  "College of Engineering": {
    "Department of Electrical and Electronic Engineering": [
      "BSc Electrical/Electronic Engineering",
      "MSc Telecommunications Engineering"
    ],
    "Department of Mechanical Engineering": [
      "BSc Mechanical Engineering",
      "MSc Thermal Engineering"
    ],
    "Department of Computer Engineering": [
      "BSc Computer Engineering",
      "MSc Computer Engineering"
    ]
  },
  "College of Health Sciences": {
    "School of Medicine and Dentistry": [
      "MBChB",
      "BDS"
    ],
    "School of Nursing and Midwifery": [
      "BSc Nursing",
      "BSc Midwifery"
    ]
  },
  "College of Humanities and Social Sciences": {
    "Department of Economics": [
      "BA Economics",
      "MPhil Economics"
    ],
    "Department of Accounting and Finance": [
      "BSc Accounting",
      "MBA Finance"
    ]
  },
  "College of Science": {
    "Department of Computer Science": [
      "BSc Computer Science",
      "MSc Computer Science"
    ],
    "Department of Biological Sciences": [
      "BSc Biological Sciences",
      "MSc Biotechnology"
    ]
  }
};

export const TECHNICIAN_FAULTS = {
  electrician: ["Faulty Bulb", "Faulty Fan", "Fan Regulator", "Socket"],
  carpenter: ["Broken Shelves", "Door Lock Fault", "Broken Louvers", "Broken Bed"],
  plumber: ["Drainages"]
};

export const getWingOptions = () =>
  Object.entries(WING_CONFIG).map(([value, item]) => ({ value, label: item.label }));

export const getLaneOptions = (wingKey) => {
  const wing = WING_CONFIG[wingKey];
  return wing ? wing.lanes : [];
};

export const getRoomOptions = (wingKey, laneLabel) => {
  const wing = WING_CONFIG[wingKey];
  if (!wing || !laneLabel) return [];
  const laneExists = wing.lanes.includes(laneLabel);
  if (!laneExists) return [];

  const rooms = [];
  for (let i = 1; i <= wing.roomsPerLane; i += 1) {
    rooms.push(`Room ${i}`);
  }
  return rooms;
};

export const getGenderByWing = (wingKey) => WING_CONFIG[wingKey]?.gender || "";
