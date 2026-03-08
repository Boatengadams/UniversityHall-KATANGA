export const wireSearchableInput = ({ input, hidden, listId, values = [], placeholder = "Search..." }) => {
  if (!input || !hidden) return () => {};

  const datalist = document.createElement("datalist");
  datalist.id = listId;
  input.setAttribute("list", listId);
  input.setAttribute("placeholder", placeholder);
  input.insertAdjacentElement("afterend", datalist);

  const setValues = (nextValues) => {
    const uniqueValues = [...new Set(nextValues.filter(Boolean))];
    datalist.innerHTML = uniqueValues.map((value) => `<option value="${value}"></option>`).join("");
  };

  const syncHiddenValue = () => {
    const selected = values.includes(input.value) ? input.value : "";
    hidden.value = selected;
  };

  input.addEventListener("input", syncHiddenValue);
  input.addEventListener("blur", syncHiddenValue);

  setValues(values);

  return (nextValues) => {
    values = nextValues;
    setValues(values);
    syncHiddenValue();
  };
};
