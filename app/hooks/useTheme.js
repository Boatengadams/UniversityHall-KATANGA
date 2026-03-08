const STORAGE_KEY = "edutec-theme";

export const initTheme = (toggleButton) => {
  const saved = localStorage.getItem(STORAGE_KEY);
  const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (preferredDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);

  if (toggleButton) {
    toggleButton.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
    toggleButton.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(STORAGE_KEY, next);
      toggleButton.textContent = next === "dark" ? "Light Mode" : "Dark Mode";
    });
  }
};
