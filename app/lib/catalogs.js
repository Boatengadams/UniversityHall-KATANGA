export const STUDENT_EMAIL_DOMAIN = "@st.knust.edu.gh";
export const STUDENT_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@st\.knust\.edu\.gh$/;

export const WING_CONFIG = {
  anans: {
    label: "Annex",
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
  "College of Science (CoS)": {
    "Department of Computer Science": [
      "BSc Computer Science",
      "BSc Information Technology",
      "MSc Computer Science",
      "MPhil Computer Science"
    ],
    "Department of Mathematics": [
      "BSc Mathematics",
      "BSc Financial Mathematics"
    ],
    "Department of Statistics and Actuarial Science": [
      "BSc Statistics",
      "BSc Actuarial Science"
    ],
    "Department of Chemistry": [
      "BSc Chemistry"
    ],
    "Department of Physics": [
      "BSc Physics"
    ],
    "Department of Biochemistry and Biotechnology": [
      "BSc Biochemistry",
      "BSc Biotechnology"
    ],
    "Department of Optometry and Visual Science": [
      "Doctor of Optometry (OD)"
    ]
  },
  "College of Engineering (CoE)": {
    "Department of Civil Engineering": [
      "BSc Civil Engineering"
    ],
    "Department of Computer Engineering": [
      "BSc Computer Engineering"
    ],
    "Department of Electrical and Electronic Engineering": [
      "BSc Electrical Engineering"
    ],
    "Department of Mechanical Engineering": [
      "BSc Mechanical Engineering"
    ],
    "Department of Petroleum Engineering": [
      "BSc Petroleum Engineering"
    ],
    "Department of Chemical Engineering": [
      "BSc Chemical Engineering"
    ]
  },
  "College of Health Sciences (CHS)": {
    "Department of Medicine": [
      "MBChB (Medicine & Surgery)"
    ],
    "Department of Pharmacy": [
      "Doctor of Pharmacy (PharmD)"
    ],
    "Department of Nursing": [
      "BSc Nursing"
    ],
    "Department of Medical Laboratory Technology": [
      "BSc Medical Laboratory Technology"
    ]
  },
  "College of Humanities and Social Sciences (CoHSS)": {
    "Department of Economics": [
      "BA Economics"
    ],
    "Department of Sociology": [
      "BA Sociology"
    ],
    "Department of Geography and Rural Development": [
      "BA Geography"
    ],
    "KNUST School of Business": [
      "BSc Business Administration - Accounting",
      "BSc Business Administration - Banking & Finance",
      "BSc Business Administration - Marketing",
      "BSc Business Administration - Human Resource Management"
    ]
  },
  "College of Art and Built Environment (CABE)": {
    "Department of Architecture": [
      "BSc Architecture"
    ],
    "Department of Planning": [
      "BSc Development Planning"
    ],
    "Department of Land Economy": [
      "BSc Land Economy"
    ],
    "Department of Construction Technology": [
      "BSc Construction Technology"
    ],
    "Department of Industrial Art": [
      "BSc Fashion Design",
      "BSc Textile Design",
      "BSc Ceramics Technology"
    ]
  },
  "College of Agriculture and Natural Resources (CANR)": {
    "Department of Crop and Soil Science": [
      "BSc Agriculture"
    ],
    "Department of Animal Science": [
      "BSc Animal Science"
    ],
    "Department of Agricultural Economics": [
      "BSc Agribusiness Management"
    ],
    "Department of Forest Resources Technology": [
      "BSc Forest Resource Technology"
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
