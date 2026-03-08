import { auth } from "./firebase.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import {
  COLLEGE_TREE,
  TECHNICIAN_FAULTS,
  STUDENT_EMAIL_REGEX,
  WING_CONFIG,
  getGenderByWing,
  getLaneOptions,
  getRoomOptions,
  getWingOptions
} from "./app/lib/catalogs.js";
import {
  sanitizeName,
  sanitizeStudentId,
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
  validateStudentEmail,
  validateStudentId
} from "./app/utils/validation.js";
import { wireSearchableInput } from "./app/components/searchableSelect.js";
import { registerWithEmailPassword, loginWithEmailPassword, getTokenClaims } from "./app/services/authService.js";
import { getUserProfile, saveUserProfile } from "./app/services/profileService.js";
import { initTheme } from "./app/hooks/useTheme.js";

const loginForm = document.getElementById("loginForm");
const authCard = document.querySelector(".glass");
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const signupFields = document.getElementById("signupFields");
const authSubmit = document.getElementById("authSubmit");
const authMessage = document.getElementById("authMessage");
const authToast = document.getElementById("authToast");
const themeToggle = document.getElementById("themeToggle");

const fullName = document.getElementById("fullName");
const registerRole = document.getElementById("registerRole");
const studentId = document.getElementById("studentId");
const studentIdLabel = document.getElementById("studentIdLabel");
const maintenanceType = document.getElementById("maintenanceType");
const staffRank = document.getElementById("staffRank");
const wing = document.getElementById("signupWing");
const lane = document.getElementById("signupLane");
const room = document.getElementById("signupRoom");
const gender = document.getElementById("signupGender");

const collegeInput = document.getElementById("collegeInput");
const departmentInput = document.getElementById("departmentInput");
const programInput = document.getElementById("programInput");
const college = document.getElementById("college");
const department = document.getElementById("department");
const program = document.getElementById("program");

const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const passwordToggle = document.getElementById("passwordToggle");

const maintenanceTypeWrap = document.getElementById("maintenanceTypeWrap");
const staffRankWrap = document.getElementById("staffRankWrap");
const wingWrap = document.getElementById("wingWrap");
const laneWrap = document.getElementById("laneWrap");
const roomWrap = document.getElementById("roomWrap");
const genderWrap = document.getElementById("genderWrap");
const collegeWrap = document.getElementById("collegeWrap");
const departmentWrap = document.getElementById("departmentWrap");
const programWrap = document.getElementById("programWrap");
const confirmPasswordWrap = document.getElementById("confirmPasswordWrap");

let mode = "login";
let toastTimer = null;
let submitBusyStartedAt = 0;

const RATE_LIMIT_KEY = "authRateLimit";
const MIN_SUBMIT_BUSY_MS = 800;

const FIELD_ERROR_IDS = {
  fullName: "fullNameError",
  studentId: "studentIdError",
  email: "emailError",
  password: "passwordError",
  confirmPassword: "confirmPasswordError",
  wing: "wingError",
  lane: "laneError",
  room: "roomError",
  college: "collegeError",
  department: "departmentError",
  program: "programError"
};

const getFieldErrorNode = (fieldKey) => document.getElementById(FIELD_ERROR_IDS[fieldKey]);

const setFieldError = (fieldKey, message = "") => {
  const node = getFieldErrorNode(fieldKey);
  if (!node) return;
  node.textContent = message;
};

const clearFieldErrors = () => {
  Object.keys(FIELD_ERROR_IDS).forEach((key) => setFieldError(key, ""));
};

const clearAuthForm = () => {
  loginForm.reset();
  college.value = "";
  department.value = "";
  program.value = "";
  if (registerRole) registerRole.value = "student";
  populateWingOptions();
  populateLaneOptions();
  populateRoomOptions();
  syncGender();
  setMode(mode);
  clearFieldErrors();
};

const showAuthToast = (message) => {
  if (!authToast || !message) return;
  authToast.textContent = message;
  authToast.classList.add("is-visible");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => authToast.classList.remove("is-visible"), 5000);
};

const isRateLimited = () => {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const limit = 5;
  const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
  const attempts = raw ? JSON.parse(raw) : [];
  const recent = attempts.filter((timestamp) => now - timestamp < windowMs);
  recent.push(now);
  sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recent));
  return recent.length > limit;
};

