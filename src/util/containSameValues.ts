export const containSameValues = (
  arr1: (number | string)[],
  arr2: (number | string)[]
): boolean => {
  if (arr1.length !== arr2.length) return false;

  const arrSorted1 = arr1.slice(0).sort();
  const arrSorted2 = arr2.slice(0).sort();

  return arrSorted1.every((val1, ind) => val1 === arrSorted2[ind]);
};
