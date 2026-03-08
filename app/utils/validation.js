import { STUDENT_EMAIL_REGEX } from "../lib/catalogs.js";

export const sanitizeName = (value) =>
  String(value || "")
    .replace(/[^A-Za-z\s]/g, "")
    .replace(/\s{2,}/g, " ")
    .trimStart();

export const sanitizeStudentId = (value) => String(value || "").replace(/\D/g, "").slice(0, 8);

export const validateEmail = (email) => {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return "Email is required.";
  const genericEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!genericEmailRegex.test(normalized)) return "Please enter a valid email address.";
  return "";
};

export const validateStudentEmail = (email) => {
  const normalized = String(email || "").trim().toLowerCase();
  if (!STUDENT_EMAIL_REGEX.test(normalized)) {
    return "Please enter a valid KNUST student email";
  }
  return "";
};

export const validatePassword = (password) => {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return "";
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return "Please confirm your password.";
  if (password !== confirmPassword) return "Passwords do not match.";
  return "";
};

export const validateStudentId = (value) => {
  const id = sanitizeStudentId(value);
  if (!id) return "Student ID is required.";
  if (id.length !== 8) return "Student ID must contain exactly 8 digits.";
  return "";
};

export const validateName = (value) => {
  const name = String(value || "").trim();
  if (!name) return "Name is required.";
  if (!/^[A-Za-z]+(?:\s+[A-Za-z]+)+$/.test(name)) {
    return "Use letters and spaces only (at least two names).";
  }
  return "";
};