const setSubmitBusy = (busy) => {
  if (!authSubmit) return;
  authSubmit.disabled = busy;
  loginTab.disabled = busy;
  signupTab.disabled = busy;
  passwordToggle.disabled = busy;

  if (busy) {
    submitBusyStartedAt = Date.now();
    authSubmit.value = mode === "signup" ? "Creating Account..." : "Signing In...";
    return;
  }

  authSubmit.value = mode === "signup" ? "Create Account" : "Login";
};

const releaseSubmitBusy = async () => {
  const elapsed = Date.now() - submitBusyStartedAt;
  const remaining = MIN_SUBMIT_BUSY_MS - elapsed;
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
  setSubmitBusy(false);
};

const populateWingOptions = () => {
  const wingOptions = getWingOptions();
  wing.innerHTML = '<option value="">Select Wing</option>' + wingOptions
    .map((item) => `<option value="${item.value}">${item.label}</option>`)
    .join("");
};

const populateLaneOptions = () => {
  const laneOptions = getLaneOptions(wing.value);
  lane.innerHTML = '<option value="">Select Lane</option>' + laneOptions
    .map((value) => `<option value="${value}">${value}</option>`)
    .join("");
};

const populateRoomOptions = () => {
  const roomOptions = getRoomOptions(wing.value, lane.value);
  room.innerHTML = '<option value="">Select Room</option>' + roomOptions
    .map((value) => `<option value="${value}">${value}</option>`)
    .join("");
};

const syncGender = () => {
  gender.value = getGenderByWing(wing.value);
};

const isStudentRole = () => registerRole?.value === "student";
const isTechnicianRole = () => registerRole?.value === "maintenance_technician";
const isStaffRole = () => registerRole?.value === "staff";

const validateBaseFields = () => {
  let valid = true;

  if (mode === "signup") {
    const nameError = validateName(fullName.value);
    setFieldError("fullName", nameError);
    if (nameError) valid = false;

    const idError = isStudentRole()
      ? validateStudentId(studentId.value)
      : studentId.value.trim()
        ? ""
        : "ID number is required.";
    setFieldError("studentId", idError);
    if (idError) valid = false;

    const confirmError = validateConfirmPassword(password.value, confirmPassword.value);
    setFieldError("confirmPassword", confirmError);
    if (confirmError) valid = false;
  }

  const emailError = validateEmail(email.value);
  setFieldError("email", emailError);
  if (emailError) valid = false;

  if (mode === "signup" && isStudentRole()) {
    const studentEmailError = validateStudentEmail(email.value);
    if (studentEmailError) {
      setFieldError("email", studentEmailError);
      valid = false;
    }
  }

  const passwordError = validatePassword(password.value);
  setFieldError("password", passwordError);
  if (passwordError) valid = false;

  if (mode === "signup" && isStudentRole()) {
    if (!wing.value) {
      setFieldError("wing", "Wing is required.");
      valid = false;
    }
    if (!lane.value) {
      setFieldError("lane", "Lane is required.");
      valid = false;
    }
    if (!room.value) {
      setFieldError("room", "Room is required.");
      valid = false;
    }
    if (!college.value) {
      setFieldError("college", "Please select a valid college.");
      valid = false;
    }
    if (!department.value) {
      setFieldError("department", "Please select a valid department.");
      valid = false;
    }
    if (!program.value) {
      setFieldError("program", "Please select a valid program.");
      valid = false;
    }
  }

  return valid;
};

const updateRoleFields = () => {
  const student = isStudentRole();
  const technician = isTechnicianRole();
  const staff = isStaffRole();

  maintenanceTypeWrap.classList.toggle("hidden", !technician);
  staffRankWrap.classList.toggle("hidden", !staff);

  wingWrap.classList.toggle("hidden", !student);
  laneWrap.classList.toggle("hidden", !student);
  roomWrap.classList.toggle("hidden", !student);
  genderWrap.classList.toggle("hidden", !student);
  collegeWrap.classList.toggle("hidden", !student);
  departmentWrap.classList.toggle("hidden", !student);
  programWrap.classList.toggle("hidden", !student);

  studentIdLabel.textContent = student ? "Student ID" : "ID Number";
  studentId.placeholder = student ? "25000001" : "Enter ID number";

  if (mode === "signup" && student) {
    email.placeholder = "adams@st.knust.edu.gh";
  } else {
    email.placeholder = "name@example.com";
  }
};

