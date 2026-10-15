export const objectsEqual = (o1: any, o2: any): boolean => {
  if (!o1 || !o2) return false; // Early exit for undefined/null values

  const o1Keys = Object.keys(o1);
  const o2Keys = Object.keys(o2);

  // Check for same number of keys
  if (o1Keys.length !== o2Keys.length) return false;

  // Compare each key-value pair
  for (const key of o1Keys) {
    const v1 = o1[key];
    const v2 = o2[key];

    // Check for arrays
    if (Array.isArray(v1) && Array.isArray(v2)) {
      if (!arraysEqual(v1, v2)) return false;
    } else if (!Array.isArray(v1) && !Array.isArray(v2)) {
      // Compare primitive types
      if (v1 !== v2) return false;
    } else {
      // One is array, the other is not, not equal
      return false;
    }
  }

  // All checks passed, objects are equal
  return true;
};

export const arraysEqual = (
  a1: any[] | undefined,
  a2: any[] | undefined
): boolean => {
  if (!a1 || !a2 || a1.length !== a2.length) return false;

  for (let i = 0; i < a1.length; i++) {
    const v1 = a1[i];
    const v2 = a2[i];

    // Check for objects
    if (typeof v1 === "object" && typeof v2 === "object") {
      if (!objectsEqual(v1, v2)) return false;
    } else if (typeof v1 !== "object" && typeof v2 !== "object") {
      // Compare primitive types
      if (v1 !== v2) return false;
    } else {
      // One is object, the other is not, not equal
      return false;
    }
  }

  // All checks passed, arrays are equal
  return true;
};
