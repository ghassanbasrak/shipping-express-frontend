export const removeArrayDuplicates = (arr) => {
  return arr.filter(
    (value, index, self) => index === self.findIndex((t) => t.id === value.id)
  );
};