const setMode = (nextMode) => {
  mode = nextMode;
  const signupMode = mode === "signup";

  signupFields.classList.toggle("hidden", !signupMode);
  loginForm.classList.toggle("is-signup", signupMode);
  authCard.classList.toggle("is-signup-mode", signupMode);

  loginTab.classList.toggle("is-active", !signupMode);
  signupTab.classList.toggle("is-active", signupMode);

  authSubmit.value = signupMode ? "Create Account" : "Login";
  confirmPasswordWrap.classList.toggle("hidden", !signupMode);

  updateRoleFields();
  clearFieldErrors();
  authMessage.textContent = "";

  if (!signupMode) {
    email.placeholder = "adams@st.knust.edu.gh";
  }
};

const resolveRoleRedirect = (profile) => {
  const role = String(profile?.role || "").trim().toLowerCase();
  if (role === "maintenance_technician") return "maintenance.html";
  if (role === "staff") return "staff.html";
  return "Lane1annexkatanga.html";
};

const collegeValues = Object.keys(COLLEGE_TREE);
const syncCollegeOptions = wireSearchableInput({
  input: collegeInput,
  hidden: college,
  listId: "collegeList",
  values: collegeValues,
  placeholder: "Search college"
});

const syncDepartmentOptions = wireSearchableInput({
  input: departmentInput,
  hidden: department,
  listId: "departmentList",
  values: [],
  placeholder: "Search department"
});

const syncProgramOptions = wireSearchableInput({
  input: programInput,
  hidden: program,
  listId: "programList",
  values: [],
  placeholder: "Search program"
});

const hydrateAcademicHierarchy = () => {
  const selectedCollege = college.value;
  const departments = selectedCollege ? Object.keys(COLLEGE_TREE[selectedCollege] || {}) : [];

  if (!departments.includes(department.value)) {
    department.value = "";
    departmentInput.value = "";
  }

  syncDepartmentOptions(departments);

  const programs = selectedCollege && department.value
    ? COLLEGE_TREE[selectedCollege]?.[department.value] || []
    : [];

  if (!programs.includes(program.value)) {
    program.value = "";
    programInput.value = "";
  }

  syncProgramOptions(programs);
};

collegeInput.addEventListener("change", () => {
  setFieldError("college", "");
  hydrateAcademicHierarchy();
});

departmentInput.addEventListener("change", () => {
  setFieldError("department", "");
  hydrateAcademicHierarchy();
});

programInput.addEventListener("change", () => setFieldError("program", ""));

if (loginTab && signupTab) {
  loginTab.addEventListener("click", () => setMode("login"));
  signupTab.addEventListener("click", () => setMode("signup"));
}

registerRole.addEventListener("change", () => {
  updateRoleFields();
  clearFieldErrors();
});

wing.addEventListener("change", () => {
  populateLaneOptions();
  populateRoomOptions();
  syncGender();
  setFieldError("wing", "");
});

lane.addEventListener("change", () => {
  populateRoomOptions();
  setFieldError("lane", "");
});

room.addEventListener("change", () => setFieldError("room", ""));

if (password && passwordToggle) {
  passwordToggle.addEventListener("click", () => {
    const isText = password.type === "text";
    const nextType = isText ? "password" : "text";
    password.type = nextType;
    if (confirmPassword) confirmPassword.type = nextType;
    passwordToggle.textContent = isText ? "Show" : "Hide";
    passwordToggle.setAttribute("aria-pressed", String(!isText));
  });
}

fullName.addEventListener("input", () => {
  fullName.value = sanitizeName(fullName.value);
  setFieldError("fullName", validateName(fullName.value));
});

studentId.addEventListener("input", () => {
  if (mode === "signup" && isStudentRole()) {
    studentId.value = sanitizeStudentId(studentId.value);
    setFieldError("studentId", validateStudentId(studentId.value));
    return;
  }

  setFieldError("studentId", studentId.value.trim() ? "" : "ID number is required.");
});

email.addEventListener("input", () => {
  const baseError = validateEmail(email.value);
  let nextError = baseError;
  if (!baseError && mode === "signup" && isStudentRole()) {
    nextError = validateStudentEmail(email.value);
  }
  setFieldError("email", nextError);
});

password.addEventListener("input", () => {
  setFieldError("password", validatePassword(password.value));
  if (mode === "signup") {
    setFieldError("confirmPassword", validateConfirmPassword(password.value, confirmPassword.value));
  }
});

confirmPassword.addEventListener("input", () => {
  setFieldError("confirmPassword", validateConfirmPassword(password.value, confirmPassword.value));
});

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    authMessage.textContent = "";
    clearFieldErrors();

    if (isRateLimited()) {
      authMessage.textContent = "Too many attempts. Please wait a minute before trying again.";
      return;
    }

    if (!validateBaseFields()) return;

    setSubmitBusy(true);

    try {
      const normalizedEmail = email.value.trim().toLowerCase();

      if (mode === "signup") {
        const role = registerRole.value;

        if (role === "maintenance_technician" && !maintenanceType.value) {
          authMessage.textContent = "Please select maintenance type.";
          return;
        }

        if (role === "staff" && !staffRank.value) {
          authMessage.textContent = "Please select staff rank.";
          return;
        }

        const credential = await registerWithEmailPassword({
          email: normalizedEmail,
          password: password.value,
          name: fullName.value.trim()
        });

        const userPayload = {
          name: fullName.value.trim(),
          email: normalizedEmail,
          login: normalizedEmail,
          role,
          approved: false,
          idNumber: studentId.value,
          studentId: studentId.value,
          createdAt: serverTimestamp()
        };

        if (role === "student") {
          const wingLabel = WING_CONFIG[wing.value]?.label || "";
          userPayload.wing = wing.value;
          userPayload.wingLabel = wingLabel;
          userPayload.lane = lane.value;
          userPayload.laneLabel = lane.value;
          userPayload.room = room.value;
          userPayload.gender = gender.value;
          userPayload.college = college.value;
          userPayload.department = department.value;
          userPayload.program = program.value;

          userPayload.area = wing.value;
          userPayload.areaLabel = wingLabel;
          userPayload.subdivision = lane.value.toLowerCase().replace(/\s+/g, "-");
          userPayload.subdivisionLabel = lane.value;
          userPayload.locationText = `${wingLabel} ${lane.value} ${room.value}`.trim();
        }

        if (role === "maintenance_technician") {
          const type = maintenanceType.value;
          userPayload.maintenanceType = type;
          userPayload.maintenanceLabel = type.charAt(0).toUpperCase() + type.slice(1);
          userPayload.allowedFaultTypes = TECHNICIAN_FAULTS[type] || [];
        }

        if (role === "staff") {
          userPayload.staffRank = staffRank.value;
        }

        await saveUserProfile(credential.user.uid, userPayload);

        showAuthToast("Account created successfully and pending administrator approval.");
        clearAuthForm();
        setMode("login");
        return;
      }

      const credential = await loginWithEmailPassword({
        email: normalizedEmail,
        password: password.value
      });

      const claims = await getTokenClaims(credential.user);
      if (claims.admin === true || claims.superAdmin === true) {
        window.location.href = "admin.html";
        return;
      }

      const profile = await getUserProfile(credential.user.uid);
      if (!profile) {
        authMessage.textContent = "Account not found. Please sign up.";
        return;
      }

      if (!profile.approved) {
        authMessage.textContent = "Your account is pending approval. Please check again later.";
        return;
      }

      window.location.href = resolveRoleRedirect(profile);
    } catch (error) {
      const code = error?.code || "";
      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password" ||
        code === "auth/user-not-found"
      ) {
        authMessage.textContent = "Incorrect email or password.";
      } else {
        authMessage.textContent = error?.message || "Authentication failed.";
      }
    } finally {
      await releaseSubmitBusy();
    }
  });
}

initTheme(themeToggle);
populateWingOptions();
populateLaneOptions();
populateRoomOptions();
syncGender();
hydrateAcademicHierarchy();
setMode("login");
